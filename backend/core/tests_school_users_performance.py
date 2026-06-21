from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import (
    Grade,
    QuestionBank,
    Quiz,
    QuizQuestionAssignment,
    SCQQuestion,
    School,
    StudentAnswer,
    StudentQuizAttempt,
    Subject,
)
from core.student_performance import overall_performance_metrics

User = get_user_model()


class SchoolUsersPerformanceApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 4")
        self.subject = Subject.objects.create(name="Math", grade=self.grade)
        self.bank = QuestionBank.objects.create(title="School Perf Bank", type="SCQ")
        self.question = SCQQuestion.objects.create(
            question_bank=self.bank,
            question_text="<p>2 + 2?</p>",
            option_a="3",
            option_b="4",
            option_c="5",
            option_d="6",
            correct_answer="4",
        )
        self.quiz = Quiz.objects.create(
            title="Math Quiz",
            grade=self.grade,
            subject=self.subject,
            marks_per_question=1,
        )
        QuizQuestionAssignment.objects.create(
            quiz=self.quiz,
            question_bank=self.bank,
            num_questions=1,
        )

        self.school = School.objects.create(
            name="School A",
            city="Lahore",
            province="Punjab",
            contact_email="a@school.test",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.other_school = School.objects.create(
            name="School B",
            city="Karachi",
            province="Sindh",
            contact_email="b@school.test",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )

        self.school_admin = User.objects.create_user(
            username="school_admin_perf",
            password="testpass123",
            role="school_admin",
            school=self.school,
        )
        self.teacher = User.objects.create_user(
            username="school_teacher_perf",
            password="testpass123",
            role="teacher",
            school=self.school,
        )
        self.student_with_attempts = User.objects.create_user(
            username="school_student_active",
            password="testpass123",
            role="student",
            school=self.school,
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.student_no_attempts = User.objects.create_user(
            username="school_student_empty",
            password="testpass123",
            role="student",
            school=self.school,
            grade=self.grade,
        )
        User.objects.create_user(
            username="school_other_school_student",
            password="testpass123",
            role="student",
            school=self.other_school,
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )

        completed_at = timezone.now()
        active_attempt = StudentQuizAttempt.objects.create(
            student=self.student_with_attempts,
            quiz=self.quiz,
            completed_at=completed_at,
        )
        StudentAnswer.objects.create(
            attempt=active_attempt,
            question_id=self.question.question_id,
            question_type="scq",
            answer_data={"selected": "4"},
        )

    def _school_users(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/users/")
        self.assertEqual(response.status_code, 200)
        return response.data

    def _student_row(self, username):
        return next(row for row in self._school_users()["students"] if row["username"] == username)

    def _teacher_row(self, username):
        return next(row for row in self._school_users()["teachers"] if row["username"] == username)

    def test_students_include_student_average_field(self):
        row = self._student_row("school_student_active")
        self.assertIn("student_average", row)

    def test_teachers_do_not_include_student_average_field(self):
        row = self._teacher_row("school_teacher_perf")
        self.assertNotIn("student_average", row)

    def test_student_with_no_attempts_returns_null_average(self):
        row = self._student_row("school_student_empty")
        self.assertIsNone(row["student_average"])

    def test_student_with_completed_attempts_shows_average(self):
        row = self._student_row("school_student_active")
        self.assertEqual(row["student_average"], 100.0)

    def test_calculation_matches_overall_performance_metrics(self):
        row = self._student_row("school_student_active")
        expected_average, _, _ = overall_performance_metrics(self.student_with_attempts)
        self.assertEqual(row["student_average"], expected_average)

    def test_other_school_students_not_included(self):
        usernames = {row["username"] for row in self._school_users()["students"]}
        self.assertNotIn("school_other_school_student", usernames)
