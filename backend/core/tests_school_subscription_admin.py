from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from core.models import School
from core.permissions import has_active_subscription, school_subscription_active
from core.school_subscription_admin import (
    manually_activate_school,
    manually_disable_school,
    manually_extend_school,
)

User = get_user_model()


class SchoolSubscriptionAdminServiceTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name="Manual Test School",
            city="Lahore",
            province="Punjab",
            contact_email="admin@manual.test",
            plan_tier="small",
            billing_cycle="yearly",
            account_status="pending_payment",
            onboarding_status="registered",
        )
        self.school_admin = User.objects.create_user(
            username="manual_school_admin",
            password="pass12345",
            role="school_admin",
            school=self.school,
            account_status="inactive",
            is_active=True,
        )
        self.teacher = User.objects.create_user(
            username="manual_teacher",
            password="pass12345",
            role="teacher",
            school=self.school,
            account_status="inactive",
            is_active=True,
        )
        self.student = User.objects.create_user(
            username="manual_student",
            password="pass12345",
            role="student",
            school=self.school,
            account_status="inactive",
            is_active=True,
        )

    def test_manual_activation_activates_school(self):
        today = timezone.now().date()
        manually_activate_school(self.school, "month")

        self.school.refresh_from_db()
        self.assertEqual(self.school.account_status, "active")
        self.assertEqual(self.school.subscription_expiry, today + timedelta(days=30))
        self.assertEqual(self.school.onboarding_status, "paid")
        self.assertTrue(school_subscription_active(self.school))

    def test_manual_activation_activates_school_admin(self):
        manually_activate_school(self.school, "month")

        self.school_admin.refresh_from_db()
        self.assertEqual(self.school_admin.account_status, "active")
        self.assertTrue(self.school_admin.is_active)
        self.assertEqual(
            self.school_admin.subscription_expiry,
            self.school.subscription_expiry,
        )

    def test_manual_activation_syncs_students_and_teachers(self):
        manually_activate_school(self.school, "year")

        self.teacher.refresh_from_db()
        self.student.refresh_from_db()
        self.assertEqual(self.teacher.account_status, "active")
        self.assertEqual(self.student.account_status, "active")
        self.assertEqual(self.teacher.subscription_expiry, self.school.subscription_expiry)
        self.assertEqual(self.student.subscription_expiry, self.school.subscription_expiry)

    def test_manual_extension_extends_from_existing_expiry(self):
        today = timezone.now().date()
        existing_expiry = today + timedelta(days=20)
        self.school.account_status = "active"
        self.school.subscription_expiry = existing_expiry
        self.school.save()

        manually_extend_school(self.school, "month")

        self.school.refresh_from_db()
        self.assertEqual(self.school.subscription_expiry, existing_expiry + timedelta(days=30))
        self.assertEqual(self.school.account_status, "active")

    def test_manual_disable_blocks_school_access(self):
        manually_activate_school(self.school, "month")
        manually_disable_school(self.school)

        self.school.refresh_from_db()
        self.school_admin.refresh_from_db()
        self.student.refresh_from_db()

        self.assertEqual(self.school.account_status, "suspended")
        self.assertFalse(school_subscription_active(self.school))
        self.assertFalse(self.school_admin.is_active)
        self.assertFalse(self.student.is_active)
        self.assertFalse(
            has_active_subscription(
                self.student,
            )
        )


class ManageSubscriptionsRegressionTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin = User.objects.create_user(
            username="platform_admin",
            password="pass12345",
            role="admin",
            is_staff=True,
        )
        self.student = User.objects.create_user(
            username="retail_student",
            password="pass12345",
            role="student",
            account_status="inactive",
        )
        User.objects.create_user(
            username="orphan_school_admin",
            password="pass12345",
            role="school_admin",
            account_status="inactive",
        )

    def test_manage_subscriptions_still_lists_retail_users_only(self):
        self.client.force_login(self.admin)
        response = self.client.get(reverse("manage_subscriptions"))
        self.assertEqual(response.status_code, 200)
        usernames = [user.username for user in response.context["users"]]
        self.assertIn("retail_student", usernames)
        self.assertNotIn("orphan_school_admin", usernames)

    def test_manage_school_subscriptions_page_lists_schools(self):
        school = School.objects.create(
            name="Listed School",
            city="Karachi",
            province="Sindh",
            contact_email="listed@school.test",
        )
        self.client.force_login(self.admin)
        response = self.client.get(reverse("manage_school_subscriptions"))
        self.assertEqual(response.status_code, 200)
        names = [row.name for row in response.context["schools"]]
        self.assertIn(school.name, names)
