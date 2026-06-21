import openpyxl
from pathlib import Path

from django.conf import settings
from core.models import Grade, User

ROSTER_TEMPLATE_FILENAME = "student_bulk_upload_template.xlsx"
ROSTER_COLUMNS = (
    "username",
    "full_name",
    "language_used_at_home",
    "email",
    "password",
    "role",
    "gender",
    "schooling_status",
    "grade_name",
    "school_name",
    "city",
    "province",
    "subscription_plan",
)


def get_roster_template_path():
    candidates = []
    custom = getattr(settings, "ROSTER_TEMPLATE_PATH", None)
    if custom:
        candidates.append(Path(custom))
    candidates.extend([
        Path(settings.BASE_DIR).parent / "frontend" / "public" / ROSTER_TEMPLATE_FILENAME,
        Path(settings.BASE_DIR) / "static" / ROSTER_TEMPLATE_FILENAME,
    ])
    for path in candidates:
        if path.is_file():
            return path
    raise FileNotFoundError(f"Roster template not found: {ROSTER_TEMPLATE_FILENAME}")


def _normalize_gender(value):
    if not value:
        return value
    text = str(value).strip()
    if not text:
        return text
    return text[0].upper() + text[1:].lower()


def _resolve_grade(grade_name):
    cleaned = str(grade_name or "").strip().replace('"', "").replace("'", "")
    if not cleaned:
        return None, "Grade is required."
    try:
        return Grade.objects.get(name=cleaned), None
    except Grade.DoesNotExist:
        try:
            return Grade.objects.get(name__iexact=cleaned), None
        except Grade.DoesNotExist:
            return None, f"Grade '{grade_name}' does not exist in database."


def iter_roster_rows(sheet):
    for row_number, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        if not row or not any(cell is not None and str(cell).strip() for cell in row):
            continue
        values = list(row[:13])
        while len(values) < 13:
            values.append(None)
        yield row_number, dict(zip(ROSTER_COLUMNS, values))


def count_incoming_students(sheet, *, allowed_roles=None):
    """Count new student rows in a roster upload (excludes existing usernames)."""
    incoming = 0
    for _row_number, row in iter_roster_rows(sheet):
        username = str(row["username"] or "").strip()
        if not username:
            continue
        role = str(row["role"] or "").strip().lower()
        if allowed_roles and role not in allowed_roles:
            continue
        if role != "student":
            continue
        if User.objects.filter(username=username).exists():
            continue
        incoming += 1
    return incoming


def validate_school_seat_capacity(school, sheet, *, allowed_roles=None):
    """
    All-or-nothing seat check before roster import.
    Returns an error message when the plan cap would be exceeded, else None.
    """
    if not school or school.max_students is None:
        return None

    current_students = User.objects.filter(school=school, role="student").count()
    incoming_students = count_incoming_students(sheet, allowed_roles=allowed_roles)
    if current_students + incoming_students > school.max_students:
        return (
            f"Student limit exceeded. Your school plan allows "
            f"{school.max_students} students."
        )
    return None


def _roster_user_activation_fields(school):
    """School roster imports inherit the school's subscription when it is active."""
    if school and school.is_subscription_active:
        return {
            "account_status": "active",
            "is_active": True,
            "subscription_expiry": school.subscription_expiry,
        }
    return {
        "account_status": "inactive",
        "is_active": False,
        "subscription_expiry": None,
    }


def _maybe_send_roster_welcome_email(user, plain_password, *, send_welcome_emails, email_stats):
    if not send_welcome_emails:
        return

    email = str(getattr(user, "email", "") or "").strip()
    if not email:
        email_stats["emails_skipped"] += 1
        return

    try:
        from core.emails import send_welcome_email

        send_welcome_email(user, password=str(plain_password or ""))
        email_stats["emails_sent"] += 1
    except Exception:
        email_stats["emails_skipped"] += 1


def import_roster_from_file(file_obj, *, school=None, allowed_roles=None, send_welcome_emails=False):
    workbook = openpyxl.load_workbook(file_obj)
    return import_roster_from_workbook(
        workbook,
        school=school,
        allowed_roles=allowed_roles,
        send_welcome_emails=send_welcome_emails,
    )


def import_roster_from_workbook(workbook, *, school=None, allowed_roles=None, send_welcome_emails=False):
    sheet = workbook.active

    if school:
        seat_error = validate_school_seat_capacity(school, sheet, allowed_roles=allowed_roles)
        if seat_error:
            return {
                "uploaded": 0,
                "skipped": 0,
                "errors": [{"error": seat_error}],
                "rejected": True,
            }

    uploaded_count = 0
    skipped_count = 0
    errors = []
    email_stats = {"emails_sent": 0, "emails_skipped": 0}

    for row_number, row in iter_roster_rows(sheet):
        try:
            username = str(row["username"] or "").strip()
            if not username:
                errors.append({"row": row_number, "error": "Username is required."})
                continue

            role = str(row["role"] or "").strip().lower()
            if allowed_roles and role not in allowed_roles:
                errors.append({
                    "row": row_number,
                    "error": f"Role '{row['role']}' is not allowed for this upload.",
                })
                continue

            if User.objects.filter(username=username).exists():
                skipped_count += 1
                continue

            grade_instance, grade_error = _resolve_grade(row["grade_name"])
            if grade_error:
                errors.append({"row": row_number, "error": grade_error})
                continue

            if school:
                school_name = school.name
                city = school.city
                province = school.province
            else:
                school_name = row["school_name"]
                city = row["city"]
                province = row["province"]

            activation = _roster_user_activation_fields(school)

            user = User.objects.create(
                username=username,
                full_name=row["full_name"],
                email=row["email"],
                role=role,
                gender=_normalize_gender(row["gender"]),
                schooling_status=row["schooling_status"],
                grade=grade_instance,
                school=school,
                school_name=school_name,
                city=city,
                province=province,
                subscription_plan=row["subscription_plan"],
                language_used_at_home=row["language_used_at_home"] or "",
                account_status=activation["account_status"],
                is_active=activation["is_active"],
                subscription_expiry=activation["subscription_expiry"],
            )
            plain_password = row["password"]
            user.set_password(plain_password)
            user.save()
            uploaded_count += 1
            _maybe_send_roster_welcome_email(
                user,
                plain_password,
                send_welcome_emails=send_welcome_emails,
                email_stats=email_stats,
            )
        except Exception as exc:
            errors.append({"row": row_number, "error": str(exc)})

    if school and uploaded_count:
        refresh_school_onboarding(school)

    result = {
        "uploaded": uploaded_count,
        "skipped": skipped_count,
        "errors": errors,
    }
    if send_welcome_emails:
        result["emails_sent"] = email_stats["emails_sent"]
        result["emails_skipped"] = email_stats["emails_skipped"]
    return result


def refresh_school_onboarding(school):
    has_roster = User.objects.filter(
        school=school,
        role__in=["student", "teacher"],
    ).exists()
    if not has_roster:
        return school

    update_fields = ["onboarding_status", "updated_at"]
    if school.is_subscription_active:
        school.onboarding_status = "active"
    elif school.onboarding_status in ("registered", "paid"):
        school.onboarding_status = "roster_uploaded"
    school.save(update_fields=update_fields)
    return school


def school_has_roster(school):
    return User.objects.filter(
        school=school,
        role__in=["student", "teacher"],
    ).exists()
