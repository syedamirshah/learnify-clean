from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

from core.models import School
from core.roster_upload import _roster_user_activation_fields

User = get_user_model()

LINKABLE_ROLES = ("student", "teacher")
SKIP_AMBIGUOUS = "ambiguous_school_match"
SKIP_NO_SCHOOL = "no_school_match"
SKIP_MISSING_FIELDS = "missing_school_name_or_city"


@dataclass(frozen=True)
class LegacyUserLinkAction:
    user_id: int
    username: str
    role: str
    grade: str | None
    school_id: int
    school_name: str
    school_city: str


@dataclass(frozen=True)
class LegacyUserSkip:
    user_id: int
    username: str
    role: str
    grade: str | None
    school_name: str | None
    city: str | None
    reason: str


def schools_matching_name_city(school_name, city):
    name = (school_name or "").strip()
    city_value = (city or "").strip()
    if not name or not city_value:
        return School.objects.none()
    return School.objects.filter(name__iexact=name, city__iexact=city_value)


def classify_school_matches(matches):
    if len(matches) == 1:
        return matches[0], None
    if len(matches) == 0:
        return None, SKIP_NO_SCHOOL
    return None, SKIP_AMBIGUOUS


def resolve_school_match(school_name, city):
    if not (school_name or "").strip() or not (city or "").strip():
        return None, SKIP_MISSING_FIELDS
    matches = list(schools_matching_name_city(school_name, city))
    return classify_school_matches(matches)


def legacy_users_queryset():
    return (
        User.objects.filter(role__in=LINKABLE_ROLES, school_id__isnull=True)
        .exclude(
            Q(school_name__isnull=True)
            | Q(school_name__exact="")
            | Q(city__isnull=True)
            | Q(city__exact="")
        )
        .select_related("grade")
        .order_by("school_name", "city", "role", "username")
    )


def _grade_label(user):
    if user.grade_id and user.grade:
        return user.grade.name
    return None


def build_legacy_school_link_plan():
    to_link: list[LegacyUserLinkAction] = []
    skipped: list[LegacyUserSkip] = []

    for user in legacy_users_queryset():
        school, skip_reason = resolve_school_match(user.school_name, user.city)
        grade = _grade_label(user)
        if school:
            to_link.append(
                LegacyUserLinkAction(
                    user_id=user.id,
                    username=user.username,
                    role=user.role,
                    grade=grade,
                    school_id=school.id,
                    school_name=school.name,
                    school_city=school.city,
                )
            )
            continue

        skipped.append(
            LegacyUserSkip(
                user_id=user.id,
                username=user.username,
                role=user.role,
                grade=grade,
                school_name=user.school_name,
                city=user.city,
                reason=skip_reason or SKIP_NO_SCHOOL,
            )
        )

    return {"to_link": to_link, "skipped": skipped}


def apply_legacy_school_link_plan(plan):
    linked_count = 0

    with transaction.atomic():
        for action in plan["to_link"]:
            user = User.objects.select_for_update().get(pk=action.user_id)
            school = School.objects.get(pk=action.school_id)

            activation = _roster_user_activation_fields(school)
            user.school = school
            user.school_name = school.name
            user.city = school.city
            user.province = school.province
            user.account_status = activation["account_status"]
            user.is_active = activation["is_active"]
            user.subscription_expiry = activation["subscription_expiry"]
            user.save(
                update_fields=[
                    "school",
                    "school_name",
                    "city",
                    "province",
                    "account_status",
                    "is_active",
                    "subscription_expiry",
                ]
            )
            linked_count += 1

    return linked_count


def format_legacy_school_link_report(plan, *, apply: bool) -> str:
    lines: list[str] = []
    if apply:
        lines.append("APPLY MODE — linking legacy users to matched schools.")
    else:
        lines.append("DRY RUN — no changes will be made. Pass --apply to link users.")
    lines.append("")

    grouped: dict[tuple[int, str, str], list[LegacyUserLinkAction]] = {}
    for action in plan["to_link"]:
        key = (action.school_id, action.school_name, action.school_city)
        grouped.setdefault(key, []).append(action)

    if grouped:
        for (school_id, school_name, school_city), actions in sorted(
            grouped.items(),
            key=lambda item: (item[0][1].lower(), item[0][2].lower()),
        ):
            lines.append(f"School: {school_name} ({school_city}) [id={school_id}]")
            for action in actions:
                grade = action.grade or "—"
                lines.append(f"  {action.role} | {action.username} | {grade}")
            lines.append("")
    else:
        lines.append("No linkable users found.")
        lines.append("")

    skipped = plan["skipped"]
    if skipped:
        by_reason: dict[str, list[LegacyUserSkip]] = {}
        for item in skipped:
            by_reason.setdefault(item.reason, []).append(item)

        reason_labels = {
            SKIP_AMBIGUOUS: "Skipped (ambiguous school match)",
            SKIP_NO_SCHOOL: "Skipped (no matching school)",
            SKIP_MISSING_FIELDS: "Skipped (missing school name or city)",
        }
        for reason, items in by_reason.items():
            lines.append(reason_labels.get(reason, f"Skipped ({reason})"))
            for item in items:
                grade = item.grade or "—"
                lines.append(
                    f"  {item.role} | {item.username} | {grade} | "
                    f"{item.school_name or '—'} / {item.city or '—'}"
                )
            lines.append("")

    lines.append(
        f"Summary: {len(plan['to_link'])} to link, {len(plan['skipped'])} skipped"
    )
    return "\n".join(lines)
