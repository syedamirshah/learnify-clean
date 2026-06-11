from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import School

User = get_user_model()


class SchoolDashboardSummaryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(
            name="Beaconhouse Quetta",
            city="Quetta",
            province="Balochistan",
            contact_email="principal@beaconhouse.test",
            plan_tier="small",
            max_students=200,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
            onboarding_status="paid",
        )
        self.school_admin = User.objects.create_user(
            username="schooladmin_test",
            password="testpass123",
            role="school_admin",
            school=self.school,
        )
        self.teacher = User.objects.create_user(
            username="teacher_test",
            password="testpass123",
            role="teacher",
            school=self.school,
        )
        for idx in range(3):
            User.objects.create_user(
                username=f"student_test_{idx}",
                password="testpass123",
                role="student",
                school=self.school,
            )

    def test_school_admin_can_access(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/dashboard-summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["school"]["name"], "Beaconhouse Quetta")

    def test_non_school_admin_cannot_access(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get("/api/school/dashboard-summary/")
        self.assertEqual(response.status_code, 403)

    def test_counts_correct(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/dashboard-summary/")
        self.assertEqual(response.data["counts"]["students"], 3)
        self.assertEqual(response.data["counts"]["teachers"], 1)
        self.assertEqual(response.data["counts"]["total_users"], 4)

    def test_capacity_calculation_correct(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/dashboard-summary/")
        capacity = response.data["capacity"]
        self.assertEqual(capacity["max_students"], 200)
        self.assertEqual(capacity["used_students"], 3)
        self.assertEqual(capacity["remaining_students"], 197)
