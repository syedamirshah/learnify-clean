from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Grade, School
from core.teacher_scoping import teacher_can_access_student, teacher_students_queryset

User = get_user_model()


class TeacherScopingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 4")

        self.school_a = School.objects.create(
            name="School A",
            city="Lahore",
            province="Punjab",
            contact_email="a@school.test",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.school_b = School.objects.create(
            name="School B",
            city="Karachi",
            province="Sindh",
            contact_email="b@school.test",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )

        self.fk_teacher = User.objects.create_user(
            username="fk_teacher",
            password="testpass123",
            role="teacher",
            school=self.school_a,
        )
        self.student_a = User.objects.create_user(
            username="student_a",
            password="testpass123",
            role="student",
            school=self.school_a,
            grade=self.grade,
        )
        self.student_b = User.objects.create_user(
            username="student_b",
            password="testpass123",
            role="student",
            school=self.school_b,
            grade=self.grade,
        )

        self.legacy_teacher = User.objects.create_user(
            username="legacy_teacher",
            password="testpass123",
            role="teacher",
            city="Islamabad",
            school_name="Legacy School",
        )
        self.legacy_student = User.objects.create_user(
            username="legacy_student",
            password="testpass123",
            role="student",
            city="Islamabad",
            school_name="Legacy School",
            grade=self.grade,
        )

    def test_fk_teacher_sees_same_school_students(self):
        usernames = set(teacher_students_queryset(self.fk_teacher).values_list("username", flat=True))
        self.assertIn("student_a", usernames)
        self.assertNotIn("student_b", usernames)

    def test_fk_teacher_blocked_from_other_school_student_quiz_history(self):
        self.client.force_authenticate(user=self.fk_teacher)
        response = self.client.get("/api/teacher/student/student_b/quiz-history/")
        self.assertEqual(response.status_code, 403)

    def test_legacy_teacher_still_works(self):
        usernames = set(teacher_students_queryset(self.legacy_teacher).values_list("username", flat=True))
        self.assertIn("legacy_student", usernames)
        self.assertTrue(teacher_can_access_student(self.legacy_teacher, self.legacy_student))

    def test_fk_teacher_dashboard_counts_correct(self):
        self.client.force_authenticate(user=self.fk_teacher)
        response = self.client.get("/api/teacher/dashboard-summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["students_count"], 1)
