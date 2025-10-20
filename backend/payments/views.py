from __future__ import annotations

import json
import random
from datetime import datetime
from typing import Any

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseBadRequest,
    JsonResponse,
)
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Payment
from .utils import aes_ecb_pkcs5_base64
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from django.core.paginator import Paginator

from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from .utils import aes_ecb_pkcs5_base64, sign_uid, unsign_uid   # add sign/unsign
from datetime import timedelta

# ---- Easypay config from settings (put values in your .env or settings.py) ----
EP_BASE    = getattr(settings, "EASYPAY_BASE",    "https://easypay.easypaisa.com.pk")  # prod base
EP_INDEX   = getattr(settings, "EASYPAY_INDEX_PATH",   "/easypay/Index.jsf")
EP_CONFIRM = getattr(settings, "EASYPAY_CONFIRM_PATH", "/easypay/Confirm.jsf")
EP_STORE_ID = getattr(settings, "EASYPAY_STORE_ID", "")
EP_HASH_KEY = getattr(settings, "EASYPAY_HASH_KEY", "")  # should be exactly 16 chars


def _require_easypay_config() -> tuple[str, str, str, str]:
    """
    Validate Easypay config at runtime (safer than assert at import).
    """
    base = EP_BASE
    index = EP_INDEX
    store = (EP_STORE_ID or "").strip()
    key = (EP_HASH_KEY or "").strip()
    if not store:
        raise RuntimeError("EASYPAY_STORE_ID is missing in settings/env.")
    if len(key) != 16:
        raise RuntimeError("EASYPAY_HASH_KEY must be exactly 16 characters.")
    return base, index, store, key


# --------------------------------------------------------------------------------------
# 1) Create a Payment (POST /api/payments/initiate/)
#    Body JSON: {"amount": 300.0}
#    Returns a URL to open: /api/payments/easypay/start/<uuid>/
# --------------------------------------------------------------------------------------
@login_required
@require_POST
def initiate(request: HttpRequest) -> JsonResponse:
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
    except Exception:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)

    try:
        amount = float(data.get("amount") or 0)
    except Exception:
        return JsonResponse({"detail": "Invalid amount."}, status=400)

    if amount <= 0:
        return JsonResponse({"detail": "Amount must be > 0."}, status=400)

    # Optional: verify config now so we fail early if misconfigured
    try:
        _require_easypay_config()
    except RuntimeError as e:
        return JsonResponse({"detail": str(e)}, status=500)

    # Create minimal payment row; adjust fields if your model requires more
    p = Payment.objects.create(
        user=request.user,
        amount=amount,
        plan="custom",   # ad-hoc API payment
        months=1,        # required by model (safe default)
    )
    next_url = request.build_absolute_uri(reverse("payments:easypay_start", args=[p.id]))
    return JsonResponse({"id": str(p.id), "next": next_url}, status=201)


