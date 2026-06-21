from django.core.management.base import BaseCommand

from core.teacher_task_school_backfill import (
    apply_teacher_task_school_backfill_plan,
    build_teacher_task_school_backfill_plan,
    format_teacher_task_school_backfill_report,
)


class Command(BaseCommand):
    help = (
        "Backfill TeacherTask.school_id from the linked teacher's school. "
        "Dry-run by default; pass --apply to update tasks."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Apply school links to orphan teacher tasks (default is dry-run only).",
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        plan = build_teacher_task_school_backfill_plan()
        report = format_teacher_task_school_backfill_report(plan, apply=apply)
        self.stdout.write(report)

        if apply and plan:
            updated_count = apply_teacher_task_school_backfill_plan(plan)
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS(f"Updated {updated_count} task(s)."))
        elif apply:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("No tasks were updated."))
