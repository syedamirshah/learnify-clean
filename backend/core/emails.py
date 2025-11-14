# backend/core/emails.py
from django.conf import settings
from django.core.mail import send_mail


FRONTEND_LOGIN_URL = "https://www.learnifypakistan.com/login"
SUPPORT_EMAIL = "info@learnifypakistan.com"

def _safe_send(subject: str, message: str, recipient_list: list[str]) -> None:
    """Send an email safely without blocking on errors."""
    if not recipient_list:
        return
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=True,
        )
    except Exception:
        pass


# -------------------------------------------------------------
# (i) Account Creation
# -------------------------------------------------------------
def send_welcome_email(user, password: str = "") -> None:
    """Send a welcome email when a new account is created."""
    username = getattr(user, "username", "")
    full_name = getattr(user, "full_name", "") or username
    plan = getattr(user, "subscription_plan", "—")
    expiry = getattr(user, "subscription_expiry", None)

    expiry_text = f"\n• Subscription expiry: {expiry}" if expiry else ""
    plan_text = f"\n• Plan: {plan}" if plan and plan != "—" else ""
    password_text = f"\n• Password: {password}" if password else ""

    subject = "Welcome to Learnify Pakistan 🎉"
    body = (
        f"Assalamualaikum {full_name},\n\n"
        "Welcome to Learnify Pakistan!\n\n"
        "Your account has been created successfully.\n"
        "Here are your login details:\n"
        f"• Username: {username}"
        f"{password_text}"
        f"{plan_text}"
        f"{expiry_text}\n\n"
        f"Login here: {FRONTEND_LOGIN_URL}\n\n"
        f"If you need any help, reply to this email or write to {SUPPORT_EMAIL}.\n\n"
        "JazakAllah,\n"
        "Team Learnify Pakistan"
    )
    _safe_send(subject, body, [user.email])


# -------------------------------------------------------------
# (ii) Payment Success
# -------------------------------------------------------------
def send_payment_receipt_email(user, payment) -> None:
    """Send a confirmation email when payment succeeds."""
    username = getattr(user, "username", "")
    full_name = getattr(user, "full_name", "") or username
    plan = getattr(payment, "plan", "—")
    amount = getattr(payment, "amount", "—")
    order_id = getattr(payment, "merchant_order_id", "—")
    txn_id = getattr(payment, "provider_txn_id", "—")
    expiry = getattr(user, "subscription_expiry", "—")

    subject = "Payment Successful – Learnify Pakistan ✅"
    body = (
        f"Assalamualaikum {full_name},\n\n"
        "Alhamdulillah! Your payment was received successfully.\n\n"
        f"Payment details:\n"
        f"• Amount: PKR {amount}\n"
        f"• Plan: {plan}\n"
        f"• Order Ref: {order_id}\n"
        f"• Transaction ID: {txn_id}\n"
        f"• Subscription Expiry: {expiry}\n\n"
        f"You can now continue your learning journey at Learnify Pakistan.\n\n"
        f"For support, please contact {SUPPORT_EMAIL}.\n\n"
        "JazakAllah,\n"
        "Team Learnify Pakistan"
    )
    _safe_send(subject, body, [user.email])


# -------------------------------------------------------------
# (iii) Password Change
# -------------------------------------------------------------
def send_password_change_email(user, password: str = "") -> None:
    """Send a confirmation email after password change."""
    username = getattr(user, "username", "")
    full_name = getattr(user, "full_name", "") or username
    password_text = f"\n• New Password: {password}" if password else ""

    subject = "Your Learnify Pakistan Password Has Been Changed 🔐"
    body = (
        f"Assalamualaikum {full_name},\n\n"
        "This is to inform you that your Learnify Pakistan password was changed successfully.\n"
        "Here are your updated credentials:\n"
        f"• Username: {username}"
        f"{password_text}\n\n"
        "If you did not request this change, please reply to this email immediately.\n\n"
        "JazakAllah,\n"
        "Team Learnify Pakistan"
    )
    _safe_send(subject, body, [user.email])


    def send_subscription_expired_email(user) -> None:
        """Notify user when their subscription has expired."""
        username = getattr(user, "username", "")
        full_name = getattr(user, "full_name", "") or username
        expiry = getattr(user, "subscription_expiry", None)

        expiry_text = f" on {expiry}" if expiry else ""

        subject = "Your Learnify Pakistan Subscription Has Expired ⏰"
        body = (
            f"Assalamualaikum {full_name},\n\n"
            "This is to inform you that your Learnify Pakistan subscription has expired"
            f"{expiry_text}.\n\n"
            "You can renew your subscription any time to continue accessing quizzes and learning materials.\n\n"
            "To renew:\n"
            "1. Go to the Learnify Pakistan website.\n"
            "2. Login with your User ID.\n"
            "3. Go to the Membership / Make Payment page and complete your payment.\n\n"
            f"If you need any help, please contact {SUPPORT_EMAIL}.\n\n"
            "JazakAllah,\n"
            "Team Learnify Pakistan"
        )
        _safe_send(subject, body, [user.email])