# --------------------------------------------------------------------------------------
# 2) Start Easypay flow: auto-POST form to Index.jsf
# --------------------------------------------------------------------------------------
# REMOVE the @login_required here (we'll authorize via login OR token)
def easypay_start(request: HttpRequest, pk) -> HttpResponse:
    # Validate config every time we start a flow
    try:
        base, index_path, store_id, hash_key = _require_easypay_config()
    except RuntimeError as e:
        return HttpResponseBadRequest(str(e))

    # Load payment without tying it to the current user yet
    p = get_object_or_404(Payment, pk=pk)

    # Authorize: allow if (a) the owner is logged in OR (b) a valid token matches this user
    allowed = False
    if request.user.is_authenticated and p.user_id == request.user.id:
        allowed = True
    else:
        token = request.GET.get("token") or ""
        username = None
        if token:
            try:
                username = unsign_uid(token, max_age_seconds=86400)
            except Exception:
                username = None
        if username and username == getattr(p.user, "username", None):
            allowed = True

    if not allowed:
        return HttpResponseBadRequest("Not allowed.")

    # OrderRefNum: digits-only and <= 20 chars (gateways can be strict)
    digits_ref = timezone.now().strftime("%y%m%d%H%M%S") + f"{random.randint(10**5, 10**6-1)}"
    order_ref = digits_ref[:20]
    if p.merchant_order_id != order_ref:
        p.merchant_order_id = order_ref
        p.save(update_fields=["merchant_order_id"])

    # Amount and timestamp
        amount_str = f"{float(p.amount):.1f}"  # exactly one decimal place
    time_stamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")  # keep this format
    payment_method = "MA"  # MA wallet (enabled for your store)

    post_back_url_step1 = request.build_absolute_uri(
        reverse("payments:easypay_token_handler")
    )

    # --- IMPORTANT: canonical must follow the gateway’s required order ---
    # Do NOT sort keys; build the string in this exact order.
    pairs = [
        ("storeId", store_id),
        ("amount", amount_str),
        ("postBackURL", post_back_url_step1),
        ("orderRefNum", order_ref),
        ("timeStamp", time_stamp),
        ("paymentMethod", payment_method),
        # If you want the Easypay page to auto-redirect without showing their UI:
        # ("autoRedirect", "1"),
        # For manual review during integration keep it visible:
        ("autoRedirect", "0"),
    ]

    # Canonical string used for hashing – EXACTLY the same fields & order as posted.
    raw = "&".join(f"{k}={v}" for k, v in pairs)

    # AES/ECB/PKCS5 -> Base64 over the canonical string
    merchant_hashed_req = aes_ecb_pkcs5_base64(raw, hash_key)

    # Final POST payload: same fields + hash
    fields = dict(pairs)
    fields["merchantHashedReq"] = merchant_hashed_req

    endpoint = base + index_path

    # Save for debugging/trace
    p.request_payload = {
        "_endpoint": endpoint,
        "_canonical": raw,
        "outbound": fields,
    }
    p.save(update_fields=["request_payload"])

    return render(request, "payments/post_form.html", {"endpoint": endpoint, "fields": fields})


# --------------------------------------------------------------------------------------
# 3) Token handler: receives ?auth_token=... and auto-POSTs to Confirm.jsf
# --------------------------------------------------------------------------------------
@csrf_exempt  # Easypay will redirect the browser here
def easypay_token_handler(request: HttpRequest) -> HttpResponse:
    try:
        base, confirm_path, _, _ = EP_BASE, EP_CONFIRM, EP_STORE_ID, EP_HASH_KEY  # avoid raising here
    except Exception:
        base, confirm_path = EP_BASE, EP_CONFIRM

    auth_token = request.GET.get("auth_token", "")
    if not auth_token:
        return HttpResponseBadRequest("Missing auth_token")

    endpoint = base + confirm_path
    post_back_url_step2 = request.build_absolute_uri(reverse("payments:easypay_status_handler"))

    fields = {"auth_token": auth_token, "postBackURL": post_back_url_step2}
    return render(request, "payments/confirm_post.html", {"endpoint": endpoint, "fields": fields})


