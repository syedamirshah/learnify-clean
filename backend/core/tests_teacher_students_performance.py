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

User = get_user_model()


class TeacherStudentsPerformanceApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 4")
        self.subject = Subject.objects.create(name="Math", grade=self.grade)
        self.bank = QuestionBank.objects.create(title="Perf Bank", type="SCQ")
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

        self.teacher = User.objects.create_user(
            username="perf_teacher",
            password="testpass123",
            role="teacher",
            school=self.school_a,
        )
        self.student_with_attempts = User.objects.create_user(
            username="perf_student_active",
            password="testpass123",
            role="student",
            school=self.school_a,
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.student_no_attempts = User.objects.create_user(
            username="perf_student_empty",
            password="testpass123",
            role="student",
            school=self.school_a,
            grade=self.grade,
        )
        self.classmate = User.objects.create_user(
            username="perf_classmate",
            password="testpass123",
            role="student",
            school=self.school_a,
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.other_school_student = User.objects.create_user(
            username="perf_other_school",
            password="testpass123",
            role="student",
            school=self.school_b,
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )

        completed_at = timezone.now()
        self.active_attempt = StudentQuizAttempt.objects.create(
            student=self.student_with_attempts,
            quiz=self.quiz,
            completed_at=completed_at,
        )
        StudentAnswer.objects.create(
            attempt=self.active_attempt,
            question_id=self.question.question_id,
            question_type="scq",
            answer_data={"selected": "4"},
        )

        classmate_attempt = StudentQuizAttempt.objects.create(
            student=self.classmate,
            quiz=self.quiz,
            completed_at=completed_at,
        )
        StudentAnswer.objects.create(
            attempt=classmate_attempt,
            question_id=self.question.question_id,
            question_type="scq",
            answer_data={"selected": "3"},
        )

    def _teacher_students(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get("/api/teacher/students/")
        self.assertEqual(response.status_code, 200)
        return response.data

    def _student_row(self, username):
        return next(row for row in self._teacher_students() if row["username"] == username)

    def test_teacher_students_include_performance_fields(self):
        row = self._student_row("perf_student_active")
        self.assertIn("student_average", row)
        self.assertIn("class_average", row)
        self.assertIn("percentile", row)

    def test_student_with_completed_attempts_shows_values(self):
        row = self._student_row("perf_student_active")
        self.assertIsNotNone(row["student_average"])
        self.assertIsNotNone(row["class_average"])
        self.assertIsNotNone(row["percentile"])
        self.assertEqual(row["student_average"], 100.0)
        self.assertEqual(row["class_average"], 50.0)
        self.assertEqual(row["percentile"], 200.0)

    def test_student_with_no_attempts_returns_null_values(self):
        row = self._student_row("perf_student_empty")
        self.assertIsNone(row["student_average"])
        self.assertIsNone(row["class_average"])
        self.assertIsNone(row["percentile"])

    def test_cross_school_students_not_included(self):
        usernames = {row["username"] for row in self._teacher_students()}
        self.assertNotIn("perf_other_school", usernames)

    def test_calculation_matches_student_subject_performance_overall(self):
        self.client.force_authenticate(user=self.student_with_attempts)
        perf_response = self.client.get("/api/student/subject-performance/")
        self.assertEqual(perf_response.status_code, 200)
        overall = next(
            row for row in perf_response.data if row.get("subject") == "Overall Performance"
        )

        row = self._student_row("perf_student_active")
        self.assertEqual(row["student_average"], overall["student_avg"])
        self.assertEqual(row["class_average"], overall["class_avg"])
        self.assertEqual(row["percentile"], overall["percentile"])
