from datetime import date, timedelta

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
    TeacherTask,
    TeacherTaskQuiz,
)

User = get_user_model()


class SchoolTeacherAnalyticsApiTests(TestCase):
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
            username="schooladmin_teacher",
            password="testpass123",
            role="school_admin",
            school=self.school,
        )
        self.teacher = User.objects.create_user(
            username="teacher_one",
            password="testpass123",
            role="teacher",
            school=self.school,
            city=self.school.city,
            school_name=self.school.name,
            full_name="Teacher One",
        )
        self.other_teacher = User.objects.create_user(
            username="other_teacher",
            password="testpass123",
            role="teacher",
            school=self.other_school,
            city=self.other_school.city,
            school_name=self.other_school.name,
        )

        self.high_student = User.objects.create_user(
            username="high_student",
            password="testpass123",
            role="student",
            school=self.school,
            city=self.school.city,
            school_name=self.school.name,
            grade=self.grade,
            full_name="High Student",
        )
        self.low_student = User.objects.create_user(
            username="low_student",
            password="testpass123",
            role="student",
            school=self.school,
            city=self.school.city,
            school_name=self.school.name,
            grade=self.grade,
            full_name="Low Student",
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
            completed_at=completed_at - timedelta(hours=1),
        )

        self.task = TeacherTask.objects.create(
            teacher=self.teacher,
            school=self.school,
            message="Complete Quiz A",
            due_date=date.today() + timedelta(days=7),
            is_active=True,
            target_grade=self.grade,
        )
        TeacherTaskQuiz.objects.create(task=self.task, quiz=self.quiz)

        self.other_task = TeacherTask.objects.create(
            teacher=self.other_teacher,
            school=self.other_school,
            message="Outside school task",
            due_date=date.today() + timedelta(days=7),
            is_active=True,
            target_grade=self.grade,
        )
        TeacherTaskQuiz.objects.create(task=self.other_task, quiz=self.quiz)

    def test_teacher_analytics_scoped(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/teacher-analytics/")
        self.assertEqual(response.status_code, 200)
        usernames = [row["username"] for row in response.data["teachers"]]
        self.assertIn("teacher_one", usernames)
        self.assertNotIn("other_teacher", usernames)
        self.assertEqual(response.data["summary"]["teachers"], 1)

    def test_teacher_detail_scoped(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/teacher/teacher_one/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["teacher"]["username"], "teacher_one")
        self.assertEqual(response.data["students_count"], 2)
        self.assertEqual(response.data["active_tasks_count"], 1)

    def test_task_monitoring_scoped(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/task-monitoring/")
        self.assertEqual(response.status_code, 200)
        messages = [row["message"] for row in response.data["tasks"]]
        self.assertIn("Complete Quiz A", messages)
        self.assertNotIn("Outside school task", messages)
        self.assertEqual(response.data["summary"]["active_tasks"], 1)

    def test_cross_school_teacher_blocked(self):
        self.client.force_authenticate(user=self.school_admin)
        self.assertEqual(
            self.client.get("/api/school/teacher/other_teacher/summary/").status_code,
            404,
        )

    def test_cross_school_task_visibility_blocked(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/task-monitoring/")
        task_ids = [row["task_id"] for row in response.data["tasks"]]
        self.assertNotIn(self.other_task.id, task_ids)

    def test_summary_calculations_correct(self):
        self.client.force_authenticate(user=self.school_admin)
        analytics = self.client.get("/api/school/teacher-analytics/").data
        teacher_row = analytics["teachers"][0]
        self.assertEqual(teacher_row["students_count"], 2)
        self.assertEqual(teacher_row["average_student_score"], 65.0)
        self.assertEqual(teacher_row["active_tasks_count"], 1)
        self.assertEqual(teacher_row["pending_task_items"], 0)
        self.assertEqual(teacher_row["completed_task_items"], 2)
        self.assertGreaterEqual(teacher_row["attention_students_count"], 1)

        detail = self.client.get("/api/school/teacher/teacher_one/summary/").data
        self.assertEqual(detail["average_student_score"], 65.0)
        self.assertEqual(len(detail["students_requiring_attention"]), 1)

        monitoring = self.client.get("/api/school/task-monitoring/").data
        self.assertEqual(monitoring["summary"]["completed_items"], 2)
        self.assertEqual(monitoring["summary"]["pending_items"], 0)
        self.assertEqual(monitoring["tasks"][0]["completion_percentage"], 100)