# --------------------------------------------------------------------------------------
# 4) Final status handler: Easypay calls with ?status=&desc=&orderRefNumber=
# --------------------------------------------------------------------------------------
@csrf_exempt
def easypay_status_handler(request: HttpRequest) -> HttpResponse:
    """
    Final status handler called by Easypay (browser redirect).
    Updates Payment and then:
      - If FRONTEND_RETURN_URL is set: redirect user there with
        ?pid=&status=&orderRef=&txn=&desc=
      - Else: return a simple 'OK'
    """
    # Accept both GET and POST (Easypay can vary)
    params = request.GET if request.method == "GET" else request.POST

    # Normalize inputs (be lenient with gateway variations)
    raw_status = (params.get("status") or "").strip()
    status_val = raw_status.lower()
    desc = (params.get("desc") or "").strip()

    order_ref = (
        (params.get("orderRefNumber") or "").strip()
        or (params.get("orderRefNum") or "").strip()
        or (params.get("orderRef") or "").strip()
        or (params.get("merchant_order_id") or "").strip()
    )

    provider_txn_id = (
        (params.get("transactionId") or "").strip()
        or (params.get("txn_id") or "").strip()
        or (params.get("trans_id") or "").strip()
    )

    p = None
    if order_ref:
        try:
            p = Payment.objects.get(merchant_order_id=order_ref)
        except Payment.DoesNotExist:
            p = None

    if p:
        # keep raw data for audit trail (append, don't overwrite)
        new_payload = params.dict() if hasattr(params, "dict") else dict(params)
        p.webhook_payload = {**(p.webhook_payload or {}), "status_handler": new_payload}

        if provider_txn_id:
            p.provider_txn_id = provider_txn_id

        # Interpret success/failure (desc == '0000' or status 'success/paid/approved')
        if status_val in {"success", "paid", "approved"} or desc == "0000":
            p.mark_success(provider_txn_id=p.provider_txn_id)

            # ✨ Activate or extend subscription based on what we stashed at creation time
            try:
                meta = p.request_payload or {}
                months = int(meta.get("selected_months") or 1)          # 1, 3, or 12
                plan   = (meta.get("selected_plan") or "").lower()      # "monthly" | "quarterly" | "yearly"

                user = p.user
                today = timezone.now().date()
                current_expiry = getattr(user, "subscription_expiry", None)

                # If user already has an active subscription, extend from that date; else start today
                start = current_expiry if (current_expiry and current_expiry > today) else today
                new_expiry = start + timedelta(days=30 * months)

                # Optional: save plan label if your model has it
                if hasattr(user, "subscription_plan") and plan:
                    user.subscription_plan = plan

                # Set/extend expiry if present on your model
                if hasattr(user, "subscription_expiry"):
                    user.subscription_expiry = new_expiry

                # Ensure activation flags
                if hasattr(user, "account_status"):
                    user.account_status = "active"
                user.is_active = True

                # Clear renewal flags if your model uses them
                if hasattr(user, "renewal_requested"):
                    user.renewal_requested = False
                if hasattr(user, "renewal_plan_requested"):
                    user.renewal_plan_requested = None

                user.save()
            except Exception:
                # Don't crash the handler if user update fails; payment is already marked success
                p.save()

            outcome = "success"

        elif status_val in {"failed", "declined", "rejected"}:
            p.mark_failed()
            outcome = "failed"
        else:
            # unknown / pending-ish — keep what we have
            p.save()
            outcome = status_val or "unknown"
    else:
        outcome = "unknown"

    # Friendly redirect to your frontend if configured
    return_to = getattr(settings, "FRONTEND_RETURN_URL", None)
    if return_to:
        from urllib.parse import urlencode
        q = urlencode({
            "pid": str(p.id) if p else "",
            "status": outcome,
            "orderRef": order_ref,
            "txn": provider_txn_id,
            "desc": desc,
        })
        return HttpResponseRedirect(f"{return_to}?{q}")

    return HttpResponse("OK")


@staff_member_required
def admin_payments_dashboard(request: HttpRequest) -> HttpResponse:
    """
    Lightweight, friendly admin page to:
      - start an Easypay payment by entering an amount
      - see the latest payments
    """
    if request.method == "POST":
        try:
            amount = float(request.POST.get("amount") or 0)
        except Exception:
            amount = 0

        if amount <= 0:
            messages.error(request, "Please enter a valid amount (> 0).")
            return redirect("payments_admin")

        p = Payment.objects.create(
            user=request.user,
            amount=amount,
            plan="admin",  # admin-started flow
            months=1,      # required by model
        )
        # jump straight into the Easypay flow
        return redirect("payments:easypay_start", pk=p.id)

    recent = Payment.objects.select_related("user").order_by("-initiated_at")[:20]
    return render(request, "payments/admin_dashboard.html", {"recent": recent})


@login_required
def my_payments(request: HttpRequest) -> JsonResponse:
    """Return the signed-in user's recent payments (JSON)."""
    limit = int(request.GET.get("limit") or 10)
    qs = Payment.objects.filter(user=request.user).order_by("-initiated_at")
    page = Paginator(qs, max(1, min(limit, 50))).page(1)
    data = [
        {
            "id": str(p.id),
            "amount": float(p.amount),
            "status": p.status,
            "orderRef": p.merchant_order_id,
            "providerTxnId": p.provider_txn_id,
            "initiatedAt": p.initiated_at.isoformat() if p.initiated_at else None,
            "completedAt": p.completed_at.isoformat() if p.completed_at else None,
        }
        for p in page.object_list
    ]
    return JsonResponse({"results": data})

@login_required
def payment_detail(request: HttpRequest, pk) -> JsonResponse:
    """Return JSON for a single payment owned by the user."""
    p = get_object_or_404(Payment, pk=pk, user=request.user)
    data = {
        "id": str(p.id),
        "amount": float(p.amount),
        "status": p.status,
        "orderRef": p.merchant_order_id,
        "providerTxnId": p.provider_txn_id,
        "initiatedAt": p.initiated_at.isoformat() if p.initiated_at else None,
        "completedAt": p.completed_at.isoformat() if p.completed_at else None,
        "desc": (p.webhook_payload or {}).get("status_handler", {}).get("desc"),
    }
    return JsonResponse(data)

