from datetime import timedelta

from django.test import SimpleTestCase
from django.utils import timezone

from core.permissions import has_active_subscription, school_subscription_active


class HasActiveSubscriptionTests(SimpleTestCase):
    def _school(self, **kwargs):
        class S:
            account_status = "active"
            subscription_expiry = timezone.now().date() + timedelta(days=30)

        s = S()
        for k, v in kwargs.items():
            setattr(s, k, v)
        return s

    def _user(self, **kwargs):
        class U:
            is_authenticated = True
            is_superuser = False
            is_staff = False
            role = "student"
            account_status = "active"
            subscription_expiry = timezone.now().date() + timedelta(days=30)
            school = None
            school_id = None

        u = U()
        for k, v in kwargs.items():
            setattr(u, k, v)
        return u

    def test_guest_denied(self):
        class Guest:
            is_authenticated = False

        self.assertFalse(has_active_subscription(Guest()))

    def test_active_student_allowed(self):
        self.assertTrue(has_active_subscription(self._user()))

    def test_expired_date_denied(self):
        self.assertFalse(
            has_active_subscription(
                self._user(
                    subscription_expiry=timezone.now().date() - timedelta(days=1),
                    account_status="expired",
                )
            )
        )

    def test_inactive_status_denied(self):
        self.assertFalse(has_active_subscription(self._user(account_status="inactive")))

    def test_admin_bypass(self):
        self.assertTrue(has_active_subscription(self._user(role="admin")))

    def test_manager_bypass(self):
        self.assertTrue(has_active_subscription(self._user(role="manager")))

    def test_teacher_bypass_without_subscription(self):
        self.assertTrue(
            has_active_subscription(
                self._user(
                    role="teacher",
                    account_status="inactive",
                    subscription_expiry=None,
                )
            )
        )

    def test_staff_bypass(self):
        self.assertTrue(has_active_subscription(self._user(role="student", is_staff=True)))

    def test_missing_expiry_denied(self):
        self.assertFalse(
            has_active_subscription(self._user(subscription_expiry=None))
        )

    def test_school_active_license_allows_student(self):
        school = self._school()
        self.assertTrue(
            has_active_subscription(
                self._user(
                    role="student",
                    account_status="inactive",
                    subscription_expiry=None,
                    school=school,
                )
            )
        )

    def test_school_expired_license_blocks_student_without_individual_sub(self):
        school = self._school(
            account_status="expired",
            subscription_expiry=timezone.now().date() - timedelta(days=1),
        )
        self.assertFalse(
            has_active_subscription(
                self._user(
                    role="student",
                    account_status="inactive",
                    subscription_expiry=None,
                    school=school,
                )
            )
        )

    def test_retail_active_student_still_allowed(self):
        self.assertTrue(
            has_active_subscription(
                self._user(
                    role="student",
                    school=None,
                    account_status="active",
                    subscription_expiry=timezone.now().date() + timedelta(days=10),
                )
            )
        )

    def test_retail_expired_student_still_blocked(self):
        self.assertFalse(
            has_active_subscription(
                self._user(
                    role="student",
                    school=None,
                    account_status="expired",
                    subscription_expiry=timezone.now().date() - timedelta(days=1),
                )
            )
        )

    def test_school_admin_active_school_allowed(self):
        school = self._school()
        self.assertTrue(
            has_active_subscription(
                self._user(
                    role="school_admin",
                    account_status="inactive",
                    subscription_expiry=None,
                    school=school,
                )
            )
        )

    def test_school_admin_expired_school_blocked(self):
        school = self._school(
            account_status="expired",
            subscription_expiry=timezone.now().date() - timedelta(days=1),
        )
        self.assertFalse(
            has_active_subscription(
                self._user(
                    role="school_admin",
                    account_status="inactive",
                    subscription_expiry=None,
                    school=school,
                )
            )
        )

    def test_school_subscription_active_helper(self):
        active = self._school()
        expired = self._school(
            account_status="expired",
            subscription_expiry=timezone.now().date() - timedelta(days=1),
        )
        self.assertTrue(school_subscription_active(active))
        self.assertFalse(school_subscription_active(expired))
        self.assertFalse(school_subscription_active(None))
