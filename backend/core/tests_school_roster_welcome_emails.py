import io
from datetime import timedelta
from unittest.mock import patch

import openpyxl
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Grade, School
from core.roster_upload import import_roster_from_workbook
from core.tests_school_roster import ROSTER_HEADERS, build_roster_file

User = get_user_model()


class SchoolRosterWelcomeEmailTests(TestCase):
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
        self.school_admin = User.objects.create_user(
            username="schooladmin_roster_email",
            password="testpass123",
            role="school_admin",
            school=self.school,
        )
        User.objects.create_user(
            username="existing_student",
            password="testpass123",
            role="student",
            school=self.school,
            grade=self.grade,
            email="existing@school.test",
        )

    @patch("core.emails.send_welcome_email")
    def test_unchecked_upload_sends_no_emails(self, mock_send_welcome):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "new_with_email",
                "New Student",
                "Urdu",
                "new@school.test",
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

        response = self.client.post(
            "/api/school/upload-roster/",
            {"file": upload, "send_welcome_emails": "false"},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["uploaded"], 1)
        self.assertNotIn("emails_sent", response.data)
        self.assertNotIn("emails_skipped", response.data)
        mock_send_welcome.assert_not_called()

    @patch("core.emails.send_welcome_email")
    def test_checked_upload_sends_email_for_new_user_with_email(self, mock_send_welcome):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "emailed_student",
                "Emailed Student",
                "Urdu",
                "emailed@school.test",
                "secret-pass",
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

        response = self.client.post(
            "/api/school/upload-roster/",
            {"file": upload, "send_welcome_emails": "true"},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["uploaded"], 1)
        self.assertEqual(response.data["emails_sent"], 1)
        self.assertEqual(response.data["emails_skipped"], 0)
        mock_send_welcome.assert_called_once()
        user = User.objects.get(username="emailed_student")
        mock_send_welcome.assert_called_with(user, password="secret-pass")

    @patch("core.emails.send_welcome_email")
    def test_checked_upload_skips_user_without_email(self, mock_send_welcome):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "no_email_student",
                "No Email Student",
                "Urdu",
                "",
                "secret-pass",
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

        response = self.client.post(
            "/api/school/upload-roster/",
            {"file": upload, "send_welcome_emails": "true"},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["uploaded"], 1)
        self.assertEqual(response.data["emails_sent"], 0)
        self.assertEqual(response.data["emails_skipped"], 1)
        mock_send_welcome.assert_not_called()

    @patch("core.emails.send_welcome_email")
    def test_checked_upload_does_not_email_skipped_existing_users(self, mock_send_welcome):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "existing_student",
                "Existing Student",
                "Urdu",
                "existing@school.test",
                "secret-pass",
                "student",
                "male",
                "Private school",
                "Grade 2",
                "Ignored",
                "Ignored",
                "Punjab",
                "monthly",
            ],
            [
                "brand_new_student",
                "Brand New",
                "Urdu",
                "brandnew@school.test",
                "secret-pass",
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

        response = self.client.post(
            "/api/school/upload-roster/",
            {"file": upload, "send_welcome_emails": "true"},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["uploaded"], 1)
        self.assertEqual(response.data["skipped"], 1)
        self.assertEqual(response.data["emails_sent"], 1)
        self.assertEqual(response.data["emails_skipped"], 0)
        self.assertEqual(mock_send_welcome.call_count, 1)
        emailed_user = User.objects.get(username="brand_new_student")
        mock_send_welcome.assert_called_with(emailed_user, password="secret-pass")

    @patch("core.emails.send_welcome_email", side_effect=Exception("smtp down"))
    def test_email_failure_does_not_rollback_user_creation(self, mock_send_welcome):
        self.client.force_authenticate(user=self.school_admin)
        upload = build_roster_file([
            [
                "smtp_fail_student",
                "SMTP Fail",
                "Urdu",
                "smtp-fail@school.test",
                "secret-pass",
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

        response = self.client.post(
            "/api/school/upload-roster/",
            {"file": upload, "send_welcome_emails": "true"},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["uploaded"], 1)
        self.assertEqual(response.data["emails_sent"], 0)
        self.assertEqual(response.data["emails_skipped"], 1)
        self.assertTrue(User.objects.filter(username="smtp_fail_student").exists())
        mock_send_welcome.assert_called_once()

    @patch("core.emails.send_welcome_email")
    def test_admin_bulk_upload_does_not_send_emails(self, mock_send_welcome):
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.append(ROSTER_HEADERS)
        sheet.append([
            "admin_import_student",
            "Admin Import",
            "Urdu",
            "admin-import@school.test",
            "secret-pass",
            "student",
            "male",
            "Private school",
            "Grade 2",
            "Retail School",
            "Quetta",
            "Balochistan",
            "monthly",
        ])

        result = import_roster_from_workbook(workbook, school=None)

        self.assertEqual(result["uploaded"], 1)
        self.assertNotIn("emails_sent", result)
        self.assertNotIn("emails_skipped", result)
        mock_send_welcome.assert_not_called()
