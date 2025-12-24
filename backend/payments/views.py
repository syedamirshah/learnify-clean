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
from django.db.models import Sum

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

        # ----- Build Easypay POST (Index.jsf) exactly as per guide -----
    # Amount in 1 decimal place
    amount_str = f"{float(p.amount):.1f}"

    post_back_url_step1 = request.build_absolute_uri(
        reverse("payments:easypay_token_handler")
    ) + f"?pid={p.id}"

    # Base fields we will POST (keep this set minimal and per spec)
    fields = {
        "amount": amount_str,
        "autoRedirect": getattr(settings, "EASYPAY_AUTO_REDIRECT", "1"),
        "orderRefNum": order_ref,
        "postBackURL": post_back_url_step1,
        "storeId": store_id,
    }

    # Optional: force a payment method (ONLY if you really need to).
    # Valid values: OTC_PAYMENT_METHOD | MA_PAYMENT_METHOD | CC_PAYMENT_METHOD | QR_PAYMENT_METHOD
    force_method = getattr(settings, "EASYPAY_PAYMENT_METHOD", "").strip()
    if force_method:
        fields["paymentMethod"] = force_method  # e.g. "MA_PAYMENT_METHOD"

    # ----- Hash per guide: sort keys alphabetically, join as k=v with & -----
    # This canonical MUST be built from the EXACT keys you will post.
    canonical = "&".join(f"{k}={fields[k]}" for k in sorted(fields.keys()))

    # AES/ECB/PKCS5Padding over canonical -> Base64
    merchant_hashed_req = aes_ecb_pkcs5_base64(canonical, hash_key)

    # Add the hash to the outbound fields
    fields["merchantHashedReq"] = merchant_hashed_req

    endpoint = base + index_path

    # Save for debugging/trace
    p.request_payload = {
        "_endpoint": endpoint,
        "_canonical": canonical,
        "outbound": fields,
    }
    p.save(update_fields=["request_payload"])

    return render(request, "payments/post_form.html", {"endpoint": endpoint, "fields": fields})

# --------------------------------------------------------------------------------------
# 3) Token handler: receives ?auth_token=... and auto-POSTs to Confirm.jsf
# --------------------------------------------------------------------------------------
@csrf_exempt
def easypay_token_handler(request: HttpRequest) -> HttpResponse:
    try:
        base, confirm_path, store_id, _ = EP_BASE, EP_CONFIRM, EP_STORE_ID, EP_HASH_KEY
    except Exception:
        base, confirm_path, store_id = EP_BASE, EP_CONFIRM, EP_STORE_ID  # keep going

    auth_token = request.GET.get("auth_token", "")
    if not auth_token:
        return HttpResponseBadRequest("Missing auth_token")

    endpoint = base + confirm_path
    post_back_url_step2 = request.build_absolute_uri(reverse("payments:easypay_status_handler"))

    # ✅ Include storeId here (many integrations require it on Confirm)
    fields = {
        "auth_token": auth_token,
        "storeId": (store_id or "").strip(),
        "postBackURL": post_back_url_step2,
    }
    return render(request, "payments/confirm_post.html", {"endpoint": endpoint, "fields": fields})

# --------------------------------------------------------------------------------------
# 4) Final status handler: Easypay calls with ?status=&desc=&orderRefNumber=
# --------------------------------------------------------------------------------------
from django.utils import timezone
from urllib.parse import urlencode
from datetime import timedelta

