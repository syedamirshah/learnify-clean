from datetime import timedelta

from django.test import SimpleTestCase
from django.utils import timezone

from core.permissions import has_active_subscription


class HasActiveSubscriptionTests(SimpleTestCase):
    def _user(self, **kwargs):
        class U:
            is_authenticated = True
            is_superuser = False
            is_staff = False
            role = "student"
            account_status = "active"
            subscription_expiry = timezone.now().date() + timedelta(days=30)

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

    def test_staff_bypass(self):
        self.assertTrue(has_active_subscription(self._user(role="student", is_staff=True)))

    def test_missing_expiry_denied(self):
        self.assertFalse(
            has_active_subscription(self._user(subscription_expiry=None))
        )
