from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Grade, School, TeacherTask, TeacherTaskQuiz, Quiz, Subject, Chapter, QuestionBank, QuizQuestionAssignment

User = get_user_model()


class TaskTenancyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 4")
        self.subject = Subject.objects.create(name="Math", grade=self.grade)
        self.chapter = Chapter.objects.create(name="Ch1", subject=self.subject)
        self.bank = QuestionBank.objects.create(title="Bank", type="SCQ")
        self.quiz = Quiz.objects.create(
            title="Quiz 1",
            grade=self.grade,
            subject=self.subject,
            chapter=self.chapter,
            marks_per_question=1,
        )
        QuizQuestionAssignment.objects.create(
            quiz=self.quiz,
            question_bank=self.bank,
            num_questions=5,
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

        self.teacher_a = User.objects.create_user(
            username="teacher_a",
            password="testpass123",
            role="teacher",
            school=self.school_a,
        )
        self.teacher_b = User.objects.create_user(
            username="teacher_b",
            password="testpass123",
            role="teacher",
            school=self.school_b,
        )
        self.student_a = User.objects.create_user(
            username="student_a",
            password="testpass123",
            role="student",
            school=self.school_a,
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.student_b = User.objects.create_user(
            username="student_b",
            password="testpass123",
            role="student",
            school=self.school_b,
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.retail_teacher = User.objects.create_user(
            username="retail_teacher",
            password="testpass123",
            role="teacher",
            city="Islamabad",
            school_name="Retail School",
        )
        self.retail_student = User.objects.create_user(
            username="retail_student",
            password="testpass123",
            role="student",
            city="Islamabad",
            school_name="Retail School",
            grade=self.grade,
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )

        self.task_a = TeacherTask.objects.create(
            teacher=self.teacher_a,
            school=self.school_a,
            message="School A grade task",
            due_date=date.today() + timedelta(days=5),
            target_grade=self.grade,
            is_active=True,
        )
        TeacherTaskQuiz.objects.create(task=self.task_a, quiz=self.quiz)

        self.task_b = TeacherTask.objects.create(
            teacher=self.teacher_b,
            school=self.school_b,
            message="School B grade task",
            due_date=date.today() + timedelta(days=5),
            target_grade=self.grade,
            is_active=True,
        )
        TeacherTaskQuiz.objects.create(task=self.task_b, quiz=self.quiz)

        self.retail_task = TeacherTask.objects.create(
            teacher=self.retail_teacher,
            school=None,
            message="Retail grade task",
            due_date=date.today() + timedelta(days=5),
            target_grade=self.grade,
            is_active=True,
        )
        TeacherTaskQuiz.objects.create(task=self.retail_task, quiz=self.quiz)

        self.named_task = TeacherTask.objects.create(
            teacher=self.teacher_a,
            school=self.school_a,
            message="Named student task",
            due_date=date.today() + timedelta(days=5),
            is_active=True,
        )
        self.named_task.target_students.add(self.student_a)
        TeacherTaskQuiz.objects.create(task=self.named_task, quiz=self.quiz)

    def _task_ids(self, user):
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/student/tasks/")
        self.assertEqual(response.status_code, 200)
        return {row["task_id"] for row in response.data["tasks"]}

    def test_grade_task_visible_same_school(self):
        task_ids = self._task_ids(self.student_a)
        self.assertIn(self.task_a.id, task_ids)

    def test_grade_task_hidden_cross_school(self):
        task_ids = self._task_ids(self.student_b)
        self.assertNotIn(self.task_a.id, task_ids)
        self.assertIn(self.task_b.id, task_ids)

    def test_named_student_task_unchanged(self):
        task_ids = self._task_ids(self.student_a)
        self.assertIn(self.named_task.id, task_ids)

    def test_retail_task_visible_to_retail_student_only(self):
        retail_ids = self._task_ids(self.retail_student)
        school_ids = self._task_ids(self.student_a)
        self.assertIn(self.retail_task.id, retail_ids)
        self.assertNotIn(self.retail_task.id, school_ids)
