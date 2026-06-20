from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import (
    Grade,
    QuestionBank,
    QuestionReport,
    Quiz,
    QuizQuestionAssignment,
    SCQQuestion,
    StudentQuizAttempt,
    Subject,
)

User = get_user_model()


class QuestionReportApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 3")
        self.subject = Subject.objects.create(name="Math", grade=self.grade)
        self.bank = QuestionBank.objects.create(title="Test Bank", type="SCQ")
        self.question = SCQQuestion.objects.create(
            question_bank=self.bank,
            question_text="<p>What is 2 + 2?</p>",
            option_a="3",
            option_b="4",
            option_c="5",
            option_d="6",
            correct_answer="4",
        )
        self.quiz = Quiz.objects.create(
            title="1 - Addition",
            grade=self.grade,
            subject=self.subject,
            marks_per_question=1,
        )
        QuizQuestionAssignment.objects.create(
            quiz=self.quiz,
            question_bank=self.bank,
            num_questions=1,
        )
        self.student = User.objects.create_user(
            username="report_student",
            password="testpass123",
            role="student",
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.other_student = User.objects.create_user(
            username="other_student",
            password="testpass123",
            role="student",
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.attempt = StudentQuizAttempt.objects.create(
            student=self.student,
            quiz=self.quiz,
        )
        self.payload = {
            "quiz_id": self.quiz.id,
            "question_id": str(self.question.question_id),
            "question_type": "scq",
            "attempt_id": self.attempt.id,
            "message": "The correct answer seems wrong.",
        }

    def test_unauthenticated_blocked(self):
        response = self.client.post("/api/questions/report/", self.payload, format="json")
        self.assertEqual(response.status_code, 401)

    def test_student_can_report_question(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/questions/report/", self.payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data.get("success"))
        self.assertIn("reported for review", response.data.get("message", "").lower())
        self.assertEqual(QuestionReport.objects.count(), 1)
        report = QuestionReport.objects.get()
        self.assertEqual(report.reported_by, self.student)
        self.assertEqual(report.quiz, self.quiz)
        self.assertEqual(str(report.question_id), str(self.question.question_id))
        self.assertIn("2 + 2", report.question_snapshot)

    def test_student_visible_snapshot_preferred(self):
        self.client.force_authenticate(user=self.student)
        payload = {
            **self.payload,
            "question_snapshot": "<p>Student-visible version</p>",
        }
        response = self.client.post("/api/questions/report/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        report = QuestionReport.objects.get()
        self.assertEqual(report.question_snapshot, "<p>Student-visible version</p>")

    def test_duplicate_report_blocked(self):
        self.client.force_authenticate(user=self.student)
        first = self.client.post("/api/questions/report/", self.payload, format="json")
        self.assertEqual(first.status_code, 201)
        second = self.client.post("/api/questions/report/", self.payload, format="json")
        self.assertEqual(second.status_code, 409)
        self.assertFalse(second.data.get("success"))
        self.assertIn("already reported", second.data.get("message", "").lower())

    def test_attempt_must_belong_to_reporter(self):
        self.client.force_authenticate(user=self.other_student)
        response = self.client.post("/api/questions/report/", self.payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_invalid_quiz_returns_404(self):
        self.client.force_authenticate(user=self.student)
        payload = {**self.payload, "quiz_id": 99999}
        response = self.client.post("/api/questions/report/", payload, format="json")
        self.assertEqual(response.status_code, 404)


class QuestionReportAdminTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.grade = Grade.objects.create(name="Grade 4")
        self.subject = Subject.objects.create(name="Math", grade=self.grade)
        self.bank = QuestionBank.objects.create(title="Bank", type="SCQ")
        self.question = SCQQuestion.objects.create(
            question_bank=self.bank,
            question_text="Sample question",
            option_a="1",
            option_b="2",
            option_c="3",
            option_d="4",
            correct_answer="2",
        )
        self.quiz = Quiz.objects.create(
            title="Quiz A",
            grade=self.grade,
            subject=self.subject,
            marks_per_question=1,
        )
        QuizQuestionAssignment.objects.create(
            quiz=self.quiz,
            question_bank=self.bank,
            num_questions=1,
        )
        self.student = User.objects.create_user(
            username="student_a",
            password="testpass123",
            role="student",
            grade=self.grade,
        )
        self.admin = User.objects.create_user(
            username="platform_admin",
            password="testpass123",
            role="admin",
            is_staff=True,
        )
        self.report = QuestionReport.objects.create(
            reported_by=self.student,
            quiz=self.quiz,
            question_id=self.question.question_id,
            question_type="scq",
            message="Typo in question",
        )

    def test_admin_can_list_reports(self):
        self.client.login(username="platform_admin", password="testpass123")
        response = self.client.get("/admin/question-reports/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Question Reports")
        self.assertContains(response, "student_a")
        self.assertContains(response, "Quiz A")

    def test_non_admin_cannot_list_reports(self):
        self.client.login(username="student_a", password="testpass123")
        response = self.client.get("/admin/question-reports/")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_update_status(self):
        self.client.login(username="platform_admin", password="testpass123")
        response = self.client.post(
            f"/admin/question-reports/{self.report.id}/",
            {"action": "fixed", "admin_note": "Corrected in bank"},
        )
        self.assertEqual(response.status_code, 302)
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, QuestionReport.STATUS_FIXED)
        self.assertEqual(self.report.admin_note, "Corrected in bank")


class QuestionReportDeletionSafetyTests(TestCase):
    def setUp(self):
        self.grade = Grade.objects.create(name="Grade 5")
        self.subject = Subject.objects.create(name="Math", grade=self.grade)
        self.bank = QuestionBank.objects.create(title="Bank", type="SCQ")
        self.question = SCQQuestion.objects.create(
            question_bank=self.bank,
            question_text="Keep this snapshot",
            option_a="1",
            option_b="2",
            option_c="3",
            option_d="4",
            correct_answer="2",
        )
        self.quiz = Quiz.objects.create(
            title="Exercise 1",
            grade=self.grade,
            subject=self.subject,
            marks_per_question=1,
        )
        QuizQuestionAssignment.objects.create(
            quiz=self.quiz,
            question_bank=self.bank,
            num_questions=1,
        )
        self.student = User.objects.create_user(
            username="delete_test_student",
            password="testpass123",
            role="student",
            grade=self.grade,
        )
        self.report = QuestionReport.objects.create(
            reported_by=self.student,
            quiz=self.quiz,
            question_id=self.question.question_id,
            question_type="scq",
            question_snapshot="Keep this snapshot",
            message="Issue",
        )

    def test_deleting_user_preserves_report(self):
        user_id = self.student.id
        self.student.delete()
        self.report.refresh_from_db()
        self.assertIsNone(self.report.reported_by_id)
        self.assertEqual(self.report.question_snapshot, "Keep this snapshot")
        self.assertFalse(User.objects.filter(id=user_id).exists())

    def test_deleting_quiz_preserves_report(self):
        quiz_id = self.quiz.id
        self.quiz.delete()
        self.report.refresh_from_db()
        self.assertIsNone(self.report.quiz_id)
        self.assertEqual(self.report.message, "Issue")
        self.assertFalse(Quiz.objects.filter(id=quiz_id).exists())

    def test_deleting_attempt_preserves_report(self):
        attempt = StudentQuizAttempt.objects.create(student=self.student, quiz=self.quiz)
        self.report.attempt = attempt
        self.report.save()
        attempt_id = attempt.id
        attempt.delete()
        self.report.refresh_from_db()
        self.assertIsNone(self.report.attempt_id)
        self.assertEqual(QuestionReport.objects.filter(id=self.report.id).count(), 1)
        self.assertFalse(StudentQuizAttempt.objects.filter(id=attempt_id).exists())
