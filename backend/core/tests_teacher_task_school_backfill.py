from datetime import date, timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
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
    Subject,
    TeacherTask,
    TeacherTaskQuiz,
)
from core.teacher_task_school_backfill import (
    apply_teacher_task_school_backfill_plan,
    build_teacher_task_school_backfill_plan,
)

User = get_user_model()


class SchoolTeacherLegacyTaskMonitoringTests(TestCase):
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

        self.task = TeacherTask.objects.create(
            teacher=self.teacher,
            school=self.school,
            message="Complete Quiz A",
            due_date=date.today() + timedelta(days=7),
            is_active=True,
            target_grade=self.grade,
        )
        TeacherTaskQuiz.objects.create(task=self.task, quiz=self.quiz)

        self.legacy_task = TeacherTask.objects.create(
            teacher=self.teacher,
            school=None,
            message="Legacy task before school link",
            due_date=date.today() + timedelta(days=5),
            is_active=True,
            target_grade=self.grade,
        )
        TeacherTaskQuiz.objects.create(task=self.legacy_task, quiz=self.quiz)

    def test_teacher_detail_includes_null_school_task_for_school_teacher(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get(f"/api/school/teachers/{self.teacher.id}/")
        self.assertEqual(response.status_code, 200)
        task_ids = [task["task_id"] for task in response.data["tasks"]]
        self.assertIn(self.legacy_task.id, task_ids)
        self.assertEqual(response.data["tasks_created_count"], 2)
        self.assertEqual(response.data["active_tasks_count"], 2)

    def test_teacher_analytics_counts_null_school_tasks(self):
        self.client.force_authenticate(user=self.school_admin)
        analytics = self.client.get("/api/school/teacher-analytics/").data
        teacher_row = analytics["teachers"][0]
        self.assertEqual(teacher_row["tasks_created_count"], 2)
        self.assertEqual(teacher_row["active_tasks_count"], 2)

    def test_task_monitoring_includes_null_school_tasks(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/task-monitoring/")
        task_ids = [row["task_id"] for row in response.data["tasks"]]
        self.assertIn(self.legacy_task.id, task_ids)
        self.assertEqual(response.data["summary"]["active_tasks"], 2)

    def test_other_school_teacher_tasks_not_included(self):
        orphan_other = TeacherTask.objects.create(
            teacher=self.other_teacher,
            school=None,
            message="Other school legacy task",
            due_date=date.today() + timedelta(days=3),
            is_active=True,
            target_grade=self.grade,
        )
        TeacherTaskQuiz.objects.create(task=orphan_other, quiz=self.quiz)

        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get(f"/api/school/teachers/{self.teacher.id}/")
        task_ids = [task["task_id"] for task in response.data["tasks"]]
        self.assertNotIn(orphan_other.id, task_ids)

        monitoring = self.client.get("/api/school/task-monitoring/").data
        monitoring_ids = [row["task_id"] for row in monitoring["tasks"]]
        self.assertNotIn(orphan_other.id, monitoring_ids)


class BackfillTeacherTaskSchoolsCommandTests(TestCase):
    def setUp(self):
        self.grade = Grade.objects.create(name="Grade 4")
        self.school = School.objects.create(
            name="Beaconhouse Quetta",
            city="Quetta",
            province="Balochistan",
            contact_email="principal@beaconhouse.test",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.linked_teacher = User.objects.create_user(
            username="linked_teacher",
            password="testpass123",
            role="teacher",
            school=self.school,
        )
        self.retail_teacher = User.objects.create_user(
            username="retail_teacher",
            password="testpass123",
            role="teacher",
            city="Quetta",
            school_name="Retail School",
        )
        self.orphan_task = TeacherTask.objects.create(
            teacher=self.linked_teacher,
            school=None,
            message="Orphan task",
            due_date=date.today() + timedelta(days=4),
            is_active=True,
            target_grade=self.grade,
        )
        self.linked_task = TeacherTask.objects.create(
            teacher=self.linked_teacher,
            school=self.school,
            message="Already linked",
            due_date=date.today() + timedelta(days=4),
            is_active=True,
            target_grade=self.grade,
        )
        self.retail_orphan_task = TeacherTask.objects.create(
            teacher=self.retail_teacher,
            school=None,
            message="Retail orphan",
            due_date=date.today() + timedelta(days=4),
            is_active=True,
            target_grade=self.grade,
        )

    def test_dry_run_does_not_update(self):
        out = StringIO()
        call_command("backfill_teacher_task_schools", stdout=out)
        self.orphan_task.refresh_from_db()
        self.retail_orphan_task.refresh_from_db()
        self.linked_task.refresh_from_db()
        self.assertIsNone(self.orphan_task.school_id)
        self.assertIsNone(self.retail_orphan_task.school_id)
        self.assertEqual(self.linked_task.school_id, self.school.id)
        self.assertIn("DRY RUN", out.getvalue())
        self.assertIn("linked_teacher", out.getvalue())
        self.assertIn(f"task #{self.orphan_task.id}", out.getvalue())

    def test_apply_updates_orphan_tasks_for_linked_teacher(self):
        plan = build_teacher_task_school_backfill_plan()
        updated = apply_teacher_task_school_backfill_plan(plan)
        self.assertEqual(updated, 1)

        self.orphan_task.refresh_from_db()
        self.retail_orphan_task.refresh_from_db()
        self.linked_task.refresh_from_db()
        self.assertEqual(self.orphan_task.school_id, self.school.id)
        self.assertIsNone(self.retail_orphan_task.school_id)
        self.assertEqual(self.linked_task.school_id, self.school.id)

    def test_apply_command_updates_orphan_tasks(self):
        out = StringIO()
        call_command("backfill_teacher_task_schools", "--apply", stdout=out)
        self.orphan_task.refresh_from_db()
        self.assertEqual(self.orphan_task.school_id, self.school.id)
        self.assertIn("Updated 1 task(s).", out.getvalue())

    def test_plan_excludes_already_linked_and_teacher_without_school(self):
        plan = build_teacher_task_school_backfill_plan()
        task_ids = {action.task_id for action in plan}
        self.assertIn(self.orphan_task.id, task_ids)
        self.assertNotIn(self.linked_task.id, task_ids)
        self.assertNotIn(self.retail_orphan_task.id, task_ids)