@csrf_exempt
def easypay_status_handler(request: HttpRequest) -> HttpResponse:
    """
    Final status handler called by Easypay (browser redirect).
    Updates Payment and then redirects to the configured FRONTEND_* URL
    with ?pid=&status=&orderRef=&txn=&desc=.
    """
    # Accept both GET and POST; combine so we don't miss keys
    if request.method == "GET":
        params = request.GET.copy()
        params.update(request.POST)
    else:
        params = request.POST.copy()
        params.update(request.GET)

    def _pick(*keys: str, default: str = "") -> str:
        for k in keys:
            v = params.get(k)
            if v is not None and str(v).strip() != "":
                return str(v).strip()
        return default

    # ---- Normalize incoming fields (wider coverage) ----
    raw_status = _pick(
        "status", "Status", "STATUS",
        "result", "Result", "RESULT",
        "paymentStatus", "PaymentStatus", "PAYMENTSTATUS",
        "payStatus", "PayStatus", "PAYSTATUS",
        "transactionStatus", "TransactionStatus", "TRANSACTIONSTATUS",
        default=""
    )
    status_val = raw_status.lower().strip()  # ✅ define it

    desc = _pick(
        "desc", "Desc", "DESC",
        "reason", "Reason", "REASON",
        "message", "Message", "MESSAGE",
        "description", "Description", "DESCRIPTION",
        default=""
    )

    response_code = _pick(
        "responseCode", "ResponseCode", "RESPONSECODE",
        "code", "Code", "CODE",
        "respCode", "RespCode", "RESPCODE",
        "statusCode", "StatusCode", "STATUSCODE",
        default=""
    )

    message = _pick("message", "Message", "MESSAGE", "remarks", "Remarks", "REMARKS", default="")

    order_ref = (
        _pick("orderRefNumber", "OrderRefNumber") or
        _pick("orderRefNum") or
        _pick("orderRef") or
        _pick("merchant_order_id") or
        ""
    )

    # Provider Txn ID – include Easypay's transactionRefNumber variant
    provider_txn_id = (
        _pick(
            "transactionRefNumber", "transactionId", "TransactionId", "TransactionID",
            "txn_id", "trans_id", "transaction_id", "bankTransId", "tranRef", "trx_id", "paymentId"
        ) or ""
    )

    # Optional: compare amounts if present
    amt_str = _pick("amount", "Amount", "AMOUNT", default="")
    try:
        amount_from_gateway = float(amt_str) if amt_str else None
    except Exception:
        amount_from_gateway = None

    p = None
    if order_ref:
        try:
            p = Payment.objects.get(merchant_order_id=order_ref)
        except Payment.DoesNotExist:
            p = None

    # Fallback by pid we may have injected earlier
    if p is None:
        pid = _pick("pid")
        if pid:
            try:
                p = Payment.objects.get(pk=pid)
            except Payment.DoesNotExist:
                p = None

    if p:
        # keep raw data for audit trail (append, don't overwrite)
        new_payload = params.dict() if hasattr(params, "dict") else dict(params)
        p.webhook_payload = {**(p.webhook_payload or {}), "status_handler": new_payload}

        if provider_txn_id:
            p.provider_txn_id = provider_txn_id

        # 🔒 Idempotency guard: if we've already marked this payment successful,
        # do NOT extend subscription again on repeated callbacks or refreshes.
        if p.status == Payment.Status.SUCCESS:
            p.save(update_fields=["webhook_payload", "provider_txn_id"])
            outcome = "success"
        else:
            # ---- Decide success (your existing heuristics) ----
            success_flags = {"success", "paid", "approved", "completed", "succeeded", "ok", "captured", "1", "true", "yes"}
            ok_codes = {"0000", "00", "0", "200"}

            looks_success = (
                (status_val in success_flags) or
                (desc.lower() in success_flags if desc else False) or
                (response_code.lower() in success_flags if response_code else False) or
                (desc in ok_codes) or
                (response_code in ok_codes) or
                ("success" in message.lower())
            )

            # Pragmatic fallback: if we have a provider_txn_id and amount matches (when provided), treat as success.
            if not looks_success and provider_txn_id:
                if amount_from_gateway is None or float(p.amount) == float(amount_from_gateway):
                    looks_success = True

            if looks_success:
                # Mark success FIRST so repeat hits short-circuit next time.
                p.mark_success(provider_txn_id=p.provider_txn_id)

                # Activate/extend subscription (once)
                try:
                    meta = p.request_payload or {}
                    months = int(meta.get("selected_months") or getattr(p, "months", 1) or 1)
                    plan = (meta.get("selected_plan") or getattr(p, "plan", "") or "").lower()

                    user = p.user
                    today = timezone.now().date()
                    current_expiry = getattr(user, "subscription_expiry", None)
                    start = current_expiry if (current_expiry and current_expiry > today) else today
                    new_expiry = start + timedelta(days=30 * months)

                    if hasattr(user, "subscription_plan") and plan:
                        user.subscription_plan = plan
                    if hasattr(user, "subscription_expiry"):
                        user.subscription_expiry = new_expiry
                    if hasattr(user, "account_status"):
                        user.account_status = "active"
                    user.is_active = True
                    if hasattr(user, "renewal_requested"):
                        user.renewal_requested = False
                    if hasattr(user, "renewal_plan_requested"):
                        user.renewal_plan_requested = None
                    user.save()
                except Exception:
                    # Don't block the redirect even if user update fails
                    p.save()

                outcome = "success"

            elif status_val in {"failed", "declined", "rejected"}:
                p.mark_failed()
                outcome = "failed"
            else:
                p.save()
                outcome = status_val or response_code or "unknown"
    else:
        outcome = "unknown"

            # ---- Redirect to frontend result page (with sensible defaults) ----
    default_return = getattr(settings, "FRONTEND_RETURN_URL", None)
    success_to     = getattr(settings, "FRONTEND_SUCCESS_URL", None)
    failure_to     = getattr(settings, "FRONTEND_FAILURE_URL", None)
    frontend_base  = (getattr(settings, "FRONTEND_BASE_URL", "") or "").rstrip("/")

    # Choose the base target
    if outcome == "success":
        base_url = success_to or "/"
    elif outcome == "failed":
        base_url = failure_to or (default_return or "/")
    else:
        base_url = default_return or "/"

    # Helper to make absolute on the frontend host
    def _absolutize(url: str) -> str:
        if not url:
            return "https://learnifypakistan.com/"
        if url.lower().startswith(("http://", "https://")):
            return url
        if frontend_base:
            return f"{frontend_base}/{url.lstrip('/')}"
        return "https://learnifypakistan.com/"

    # Build final redirect URL safely; never raise
    try:
        base_url = _absolutize(base_url)

        from urllib.parse import urlencode, urlsplit, urlunsplit

        qdict = {
            "pid":     str(p.id) if p else "",
            "status":  outcome,
            "orderRef": order_ref,
            "txn":     provider_txn_id,
            "desc":    (desc or response_code or message),
        }

        parts = list(urlsplit(base_url))  # scheme, netloc, path, query, fragment
        existing_q = parts[3]
        new_q = urlencode(qdict, doseq=False)
        parts[3] = (existing_q + "&" + new_q) if existing_q else new_q
        final_url = urlunsplit(parts)

        return HttpResponseRedirect(final_url)
    except Exception as e:
        # Last-resort: log and send user somewhere safe rather than 500
        import logging
        logging.getLogger(__name__).exception("Status handler redirect failed: %s", e)

        fallback = _absolutize(default_return or success_to or "/")
        return HttpResponseRedirect(fallback)

