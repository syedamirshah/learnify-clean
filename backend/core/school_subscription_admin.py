from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from core.models import SCHOOL_PLAN_MAX_STUDENTS, School

User = get_user_model()

DURATION_DAYS = {
    "month": 30,
    "year": 365,
}


def duration_days(duration: str) -> int:
    days = DURATION_DAYS.get(duration)
    if not days:
        raise ValueError("Invalid duration.")
    return days


def _sync_school_users_active(school: School, expiry) -> None:
    User.objects.filter(school=school, role="school_admin").update(
        account_status="active",
        is_active=True,
        subscription_expiry=expiry,
    )
    User.objects.filter(school=school, role__in=["student", "teacher"]).update(
        account_status="active",
        is_active=True,
        subscription_expiry=expiry,
    )


def _sync_school_users_disabled(school: School) -> None:
    User.objects.filter(
        school=school,
        role__in=["school_admin", "student", "teacher"],
    ).update(
        account_status="inactive",
        is_active=False,
    )


@transaction.atomic
def manually_activate_school(school: School, duration: str) -> School:
    """Activate a school license from today (admin manual billing)."""
    days = duration_days(duration)
    today = timezone.now().date()
    new_expiry = today + timedelta(days=days)

    school.account_status = "active"
    school.subscription_expiry = new_expiry
    if school.onboarding_status == "registered":
        school.onboarding_status = "paid"
    if school.max_students is None and school.plan_tier:
        school.max_students = SCHOOL_PLAN_MAX_STUDENTS.get(school.plan_tier)
    school.save()

    _sync_school_users_active(school, new_expiry)
    school.refresh_from_db()
    return school


@transaction.atomic
def manually_extend_school(school: School, duration: str) -> School:
    """Extend a school license from current expiry when still active."""
    days = duration_days(duration)
    today = timezone.now().date()
    current_expiry = school.subscription_expiry
    start = current_expiry if (current_expiry and current_expiry > today) else today
    new_expiry = start + timedelta(days=days)

    school.account_status = "active"
    school.subscription_expiry = new_expiry
    if school.onboarding_status == "registered":
        school.onboarding_status = "paid"
    school.save()

    _sync_school_users_active(school, new_expiry)
    school.refresh_from_db()
    return school


@transaction.atomic
def manually_disable_school(school: School) -> School:
    """Suspend a school and disable linked school users (no deletions)."""
    school.account_status = "suspended"
    school.save()

    _sync_school_users_disabled(school)
    school.refresh_from_db()
    return school
