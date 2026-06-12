from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from core.models import School
from payments.models import Payment
from payments.school_billing import (
    activate_individual_subscription_from_payment,
    activate_school_license_from_payment,
    build_school_payment_metadata,
    school_plan_amount,
    validate_school_payment_access,
)
from payments.utils import sign_uid

User = get_user_model()


class SchoolPlanAmountTests(TestCase):
    def test_small_monthly_amount(self):
        self.assertEqual(school_plan_amount("small", "monthly"), 2000.0)

    def test_small_yearly_amount(self):
        self.assertEqual(school_plan_amount("small", "yearly"), 18000.0)


class SchoolPaymentFlowTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.school = School.objects.create(
            name="Test School Lahore",
            city="Lahore",
            province="Punjab",
            contact_email="admin@testschool.test",
            plan_tier="small",
            billing_cycle="monthly",
            account_status="pending_payment",
            onboarding_status="registered",
        )
        self.admin = User.objects.create_user(
            username="testschool_admin",
            password="testpass123",
            role="school_admin",
            school=self.school,
            account_status="inactive",
            is_active=True,
        )
        self.teacher = User.objects.create_user(
            username="testschool_teacher",
            password="testpass123",
            role="teacher",
            school=self.school,
            account_status="inactive",
            is_active=False,
        )
        self.student = User.objects.create_user(
            username="testschool_student",
            password="testpass123",
            role="student",
            school=self.school,
            account_status="inactive",
            is_active=False,
        )

    def _create_school_payment(self):
        meta = build_school_payment_metadata(self.school)
        return Payment.objects.create(
            user=self.admin,
            amount=Decimal(str(school_plan_amount(self.school.plan_tier, self.school.billing_cycle))),
            plan=self.school.billing_cycle,
            months=1,
            request_payload=meta,
        )

    def test_school_payment_metadata_marks_payment_type(self):
        payment = self._create_school_payment()
        self.assertEqual(payment.request_payload["payment_type"], "school")
        self.assertEqual(payment.request_payload["school_id"], self.school.id)
        self.assertEqual(payment.request_payload["plan_tier"], "small")
        self.assertEqual(payment.request_payload["billing_cycle"], "monthly")

    def test_school_success_activates_school(self):
        payment = self._create_school_payment()
        payment.mark_success()
        activate_school_license_from_payment(payment)
        self.school.refresh_from_db()
        self.assertEqual(self.school.account_status, "active")
        self.assertEqual(self.school.onboarding_status, "paid")
        self.assertIsNotNone(self.school.subscription_expiry)

    def test_school_success_activates_school_admin(self):
        payment = self._create_school_payment()
        payment.mark_success()
        activate_school_license_from_payment(payment)
        self.school.refresh_from_db()
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.account_status, "active")
        self.assertTrue(self.admin.is_active)
        self.assertEqual(self.admin.subscription_expiry, self.school.subscription_expiry)

    def test_school_success_syncs_existing_school_users(self):
        payment = self._create_school_payment()
        payment.mark_success()
        activate_school_license_from_payment(payment)
        self.school.refresh_from_db()
        self.teacher.refresh_from_db()
        self.student.refresh_from_db()
        self.assertEqual(self.teacher.account_status, "active")
        self.assertTrue(self.teacher.is_active)
        self.assertEqual(self.student.account_status, "active")
        self.assertTrue(self.student.is_active)
        self.assertEqual(self.teacher.subscription_expiry, self.school.subscription_expiry)
        self.assertEqual(self.student.subscription_expiry, self.school.subscription_expiry)

    def test_individual_student_payment_success_still_works(self):
        student = User.objects.create_user(
            username="solo_student",
            password="testpass123",
            role="student",
            account_status="inactive",
            is_active=True,
        )
        payment = Payment.objects.create(
            user=student,
            amount=Decimal("300.00"),
            plan="monthly",
            months=1,
            request_payload={"selected_plan": "monthly", "selected_months": 1},
        )
        payment.mark_success()
        activate_individual_subscription_from_payment(payment)
        student.refresh_from_db()
        self.assertEqual(student.account_status, "active")
        self.assertTrue(student.is_active)
        self.assertIsNotNone(student.subscription_expiry)

    def test_invalid_school_user_mismatch_rejected(self):
        other_school = School.objects.create(
            name="Other School",
            city="Karachi",
            province="Sindh",
            contact_email="other@school.test",
        )
        with self.assertRaises(ValueError):
            validate_school_payment_access(other_school.id, self.admin.username)

        url = reverse("payments:school_choose")
        response = self.client.get(
            url,
            {"school_id": other_school.id, "username": self.admin.username},
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "School administrator not found")

    def test_expired_school_renewal_extends_from_today(self):
        past = timezone.now().date() - timedelta(days=10)
        self.school.subscription_expiry = past
        self.school.account_status = "expired"
        self.school.save(update_fields=["subscription_expiry", "account_status"])

        payment = self._create_school_payment()
        activate_school_license_from_payment(payment)
        self.school.refresh_from_db()
        expected = timezone.now().date() + timedelta(days=30)
        self.assertEqual(self.school.subscription_expiry, expected)

    def test_active_school_renewal_extends_from_existing_expiry(self):
        future = timezone.now().date() + timedelta(days=20)
        self.school.subscription_expiry = future
        self.school.account_status = "active"
        self.school.save(update_fields=["subscription_expiry", "account_status"])

        payment = self._create_school_payment()
        activate_school_license_from_payment(payment)
        self.school.refresh_from_db()
        self.assertEqual(self.school.subscription_expiry, future + timedelta(days=30))

    def test_school_choose_proceed_creates_payment_with_metadata(self):
        token = sign_uid(self.admin.username)
        url = reverse("payments:school_choose")
        response = self.client.get(
            url,
            {
                "school_id": self.school.id,
                "username": self.admin.username,
                "token": token,
                "proceed": "1",
            },
        )
        self.assertEqual(response.status_code, 302)
        payment = Payment.objects.latest("initiated_at")
        self.assertEqual(payment.user_id, self.admin.id)
        self.assertEqual(float(payment.amount), 2000.0)
        self.assertEqual(payment.request_payload.get("payment_type"), "school")
