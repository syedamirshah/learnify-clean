import uuid
from decimal import Decimal
from urllib.parse import urlencode
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status, views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.models import User
from core.utils import send_account_notification_email

from .models import Payment, PaymentLog
from .serializers import (
    PaymentSerializer,
    CreatePaymentSessionSerializer,
    PricingSerializer,
)


# ---------- helpers ----------

def _make_invoice_id() -> str:
    # short, unique merchant invoice id; fits most gateways
    return timezone.now().strftime("%Y%m%d") + "-" + uuid.uuid4().hex[:12].upper()


def _apply_subscription(user: User, plan: str) -> None:
    """
    Centralized subscription activation/extension logic.
    This mirrors your existing patterns: set plan, extend expiry, activate account,
    and reset renewal flag.
    """
    today = timezone.now().date()
    current_expiry = user.subscription_expiry or today

    if plan == "monthly":
        new_expiry = max(today, current_expiry) + timezone.timedelta(days=30)
    elif plan == "yearly":
        new_expiry = max(today, current_expiry) + timezone.timedelta(days=365)
    else:
        # default safety
        new_expiry = max(today, current_expiry) + timezone.timedelta(days=30)

    user.subscription_plan = plan
    user.subscription_expiry = new_expiry
    user.account_status = "active"
    user.is_active = True
    # clear any renewal flags
    user.renewal_requested = False
    user.renewal_plan_requested = None
    user.save()


def _build_gateway_redirect(payment: Payment) -> str:
    """
    Build a hosted checkout URL or handoff endpoint for the selected provider.
    This is deliberately simple and parameterized so you can replace with
    true gateway endpoints later.
    """
    # Where user returns after the payment (frontend route)
    # Your frontend can read ?payment_id= and then call /api/payments/status/<id>/
    frontend_return = getattr(settings, "PUBLIC_FRONTEND_ORIGIN", "https://learnifypakistan.com").rstrip("/")
    return_to = f"{frontend_return}/payment/return?payment_id={payment.id}"

    # Server-side callback (optional; GET for simplicity)
    backend_origin = getattr(settings, "PUBLIC_BACKEND_ORIGIN", "").rstrip("/")
    if backend_origin:
        callback = f"{backend_origin}/api/payments/callback/{payment.provider}/"
    else:
        # relative (works if same domain)
        callback = "/api/payments/callback/{}/".format(payment.provider)

    base_params = {
        "invoice": payment.merchant_invoice_id,
        "amount": str(payment.amount),
        "currency": payment.currency,
        "plan": payment.plan,
        "return_url": return_to,
        "callback_url": callback,
        "payment_id": str(payment.id),
        "user": payment.user.username,
    }

    if payment.provider == Payment.Provider.EASYPaisa:
        # Placeholder – replace with Easypaisa session/URL when ready
        base_url = settings.EASYPAY["BASE_URL"].rstrip("/") if hasattr(settings, "EASYPAY") else "https://easypaisa.example/checkout"
    else:
        # JazzCash placeholder
        base_url = settings.JAZZCASH["BASE_URL"].rstrip("/") if hasattr(settings, "JAZZCASH") else "https://jazzcash.example/checkout"

    return f"{base_url}?{urlencode(base_params)}"


# ---------- endpoints ----------

class PricingView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        pricing = getattr(settings, "PAYMENT_PRICING", {})
        data = {
            "monthly": pricing.get("monthly", {}),
            "yearly": pricing.get("yearly", {}),
        }
        return Response(PricingSerializer(data).data)


class CreatePaymentSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        1) Validates provider + plan
        2) Creates a Payment row (PENDING)
        3) Builds a hosted checkout redirect URL (placeholder)
        4) Returns redirect_url + ids
        """
        ser = CreatePaymentSessionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        provider = ser.validated_data["provider"]
        plan = ser.validated_data["plan"]
        amount: Decimal = ser.validated_data["amount"]
        currency = ser.validated_data["currency"]

        invoice_id = _make_invoice_id()

        payment = Payment.objects.create(
            user=request.user,
            plan=plan,
            amount=amount,
            currency=currency,
            provider=provider,
            status=Payment.Status.PENDING,
            merchant_invoice_id=invoice_id,
            description=f"{plan.capitalize()} subscription for {request.user.username}",
        )

        # build URLs now that we have the payment
        redirect_url = _build_gateway_redirect(payment)
        payment.redirect_url = redirect_url

        # Set a return and callback URL for bookkeeping (also returned to frontend)
        frontend_return = getattr(settings, "PUBLIC_FRONTEND_ORIGIN", "https://learnifypakistan.com").rstrip("/")
        payment.return_url = f"{frontend_return}/payment/return?payment_id={payment.id}"

        backend_origin = getattr(settings, "PUBLIC_BACKEND_ORIGIN", "").rstrip("/")
        callback = f"{backend_origin}/api/payments/callback/{provider}/" if backend_origin else f"/api/payments/callback/{provider}/"
        payment.callback_url = callback
        payment.save(update_fields=["redirect_url", "return_url", "callback_url", "updated_at"])

        PaymentLog.objects.create(payment=payment, direction="out", payload={"event": "create_session", "provider": provider, "plan": plan, "amount": str(amount)})

        return Response(
            {
                "payment_id": str(payment.id),
                "invoice": payment.merchant_invoice_id,
                "redirect_url": payment.redirect_url,
                "return_url": payment.return_url,
                "callback_url": payment.callback_url,
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.get(id=payment_id, user=request.user)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found."}, status=404)
        return Response(PaymentSerializer(payment).data)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def gateway_callback(request, provider: str):
    """
    Generic callback (GET) to mark a payment success/failure.
    You’ll update this once Easypaisa/JazzCash give you exact param names + signature.
    For now, we accept:
      ?payment_id=<uuid>&status=success|failed|cancelled&provider_txn_id=<str>
    """
    payment_id = request.GET.get("payment_id")
    status_param = (request.GET.get("status") or "").lower()
    provider_txn_id = request.GET.get("provider_txn_id", "")

    if not payment_id:
        return Response({"detail": "payment_id is required."}, status=400)

    try:
        payment = Payment.objects.get(id=payment_id)
    except Payment.DoesNotExist:
        return Response({"detail": "Payment not found."}, status=404)

    # Log the inbound payload
    PaymentLog.objects.create(payment=payment, direction="in", payload={"query": dict(request.GET), "provider": provider})

    # Idempotency: if already succeeded/applied, just return ok
    if payment.status == Payment.Status.SUCCESS and payment.subscription_applied:
        return Response({"detail": "Already processed."})

    # Very simple decision by 'status' at this stage
    if status_param == "success":
        payment.mark_success(provider_txn_id=provider_txn_id)

        # Apply subscription ONCE
        if not payment.subscription_applied:
            _apply_subscription(payment.user, payment.plan)
            payment.subscription_applied = True
            payment.save(update_fields=["subscription_applied", "updated_at"])

            # Notify by email (uses your existing utility)
            try:
                send_account_notification_email(payment.user, action="activated")
            except Exception:
                # don't fail the callback due to email issues
                pass

        return Response({"detail": "Payment recorded as successful."})

    elif status_param == "failed":
        payment.mark_failed(error_message="Gateway marked as failed.")
        return Response({"detail": "Payment recorded as failed."})

    elif status_param == "cancelled":
        payment.mark_cancelled()
        return Response({"detail": "Payment recorded as cancelled."})

    else:
        return Response({"detail": "Unknown status. Expect success|failed|cancelled."}, status=400)