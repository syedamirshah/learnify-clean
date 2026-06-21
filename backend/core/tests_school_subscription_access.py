from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Grade, School

User = get_user_model()


class SchoolSubscriptionAccessApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 4")
        self.active_school = School.objects.create(
            name="Active School",
            city="Lahore",
            province="Punjab",
            contact_email="active@school.test",
            plan_tier="small",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.expired_school = School.objects.create(
            name="Expired School",
            city="Karachi",
            province="Sindh",
            contact_email="expired@school.test",
            plan_tier="small",
            account_status="expired",
            subscription_expiry=timezone.now().date() - timedelta(days=1),
        )

        self.active_student = User.objects.create_user(
            username="active_school_student",
            password="testpass123",
            role="student",
            school=self.active_school,
            grade=self.grade,
            account_status="active",
            subscription_expiry=self.active_school.subscription_expiry,
        )
        self.expired_school_student = User.objects.create_user(
            username="expired_school_student",
            password="testpass123",
            role="student",
            school=self.expired_school,
            grade=self.grade,
            account_status="active",
            subscription_expiry=self.expired_school.subscription_expiry,
        )
        self.active_teacher = User.objects.create_user(
            username="active_school_teacher",
            password="testpass123",
            role="teacher",
            school=self.active_school,
            account_status="active",
            subscription_expiry=self.active_school.subscription_expiry,
        )
        self.expired_school_teacher = User.objects.create_user(
            username="expired_school_teacher",
            password="testpass123",
            role="teacher",
            school=self.expired_school,
            account_status="active",
            subscription_expiry=self.expired_school.subscription_expiry,
        )
        self.expired_school_admin = User.objects.create_user(
            username="expired_school_admin",
            password="testpass123",
            role="school_admin",
            school=self.expired_school,
            account_status="inactive",
        )
        self.retail_student = User.objects.create_user(
            username="retail_student_access",
            password="testpass123",
            role="student",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=10),
        )
        self.retail_expired_student = User.objects.create_user(
            username="retail_expired_student",
            password="testpass123",
            role="student",
            account_status="expired",
            subscription_expiry=timezone.now().date() - timedelta(days=1),
        )

    def test_active_school_student_access_allowed(self):
        self.client.force_authenticate(user=self.active_student)
        response = self.client.get("/api/student/subject-performance/")
        self.assertEqual(response.status_code, 200)

    def test_expired_school_student_blocked(self):
        self.client.force_authenticate(user=self.expired_school_student)
        response = self.client.get("/api/student/subject-performance/")
        self.assertEqual(response.status_code, 403)

    def test_active_school_teacher_access_allowed(self):
        self.client.force_authenticate(user=self.active_teacher)
        response = self.client.get("/api/teacher/students/")
        self.assertEqual(response.status_code, 200)

    def test_expired_school_teacher_blocked(self):
        self.client.force_authenticate(user=self.expired_school_teacher)
        response = self.client.get("/api/teacher/students/")
        self.assertEqual(response.status_code, 403)

    def test_expired_school_principal_can_open_dashboard(self):
        self.client.force_authenticate(user=self.expired_school_admin)
        response = self.client.get("/api/school/dashboard-summary/")
        self.assertEqual(response.status_code, 200)

    def test_expired_school_principal_can_open_settings(self):
        self.client.force_authenticate(user=self.expired_school_admin)
        response = self.client.get("/api/school/settings/")
        self.assertEqual(response.status_code, 200)

    def test_retail_student_behavior_unchanged(self):
        self.client.force_authenticate(user=self.retail_student)
        response = self.client.get("/api/student/subject-performance/")
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(user=self.retail_expired_student)
        blocked = self.client.get("/api/student/subject-performance/")
        self.assertEqual(blocked.status_code, 403)


class DeleteExpiredUsersCommandTests(TestCase):
    def test_does_not_delete_school_linked_users(self):
        school = School.objects.create(
            name="Delete Guard School",
            city="Quetta",
            province="Balochistan",
            contact_email="guard@school.test",
        )
        old_date = timezone.now().date() - timedelta(days=90)
        school_student = User.objects.create_user(
            username="old_school_student",
            password="testpass123",
            role="student",
            school=school,
            subscription_expiry=old_date,
        )
        retail_student = User.objects.create_user(
            username="old_retail_student",
            password="testpass123",
            role="student",
            subscription_expiry=old_date,
        )

        out = StringIO()
        call_command("delete_expired_users", stdout=out)

        self.assertTrue(User.objects.filter(pk=school_student.pk).exists())
        self.assertFalse(User.objects.filter(pk=retail_student.pk).exists())
