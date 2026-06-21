from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from core.legacy_school_linking import (
    SKIP_AMBIGUOUS,
    apply_legacy_school_link_plan,
    build_legacy_school_link_plan,
    classify_school_matches,
    resolve_school_match,
)
from core.models import Grade, School

User = get_user_model()


class LinkLegacySchoolUsersTests(TestCase):
    def setUp(self):
        self.grade2 = Grade.objects.create(name="Grade 2")
        self.grade5 = Grade.objects.create(name="Grade 5")

        self.active_school = School.objects.create(
            name="Beaconhouse Quetta",
            city="Quetta",
            province="Balochistan",
            contact_email="active@school.test",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.inactive_school = School.objects.create(
            name="Pending School",
            city="Lahore",
            province="Punjab",
            contact_email="pending@school.test",
            account_status="pending_payment",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )

        self.matching_student = User.objects.create_user(
            username="legacy_student_match",
            password="testpass123",
            role="student",
            school_name="Beaconhouse Quetta",
            city="Quetta",
            province="Balochistan",
            grade=self.grade2,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=10),
        )
        self.matching_teacher = User.objects.create_user(
            username="legacy_teacher_match",
            password="testpass123",
            role="teacher",
            school_name="beaconhouse quetta",
            city="quetta",
            province="Balochistan",
        )
        self.inactive_match_student = User.objects.create_user(
            username="legacy_student_pending",
            password="testpass123",
            role="student",
            school_name="Pending School",
            city="Lahore",
            province="Punjab",
            grade=self.grade5,
            account_status="active",
            is_active=True,
            subscription_expiry=timezone.now().date() + timedelta(days=10),
        )
        self.no_match_student = User.objects.create_user(
            username="legacy_student_nomatch",
            password="testpass123",
            role="student",
            school_name="Unknown School",
            city="Karachi",
            province="Sindh",
            grade=self.grade2,
        )
        self.ambiguous_student = User.objects.create_user(
            username="legacy_student_ambiguous",
            password="testpass123",
            role="student",
            school_name="Beaconhouse Quetta",
            city="Quetta",
            province="Balochistan",
            grade=self.grade5,
        )
        self.already_linked = User.objects.create_user(
            username="linked_student",
            password="testpass123",
            role="student",
            school=self.active_school,
            school_name=self.active_school.name,
            city=self.active_school.city,
            province=self.active_school.province,
            grade=self.grade2,
        )

    def test_dry_run_does_not_update(self):
        out = StringIO()
        call_command("link_legacy_school_users", stdout=out)

        self.matching_student.refresh_from_db()
        self.assertIsNone(self.matching_student.school_id)
        self.assertIn("DRY RUN", out.getvalue())
        self.assertIn("legacy_student_match", out.getvalue())
        self.assertIn("Grade 2", out.getvalue())

    def test_apply_links_exact_matches(self):
        out = StringIO()
        call_command("link_legacy_school_users", "--apply", stdout=out)

        self.matching_student.refresh_from_db()
        self.matching_teacher.refresh_from_db()
        self.assertEqual(self.matching_student.school_id, self.active_school.id)
        self.assertEqual(self.matching_teacher.school_id, self.active_school.id)
        self.assertEqual(self.matching_student.school_name, self.active_school.name)
        self.assertEqual(self.matching_student.city, self.active_school.city)
        self.assertEqual(self.matching_student.province, self.active_school.province)
        self.assertIn("Linked", out.getvalue())

    def test_ambiguous_match_skipped(self):
        with patch("core.legacy_school_linking.schools_matching_name_city") as mock_match:
            mock_match.return_value = School.objects.filter(
                pk__in=[self.active_school.pk, self.inactive_school.pk]
            )
            plan = build_legacy_school_link_plan()

        ambiguous = [
            item for item in plan["skipped"] if item.reason == SKIP_AMBIGUOUS
        ]
        self.assertTrue(any(item.username == "legacy_student_ambiguous" for item in ambiguous))

        apply_legacy_school_link_plan(plan)
        self.ambiguous_student.refresh_from_db()
        self.assertIsNone(self.ambiguous_student.school_id)

    def test_active_school_syncs_subscription(self):
        plan = build_legacy_school_link_plan()
        apply_legacy_school_link_plan(plan)

        self.matching_student.refresh_from_db()
        self.assertEqual(self.matching_student.account_status, "active")
        self.assertTrue(self.matching_student.is_active)
        self.assertEqual(
            self.matching_student.subscription_expiry,
            self.active_school.subscription_expiry,
        )

    def test_inactive_school_keeps_linked_users_inactive(self):
        plan = build_legacy_school_link_plan()
        apply_legacy_school_link_plan(plan)

        self.inactive_match_student.refresh_from_db()
        self.assertEqual(self.inactive_match_student.school_id, self.inactive_school.id)
        self.assertEqual(self.inactive_match_student.account_status, "inactive")
        self.assertFalse(self.inactive_match_student.is_active)
        self.assertIsNone(self.inactive_match_student.subscription_expiry)

    def test_no_match_user_is_skipped(self):
        plan = build_legacy_school_link_plan()
        skipped_usernames = {item.username for item in plan["skipped"]}
        self.assertIn("legacy_student_nomatch", skipped_usernames)

        apply_legacy_school_link_plan(plan)
        self.no_match_student.refresh_from_db()
        self.assertIsNone(self.no_match_student.school_id)

    def test_classify_school_matches_ambiguous(self):
        school, reason = classify_school_matches([self.active_school, self.inactive_school])
        self.assertIsNone(school)
        self.assertEqual(reason, SKIP_AMBIGUOUS)

    def test_resolve_school_match_is_case_insensitive(self):
        school, reason = resolve_school_match("beaconhouse quetta", "QUETTA")
        self.assertEqual(school, self.active_school)
        self.assertIsNone(reason)
