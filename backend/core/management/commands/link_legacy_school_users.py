from django.core.management.base import BaseCommand

from core.legacy_school_linking import (
    apply_legacy_school_link_plan,
    build_legacy_school_link_plan,
    format_legacy_school_link_report,
)


class Command(BaseCommand):
    help = (
        "Link legacy students/teachers to School records by matching school_name and city. "
        "Dry-run by default; pass --apply to update users."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Apply links to matched users (default is dry-run only).",
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        plan = build_legacy_school_link_plan()
        report = format_legacy_school_link_report(plan, apply=apply)
        self.stdout.write(report)

        if apply and plan["to_link"]:
            linked_count = apply_legacy_school_link_plan(plan)
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS(f"Linked {linked_count} user(s)."))
        elif apply:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("No users were linked."))