@staff_member_required
def admin_payments_dashboard(request: HttpRequest) -> HttpResponse:
    """
    Admin payments overview (no manual 'start payment' here).
    Adds a simple time-range filter and summary stats.

    Supported ?range= values:
      - 7d  -> last 7 days
      - 30d -> last 30 days (default)
      - 3m  -> last ~90 days
      - 1y  -> last ~365 days
    """
    # -------- range filter --------
    range_key = (request.GET.get("range") or "30d").lower()
    days_map = {"7d": 7, "30d": 30, "3m": 90, "1y": 365}
    days = days_map.get(range_key, 30)

    now = timezone.now()
    start = now - timedelta(days=days)

    # -------- base queryset --------
    qs = (
        Payment.objects
        .select_related("user")
        .filter(initiated_at__gte=start)
        .order_by("-initiated_at")
    )

    # -------- quick stats --------
    stats = {
        "count": qs.count(),
        "sum": float(qs.aggregate(Sum("amount"))["amount__sum"] or 0),
        "success": qs.filter(status=Payment.Status.SUCCESS).count(),
        "failed": qs.filter(status=Payment.Status.FAILED).count(),
        "pending": qs.filter(status=Payment.Status.PENDING).count(),
    }

    # show a reasonable number of rows
    recent = list(qs[:200])

    return render(
        request,
        "payments/admin_dashboard.html",
        {"recent": recent, "range_key": range_key, "stats": stats},
    )


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

        # Define your plans here (Learnify Pakistan final fees)
        # Monthly: Rs. 200
        # Yearly: 12 × 200 = 2400 → 25% OFF = 1800
        price_map = {
            "monthly": 200.0,  # Rs. 200 per month
            "yearly": 1800.0,  # Rs. 1800 per year (25% off)
        }
        months_map = {"monthly": 1, "yearly": 12}

        amount = price_map.get(plan, 200.0)   # default also 200 now
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