def choose_plan(request):
    User = get_user_model()
    ctx: dict[str, Any] = {"user_obj": None, "username_entered": "", "error": ""}

    # --- 0) If username is provided without a token, resolve to user and
    #         immediately re-load this page WITH a signed token.
    # NOTE: Read token from GET or POST (form POST won't retain querystring).
    token = (request.GET.get("token") or request.POST.get("token") or "").strip()
    username_param = (request.GET.get("username") or "").strip()
    if username_param and not token:
        try:
            u = User.objects.get(username=username_param)
            new_token = sign_uid(u.username)
            # keep only the token in the URL (avoids accidentally double-submitting username)
            return redirect(f"{request.path}?token={new_token}")
        except User.DoesNotExist:
            ctx["error"] = "User not found. Please enter the correct User ID."
        ctx["username_entered"] = username_param  # keep what the user typed

    # --- 1) Token → resolve to user (defensive: never crash on bad token)
    if token and not ctx.get("user_obj"):
        username = None
        try:
            username = unsign_uid(token, max_age_seconds=86400)  # 24h
        except Exception:
            username = None  # swallow any bad/old/forged token errors

        if username:
            try:
                ctx["user_obj"] = User.objects.get(username=username)
            except User.DoesNotExist:
                ctx["error"] = "User not found."
        else:
            ctx["error"] = "Token invalid or expired. Please re-enter your User ID."

    # --- 2) If logged in, prefer that user (no need to type User ID)
    if request.user.is_authenticated and not ctx["user_obj"]:
        ctx["user_obj"] = request.user

    # --- 3) Step-1: manual entry of User ID (no token, not logged in)
    if request.method == "POST" and not token and not request.user.is_authenticated:
        username_input = (request.POST.get("username") or "").strip()
        if not username_input:
            ctx["error"] = "Please enter your User ID."
        else:
            try:
                user_obj = User.objects.get(username=username_input)
                new_token = sign_uid(user_obj.username)
                return redirect(f"{request.path}?token={new_token}")
            except User.DoesNotExist:
                ctx["error"] = "No user with that ID. Please double-check."
        ctx["username_entered"] = username_input
        return render(request, "payments/choose.html", ctx)

    # --- 4) Step-2: plan selected → create Payment and jump to Easypay
    # Accept both POST (normal) and GET (fallback when CSRF cookies can't be sent cross-site)
    if (token or request.user.is_authenticated) and (
        (request.method == "POST" and request.POST.get("plan"))
        or (request.method == "GET" and request.GET.get("plan"))
    ):
        carrier = request.POST if request.method == "POST" else request.GET
        plan = (carrier.get("plan") or "monthly").lower()

        # Define your plans here
        price_map = {"monthly": 10.0, "yearly": 100.0}  # your current test values
        months_map = {"monthly": 1, "yearly": 12}

        amount = price_map.get(plan, 10.0)
        months = months_map.get(plan, 1)

        if not ctx.get("user_obj"):
            ctx["error"] = "Session expired. Please re-enter your User ID."
            return render(request, "payments/choose.html", ctx)

        # Create the payment and persist the selected plan (model requires non-null plan)
        p = Payment.objects.create(
            user=ctx["user_obj"],
            amount=amount,
            plan=plan,      # model requires non-null
            months=months,  # model requires non-null
        )

        # Also stash plan/months for the final status handler
        meta = p.request_payload or {}
        meta.update({"selected_plan": plan, "selected_months": months})
        p.request_payload = meta
        p.save(update_fields=["request_payload"])

        # Ensure we *always* have a token for start step when the user isn't logged in
        out_token = token or (sign_uid(ctx["user_obj"].username) if not request.user.is_authenticated else "")
        extra = f"?token={out_token}" if out_token else ""

        return redirect(reverse("payments:easypay_start", args=[p.id]) + extra)
        # --- 5) Default GET render (initial load or any unhandled path) ---
    # This ensures the view always returns an HttpResponse object
    return render(request, "payments/choose.html", ctx)