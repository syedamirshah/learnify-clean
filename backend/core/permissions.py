from django.utils import timezone
from rest_framework.permissions import BasePermission


def _get_user_school(user):
    school = getattr(user, "school", None)
    if school is not None:
        return school
    school_id = getattr(user, "school_id", None)
    if not school_id:
        return None
    from core.models import School

    try:
        return School.objects.get(pk=school_id)
    except School.DoesNotExist:
        return None


def school_subscription_active(school):
    if not school:
        return False
    if getattr(school, "account_status", None) != "active":
        return False
    expiry = getattr(school, "subscription_expiry", None)
    if not expiry:
        return False
    return expiry >= timezone.now().date()


def has_active_subscription(user):
    """
    Paid learning access: active subscription status and unexpired date.
    Does not use Django is_active (that gates login for unpaid signups).
    School-linked users may also pass via an active school license (read-through).
    """
    if not user or not getattr(user, "is_authenticated", False):
        return False

    role = getattr(user, "role", None) or ""
    if (
        getattr(user, "is_superuser", False)
        or getattr(user, "is_staff", False)
        or role in ("admin", "manager")
    ):
        return True

    if role == "teacher":
        return True

    if role == "school_admin":
        return _get_user_school(user) is not None

    school = _get_user_school(user)
    if school_subscription_active(school):
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
