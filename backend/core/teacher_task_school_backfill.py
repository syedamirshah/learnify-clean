from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction

from core.models import TeacherTask


@dataclass(frozen=True)
class TeacherTaskSchoolBackfillAction:
    task_id: int
    teacher_username: str
    teacher_name: str
    school_id: int
    school_name: str
    school_city: str
    due_date: str | None
    is_active: bool


def teacher_tasks_missing_school_queryset():
    return (
        TeacherTask.objects.filter(school__isnull=True, teacher__school__isnull=False)
        .select_related("teacher", "teacher__school")
        .order_by("teacher__school_id", "teacher__username", "-id")
    )


def build_teacher_task_school_backfill_plan():
    actions = []
    for task in teacher_tasks_missing_school_queryset():
        teacher = task.teacher
        school = teacher.school
        actions.append(
            TeacherTaskSchoolBackfillAction(
                task_id=task.id,
                teacher_username=teacher.username,
                teacher_name=teacher.full_name or teacher.username,
                school_id=school.id,
                school_name=school.name,
                school_city=school.city,
                due_date=task.due_date.strftime("%Y-%m-%d") if task.due_date else None,
                is_active=task.is_active,
            )
        )
    return actions


def apply_teacher_task_school_backfill_plan(plan):
    updated_count = 0
    with transaction.atomic():
        for action in plan:
            task = TeacherTask.objects.select_for_update().select_related("teacher").get(pk=action.task_id)
            if task.school_id is not None:
                continue
            if not task.teacher.school_id:
                continue
            task.school_id = task.teacher.school_id
            task.save(update_fields=["school_id"])
            updated_count += 1
    return updated_count


def format_teacher_task_school_backfill_report(plan, *, apply: bool) -> str:
    lines = []
    if apply:
        lines.append("APPLY MODE — linking orphan teacher tasks to their teacher's school.")
    else:
        lines.append("DRY RUN — no changes will be made. Pass --apply to update tasks.")
    lines.append("")

    if not plan:
        lines.append("No orphan teacher tasks found.")
        lines.append("")
        lines.append("Summary: 0 to update")
        return "\n".join(lines)

    grouped: dict[tuple[int, str, str], list[TeacherTaskSchoolBackfillAction]] = {}
    for action in plan:
        key = (action.school_id, action.school_name, action.school_city)
        grouped.setdefault(key, []).append(action)

    for (school_id, school_name, school_city), actions in sorted(
        grouped.items(),
        key=lambda item: (item[0][1].lower(), item[0][2].lower()),
    ):
        lines.append(f"School: {school_name} ({school_city}) [id={school_id}]")
        for action in actions:
            active_label = "active" if action.is_active else "inactive"
            lines.append(
                f"  task #{action.task_id} | {action.teacher_username} | "
                f"{action.teacher_name} | due {action.due_date or '—'} | {active_label}"
            )
        lines.append("")

    lines.append(f"Summary: {len(plan)} to update")
    return "\n".join(lines)
