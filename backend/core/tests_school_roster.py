import io
from datetime import timedelta

import openpyxl
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Grade, School
from core.roster_upload import import_roster_from_workbook

User = get_user_model()

ROSTER_HEADERS = [
    "username",
    "full_name",
    "language_used_at_home",
    "email",
    "password",
    "role",
    "gender",
    "schooling_status",
    "grade",
    "school_name",
    "city",
    "province",
    "subscription_plan",
]


def build_roster_file(rows):
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.append(ROSTER_HEADERS)
    for row in rows:
        sheet.append(row)
    buffer = io.BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    return SimpleUploadedFile(
        "roster.xlsx",
        buffer.read(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


class SchoolRosterApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.grade = Grade.objects.create(name="Grade 2")
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
            username="schooladmin_roster",
            password="testpass123",
            role="school_admin",
            school=self.school,
        )
        self.teacher = User.objects.create_user(
            username="teacher_roster",
            password="testpass123",
            role="teacher",
            school=self.school,
            full_name="Teacher One",
        )
        self.student = User.objects.create_user(
            username="student_roster",
            password="testpass123",
            role="student",
            school=self.school,
            grade=self.grade,
            full_name="Student One",
        )
        User.objects.create_user(
            username="other_teacher",
            password="testpass123",
            role="teacher",
            school=self.other_school,
            full_name="Outside Teacher",
        )

    def test_school_admin_sees_only_own_school_users(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/users/")
        self.assertEqual(response.status_code, 200)

        teacher_usernames = [item["username"] for item in response.data["teachers"]]
        student_usernames = [item["username"] for item in response.data["students"]]

        self.assertIn("teacher_roster", teacher_usernames)
        self.assertIn("student_roster", student_usernames)
        self.assertNotIn("other_teacher", teacher_usernames)

    def test_upload_assigns_imported_users_to_school(self):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "imported_student",
                "Imported Student",
                "Urdu",
                "imported@school.test",
                "pass1234",
                "student",
                "male",
                "Private school",
                "Grade 2",
                "Ignored School Name",
                "Ignored City",
                "Punjab",
                "monthly",
            ],
            [
                "imported_teacher",
                "Imported Teacher",
                "Urdu",
                "teacher@school.test",
                "pass1234",
                "teacher",
                "female",
                "Private school",
                "Grade 2",
                "Ignored School Name",
                "Ignored City",
                "Punjab",
                "monthly",
            ],
        ])

        response = self.client.post("/api/school/upload-roster/", {"file": upload}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["uploaded"], 2)

        imported_student = User.objects.get(username="imported_student")
        imported_teacher = User.objects.get(username="imported_teacher")
        self.assertEqual(imported_student.school_id, self.school.id)
        self.assertEqual(imported_teacher.school_id, self.school.id)
        self.assertEqual(imported_student.school_name, self.school.name)
        self.assertEqual(imported_student.city, self.school.city)
        self.assertEqual(imported_student.province, self.school.province)
        self.assertEqual(imported_student.account_status, "active")
        self.assertTrue(imported_student.is_active)
        self.assertEqual(imported_student.subscription_expiry, self.school.subscription_expiry)
        self.assertEqual(imported_teacher.account_status, "active")
        self.assertTrue(imported_teacher.is_active)
        self.assertEqual(imported_teacher.subscription_expiry, self.school.subscription_expiry)

    def test_active_school_roster_upload_creates_active_student(self):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "active_student_only",
                "Active Student",
                "Urdu",
                "active-student@school.test",
                "pass1234",
                "student",
                "male",
                "Private school",
                "Grade 2",
                "Ignored",
                "Ignored",
                "Punjab",
                "monthly",
            ],
        ])

        response = self.client.post("/api/school/upload-roster/", {"file": upload}, format="multipart")
        self.assertEqual(response.status_code, 200)

        student = User.objects.get(username="active_student_only")
        self.assertEqual(student.account_status, "active")
        self.assertTrue(student.is_active)

    def test_active_school_roster_upload_creates_active_teacher(self):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "active_teacher_only",
                "Active Teacher",
                "Urdu",
                "active-teacher@school.test",
                "pass1234",
                "teacher",
                "female",
                "Private school",
                "Grade 2",
                "Ignored",
                "Ignored",
                "Punjab",
                "monthly",
            ],
        ])

        response = self.client.post("/api/school/upload-roster/", {"file": upload}, format="multipart")
        self.assertEqual(response.status_code, 200)

        teacher = User.objects.get(username="active_teacher_only")
        self.assertEqual(teacher.account_status, "active")
        self.assertTrue(teacher.is_active)

    def test_active_school_roster_upload_syncs_subscription_expiry(self):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "active_expiry_student",
                "Active Expiry Student",
                "Urdu",
                "active-expiry@school.test",
                "pass1234",
                "student",
                "male",
                "Private school",
                "Grade 2",
                "Ignored",
                "Ignored",
                "Punjab",
                "monthly",
            ],
        ])

        response = self.client.post("/api/school/upload-roster/", {"file": upload}, format="multipart")
        self.assertEqual(response.status_code, 200)

        student = User.objects.get(username="active_expiry_student")
        self.assertEqual(student.subscription_expiry, self.school.subscription_expiry)

    def test_pending_school_roster_upload_creates_inactive_user(self):
        pending_school = School.objects.create(
            name="Pending School",
            city="Islamabad",
            province="Federal Territory",
            contact_email="pending@school.test",
            plan_tier="small",
            account_status="pending_payment",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        pending_admin = User.objects.create_user(
            username="pending_school_admin",
            password="testpass123",
            role="school_admin",
            school=pending_school,
        )
        self.client.force_authenticate(user=pending_admin)
        upload = build_roster_file([
            [
                "pending_student",
                "Pending Student",
                "Urdu",
                "pending@school.test",
                "pass1234",
                "student",
                "male",
                "Private school",
                "Grade 2",
                "Ignored",
                "Ignored",
                "Punjab",
                "monthly",
            ],
        ])

        response = self.client.post("/api/school/upload-roster/", {"file": upload}, format="multipart")
        self.assertEqual(response.status_code, 200)

        student = User.objects.get(username="pending_student")
        self.assertEqual(student.account_status, "inactive")
        self.assertFalse(student.is_active)
        self.assertIsNone(student.subscription_expiry)

    def test_admin_bulk_upload_without_school_remains_inactive(self):
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.append(ROSTER_HEADERS)
        sheet.append([
            "retail_import_student",
            "Retail Import",
            "Urdu",
            "retail@example.test",
            "pass1234",
            "student",
            "male",
            "Private school",
            "Grade 2",
            "Retail School",
            "Karachi",
            "Sindh",
            "monthly",
        ])

        result = import_roster_from_workbook(workbook, school=None)
        self.assertEqual(result["uploaded"], 1)

        student = User.objects.get(username="retail_import_student")
        self.assertEqual(student.account_status, "inactive")
        self.assertFalse(student.is_active)
        self.assertIsNone(student.subscription_expiry)
        self.assertIsNone(student.school_id)

    def test_teacher_student_counts_correct(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/users/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["counts"]["teachers"], 1)
        self.assertEqual(response.data["counts"]["students"], 1)
        self.assertEqual(response.data["counts"]["total_users"], 2)

    def test_non_school_admin_blocked(self):
        self.client.force_authenticate(user=self.teacher)
        self.assertEqual(self.client.get("/api/school/users/").status_code, 403)
        self.assertEqual(self.client.get("/api/school/template/").status_code, 403)

        upload = build_roster_file([
            [
                "blocked_student",
                "Blocked Student",
                "Urdu",
                "blocked@school.test",
                "pass1234",
                "student",
                "male",
                "Private school",
                "Grade 2",
                "Ignored",
                "Ignored",
                "Punjab",
                "monthly",
            ],
        ])
        self.assertEqual(
            self.client.post("/api/school/upload-roster/", {"file": upload}, format="multipart").status_code,
            403,
        )
