import io
from datetime import timedelta
from unittest.mock import patch

import openpyxl
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Grade, School
from core.tests_school_roster import ROSTER_HEADERS, build_roster_file
from payments.models import Payment
from payments.school_billing import build_school_payment_metadata
from payments.utils import sign_uid

User = get_user_model()


def build_student_rows(count, prefix="cap_student"):
    rows = []
    for idx in range(count):
        rows.append([
            f"{prefix}_{idx}",
            f"Student {idx}",
            "Urdu",
            f"{prefix}_{idx}@school.test",
            "pass1234",
            "student",
            "male",
            "Private school",
            "Grade 2",
            "Ignored",
            "Ignored",
            "Punjab",
            "monthly",
        ])
    return rows


class SchoolSeatEnforcementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 2")
        self.school_admin = None

    def _school(self, plan_tier="small", max_students=200):
        school = School.objects.create(
            name=f"Seat School {plan_tier}",
            city="Lahore",
            province="Punjab",
            contact_email=f"seat_{plan_tier}@school.test",
            plan_tier=plan_tier,
            max_students=max_students,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
            onboarding_status="paid",
        )
        admin = User.objects.create_user(
            username=f"admin_{plan_tier}_{school.id}",
            password="testpass123",
            role="school_admin",
            school=school,
        )
        return school, admin

    def test_small_plan_cap_exceeded_rejects_upload(self):
        school, admin = self._school(plan_tier="small", max_students=200)
        for idx in range(200):
            User.objects.create_user(
                username=f"existing_{idx}",
                password="testpass123",
                role="student",
                school=school,
                grade=self.grade,
            )

        self.client.force_authenticate(user=admin)
        upload = build_roster_file(build_student_rows(1, prefix="over_cap"))
        response = self.client.post(
            "/api/school/upload-roster/",
            {"file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Student limit exceeded", response.data["error"])
        self.assertIn("200", response.data["error"])
        self.assertFalse(User.objects.filter(username="over_cap_0").exists())

    def test_medium_plan_cap_exceeded_rejects_upload(self):
        school, admin = self._school(plan_tier="medium", max_students=500)
        for idx in range(500):
            User.objects.create_user(
                username=f"med_{idx}",
                password="testpass123",
                role="student",
                school=school,
                grade=self.grade,
            )

        self.client.force_authenticate(user=admin)
        upload = build_roster_file(build_student_rows(1, prefix="med_over"))
        response = self.client.post(
            "/api/school/upload-roster/",
            {"file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("500", response.data["error"])
        self.assertFalse(User.objects.filter(username="med_over_0").exists())

    def test_enterprise_unlimited_allows_large_upload(self):
        school, admin = self._school(plan_tier="enterprise", max_students=None)
        self.client.force_authenticate(user=admin)
        upload = build_roster_file(build_student_rows(3, prefix="ent_row"))
        response = self.client.post(
            "/api/school/upload-roster/",
            {"file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["uploaded"], 3)


class SchoolUniquenessTests(TestCase):
    def test_duplicate_school_prevented_at_db_level(self):
        School.objects.create(
            name="Unique School",
            city="Karachi",
            province="Sindh",
            contact_email="a@school.test",
        )
        with self.assertRaises(IntegrityError):
            School.objects.create(
                name="unique school",
                city="karachi",
                province="Sindh",
                contact_email="b@school.test",
            )


class SchoolPaymentSecurityTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.school = School.objects.create(
            name="Payment Security School",
            city="Islamabad",
            province="Federal Territory",
            contact_email="pay@school.test",
            plan_tier="small",
            billing_cycle="monthly",
        )
        self.admin = User.objects.create_user(
            username="paysec_admin",
            password="testpass123",
            role="school_admin",
            school=self.school,
        )

    def test_school_payment_requires_token_on_proceed(self):
        url = reverse("payments:school_choose")
        before = Payment.objects.count()
        response = self.client.get(
            url,
            {
                "school_id": self.school.id,
                "username": self.admin.username,
                "proceed": "1",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Token invalid or expired")
        self.assertEqual(Payment.objects.count(), before)

    def test_invalid_token_rejected_on_proceed(self):
        url = reverse("payments:school_choose")
        before = Payment.objects.count()
        response = self.client.get(
            url,
            {
                "school_id": self.school.id,
                "username": self.admin.username,
                "token": "not-a-valid-token",
                "proceed": "1",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Token invalid or expired")
        self.assertEqual(Payment.objects.count(), before)


class SchoolPaymentActivationReliabilityTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.school = School.objects.create(
            name="Activation School",
            city="Quetta",
            province="Balochistan",
            contact_email="act@school.test",
            plan_tier="small",
            billing_cycle="monthly",
            account_status="pending_payment",
        )
        self.admin = User.objects.create_user(
            username="act_admin",
            password="testpass123",
            role="school_admin",
            school=self.school,
            account_status="inactive",
        )

    @patch("payments.views.activate_school_license_from_payment")
    def test_activation_failure_surfaces_as_payment_failed(self, mock_activate):
        mock_activate.side_effect = ValueError("activation failed")

        payment = Payment.objects.create(
            user=self.admin,
            amount=2000,
            plan="monthly",
            months=1,
            merchant_order_id="20260101120000123456",
            request_payload=build_school_payment_metadata(self.school),
        )

        response = self.client.get(
            reverse("payments:easypay_status_handler"),
            {
                "status": "success",
                "orderRefNumber": payment.merchant_order_id,
                "transactionRefNumber": "TXN123",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertIn("status=failed", response["Location"])

        payment.refresh_from_db()
        self.school.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.FAILED)
        self.assertEqual(self.school.account_status, "pending_payment")
