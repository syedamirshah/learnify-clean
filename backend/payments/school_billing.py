from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from core.models import SCHOOL_PLAN_MAX_STUDENTS, SCHOOL_PLAN_PRICING_PKR, School

User = get_user_model()

SCHOOL_BILLING_DAYS = {
    "monthly": 30,
    "yearly": 365,
}


def school_plan_amount(plan_tier: str, billing_cycle: str) -> float:
    try:
        return float(SCHOOL_PLAN_PRICING_PKR[plan_tier][billing_cycle])
    except KeyError as exc:
        raise ValueError("Invalid school plan tier or billing cycle.") from exc


def school_billing_days(billing_cycle: str) -> int:
    days = SCHOOL_BILLING_DAYS.get(billing_cycle)
    if not days:
        raise ValueError("Invalid billing cycle.")
    return days


def build_school_payment_metadata(school: School) -> dict:
    billing_cycle = school.billing_cycle
    return {
        "payment_type": "school",
        "school_id": school.id,
        "plan_tier": school.plan_tier,
        "billing_cycle": billing_cycle,
        "billing_days": school_billing_days(billing_cycle),
        "selected_plan": billing_cycle,
        "selected_months": 1 if billing_cycle == "monthly" else 12,
    }


def validate_school_payment_access(school_id, username: str) -> tuple[School, User]:
    try:
        school = School.objects.get(pk=school_id)
    except (School.DoesNotExist, TypeError, ValueError):
        raise ValueError("School not found.")

    try:
        user = User.objects.get(
            username__iexact=username,
            role="school_admin",
            school=school,
        )
    except User.DoesNotExist:
        raise ValueError("School administrator not found for this school.")

    return school, user


def activate_individual_subscription_from_payment(payment) -> None:
    """Existing student/individual subscription activation (unchanged behavior)."""
    meta = payment.request_payload or {}
    months = int(meta.get("selected_months") or getattr(payment, "months", 1) or 1)
    plan = (meta.get("selected_plan") or getattr(payment, "plan", "") or "").lower()

    user = payment.user
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


def activate_school_license_from_payment(payment) -> bool:
    meta = payment.request_payload or {}
    if meta.get("payment_type") != "school":
        return False

    school_id = meta.get("school_id")
    if not school_id:
        return False

    school = School.objects.get(pk=school_id)
    admin = payment.user
    if admin.school_id != school.id or admin.role != "school_admin":
        raise ValueError("Payment user is not the school administrator for this school.")

    billing_cycle = meta.get("billing_cycle") or school.billing_cycle
    plan_tier = meta.get("plan_tier") or school.plan_tier
    days = int(meta.get("billing_days") or school_billing_days(billing_cycle))

    today = timezone.now().date()
    current_expiry = school.subscription_expiry
    start = current_expiry if (current_expiry and current_expiry > today) else today
    new_expiry = start + timedelta(days=days)

    school.account_status = "active"
    school.plan_tier = plan_tier
    school.billing_cycle = billing_cycle
    school.subscription_expiry = new_expiry
    school.max_students = SCHOOL_PLAN_MAX_STUDENTS.get(plan_tier)
    if school.onboarding_status in ("registered", "paid"):
        school.onboarding_status = "paid"
    school.save(update_fields=[
        "account_status",
        "plan_tier",
        "billing_cycle",
        "subscription_expiry",
        "max_students",
        "onboarding_status",
        "updated_at",
    ])

    admin.account_status = "active"
    admin.is_active = True
    admin.subscription_expiry = new_expiry
    admin.save(update_fields=["account_status", "is_active", "subscription_expiry"])

    User.objects.filter(school=school, role__in=["student", "teacher"]).update(
        account_status="active",
        is_active=True,
        subscription_expiry=new_expiry,
    )
    return True
