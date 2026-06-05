from django.utils import timezone
from rest_framework.permissions import BasePermission


def has_active_subscription(user):
    """
    Paid learning access: active subscription status and unexpired date.
    Does not use Django is_active (that gates login for unpaid signups).
    """
    if not user or not getattr(user, "is_authenticated", False):
        return False

    role = getattr(user, "role", None) or ""
    if role == "teacher":
        return True
    if (
        getattr(user, "is_superuser", False)
        or getattr(user, "is_staff", False)
        or role in ("admin", "manager")
    ):
        return True

    today = timezone.now().date()
    expiry = getattr(user, "subscription_expiry", None)
    if expiry and expiry < today:
        return False

    if getattr(user, "account_status", None) != "active":
        return False

    if not expiry:
        return False

    return True


class HasPaidSubscription(BasePermission):
    message = "An active subscription is required to access this resource."

    def has_permission(self, request, view):
        return has_active_subscription(request.user)
