from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import (
    Chapter,
    Grade,
    QuestionBank,
    Quiz,
    QuizQuestionAssignment,
    School,
    StudentQuizAttempt,
    Subject,
)

User = get_user_model()


class SchoolAnalyticsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 3")
        self.subject = Subject.objects.create(name="Math", grade=self.grade)
        self.chapter = Chapter.objects.create(name="Addition", subject=self.subject)
        self.question_bank = QuestionBank.objects.create(title="Test Bank", type="SCQ")
        self.quiz = Quiz.objects.create(
            title="Quiz A",
            grade=self.grade,
            subject=self.subject,
            chapter=self.chapter,
            marks_per_question=1,
        )
        QuizQuestionAssignment.objects.create(
            quiz=self.quiz,
            question_bank=self.question_bank,
            num_questions=10,
        )

        self.school = School.objects.create(
            name="Beaconhouse Quetta",
            city="Quetta",
            province="Balochistan",
            contact_email="principal@beaconhouse.test",
            plan_tier="small",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.other_school = School.objects.create(
            name="Other School",
            city="Lahore",
            province="Punjab",
            contact_email="other@school.test",
            plan_tier="small",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )

        self.school_admin = User.objects.create_user(
            username="schooladmin_analytics",
            password="testpass123",
            role="school_admin",
            school=self.school,
        )
        self.teacher = User.objects.create_user(
            username="teacher_analytics",
            password="testpass123",
            role="teacher",
            school=self.school,
        )

        self.high_student = User.objects.create_user(
            username="high_student",
            password="testpass123",
            role="student",
            school=self.school,
            grade=self.grade,
            full_name="High Student",
        )
        self.low_student = User.objects.create_user(
            username="low_student",
            password="testpass123",
            role="student",
            school=self.school,
            grade=self.grade,
            full_name="Low Student",
        )
        self.other_student = User.objects.create_user(
            username="other_student",
            password="testpass123",
            role="student",
            school=self.other_school,
            grade=self.grade,
            full_name="Outside Student",
        )

        completed_at = timezone.now()
        StudentQuizAttempt.objects.create(
            student=self.high_student,
            quiz=self.quiz,
            score=9,
            completed_at=completed_at,
        )
        StudentQuizAttempt.objects.create(
            student=self.low_student,
            quiz=self.quiz,
            score=4,
            completed_at=completed_at,
        )
        StudentQuizAttempt.objects.create(
            student=self.other_student,
            quiz=self.quiz,
            score=10,
            completed_at=completed_at,
        )

    def test_school_analytics_only_uses_own_school(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/analytics-summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["overview"]["students"], 2)
        self.assertEqual(response.data["overview"]["teachers"], 1)
        self.assertEqual(response.data["overview"]["average_score"], 65.0)

    def test_attention_list_correct(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/analytics-summary/")
        attention_usernames = [
            row["username"] for row in response.data["students_requiring_attention"]
        ]
        self.assertIn("low_student", attention_usernames)
        self.assertNotIn("high_student", attention_usernames)
        self.assertNotIn("other_student", attention_usernames)

    def test_top_students_correct(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/analytics-summary/")
        top = response.data["top_students"]
        self.assertEqual(len(top), 1)
        self.assertEqual(top[0]["username"], "high_student")
        self.assertEqual(top[0]["average_score"], 90.0)

    def test_student_summary_scoped(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/student/high_student/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["student"]["username"], "high_student")
        self.assertEqual(response.data["quiz_count"], 1)
        self.assertEqual(response.data["average_score"], 90.0)

    def test_quiz_history_scoped(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/student/high_student/quiz-history/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["percentage"], 90.0)

    def test_learning_diagnosis_scoped(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/student/high_student/learning-diagnosis/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["has_data"])
        self.assertEqual(response.data["overall"]["overall_average_percentage"], 90.0)

    def test_cross_school_access_blocked(self):
        self.client.force_authenticate(user=self.school_admin)
        self.assertEqual(
            self.client.get("/api/school/student/other_student/summary/").status_code,
            404,
        )
        self.assertEqual(
            self.client.get("/api/school/student/other_student/quiz-history/").status_code,
            404,
        )
        self.assertEqual(
            self.client.get("/api/school/student/other_student/learning-diagnosis/").status_code,
            404,
        )

        self.client.force_authenticate(user=self.teacher)
        self.assertEqual(self.client.get("/api/school/analytics-summary/").status_code, 403)
