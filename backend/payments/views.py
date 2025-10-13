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
    p = Payment.objects.create(user=request.user, amount=amount)
    next_url = request.build_absolute_uri(reverse("payments:easypay_start", args=[p.id]))
    return JsonResponse({"id": str(p.id), "next": next_url}, status=201)


# --------------------------------------------------------------------------------------
# 2) Start Easypay flow: auto-POST form to Index.jsf
# --------------------------------------------------------------------------------------
@login_required
def easypay_start(request: HttpRequest, pk) -> HttpResponse:
    # Validate config every time we start a flow
    try:
        base, index_path, store_id, hash_key = _require_easypay_config()
    except RuntimeError as e:
        return HttpResponseBadRequest(str(e))

    p = get_object_or_404(Payment, pk=pk, user=request.user)

    # OrderRefNum: digits-only and <= 20 chars (gateways can be strict)
    digits_ref = timezone.now().strftime("%y%m%d%H%M%S") + f"{random.randint(10**5, 10**6-1)}"
    order_ref = digits_ref[:20]
    if p.merchant_order_id != order_ref:
        p.merchant_order_id = order_ref
        p.save(update_fields=["merchant_order_id"])

    amount_str = f"{float(p.amount):.1f}"  # exactly one decimal place
    time_stamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")  # keep this format
    payment_method = "MA"  # Easypaisa wallet (per docs)

    post_back_url_step1 = request.build_absolute_uri(reverse("payments:easypay_token_handler"))

    # Canonical field order (must match the posted fields)
    # Do NOT URL-encode in this string; raw values joined by & in this exact order.
    pairs = [
        ("storeId", store_id),
        ("amount", amount_str),
        ("postBackURL", post_back_url_step1),
        ("orderRefNum", order_ref),
        ("timeStamp", time_stamp),
        ("paymentMethod", payment_method),
    ]
    raw = "&".join(f"{k}={v}" for k, v in pairs)

    # AES/ECB/PKCS5 -> Base64 over the raw canonical string
    merchant_hashed_req = aes_ecb_pkcs5_base64(raw, hash_key)

    # Render auto-submit form (keep manual redirect during integration)
    endpoint = base + index_path
    fields = dict(pairs)
    fields["merchantHashedReq"] = merchant_hashed_req
    fields["autoRedirect"] = "0"

    # store for debugging
    p.request_payload = {"_endpoint": endpoint, "_canonical": raw, "outbound": fields}
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
    status_val = (request.GET.get("status") or "").strip().lower()  # 'success'/'failed'/etc.
    desc = (request.GET.get("desc") or "").strip()
    order_ref = (request.GET.get("orderRefNumber") or "").strip()
    provider_txn_id = (request.GET.get("transactionId") or "").strip()

    p = None
    if order_ref:
        try:
            p = Payment.objects.get(merchant_order_id=order_ref)
        except Payment.DoesNotExist:
            p = None

    if p:
        # Keep raw data for audit
        p.webhook_payload = {**(p.webhook_payload or {}), "status_handler": request.GET.dict()}
        p.provider_txn_id = provider_txn_id or p.provider_txn_id

        # Interpret success (be lenient with variants)
        if status_val in {"success", "paid", "approved"} or desc == "0000":
            p.mark_success(provider_txn_id=p.provider_txn_id)
        elif status_val in {"failed", "declined", "rejected"}:
            p.mark_failed()
        else:
            p.save()

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

        p = Payment.objects.create(user=request.user, amount=amount)
        # jump straight into the Easypay flow
        return redirect("payments:easypay_start", pk=p.id)

    recent = Payment.objects.select_related("user").order_by("-initiated_at")[:20]
    return render(request, "payments/admin_dashboard.html", {"recent": recent})