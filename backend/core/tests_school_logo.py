from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import School

User = get_user_model()

MINIMAL_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
    b"\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82"
)


@override_settings(
    STORAGES={
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    },
    MEDIA_ROOT="/tmp/learnify-test-media",
)
class SchoolLogoApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(
            name="Logo Test School",
            city="Islamabad",
            province="Federal Territory",
            contact_email="logo@school.test",
            plan_tier="small",
            account_status="active",
            subscription_expiry=timezone.now().date() + timedelta(days=30),
        )
        self.school_admin = User.objects.create_user(
            username="logo_school_admin",
            password="OldPass123!",
            role="school_admin",
            school=self.school,
        )
        self.teacher = User.objects.create_user(
            username="logo_teacher",
            password="OldPass123!",
            role="teacher",
            school=self.school,
        )

    def _png_upload(self, name="logo.png", size=None):
        content = MINIMAL_PNG if size is None else MINIMAL_PNG + (b"0" * (size - len(MINIMAL_PNG)))
        return SimpleUploadedFile(name, content, content_type="image/png")

    def test_school_admin_can_upload_logo(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/school/settings/logo/",
            {"logo": self._png_upload()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertTrue(response.data["logo_url"])
        self.school.refresh_from_db()
        self.assertTrue(bool(self.school.logo))

    def test_non_school_admin_forbidden(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            "/api/school/settings/logo/",
            {"logo": self._png_upload()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 403)

    def test_invalid_file_type_rejected(self):
        self.client.force_authenticate(user=self.school_admin)
        bad_file = SimpleUploadedFile("notes.txt", b"not-an-image", content_type="text/plain")
        response = self.client.post(
            "/api/school/settings/logo/",
            {"logo": bad_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid file type", response.data["error"])

    def test_oversized_file_rejected(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/school/settings/logo/",
            {"logo": self._png_upload(size=(2 * 1024 * 1024) + 1)},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("2MB", response.data["error"])

    def test_logo_url_returned_in_settings_payload(self):
        self.client.force_authenticate(user=self.school_admin)
        upload = self.client.post(
            "/api/school/settings/logo/",
            {"logo": self._png_upload()},
            format="multipart",
        )
        self.assertEqual(upload.status_code, 200)

        response = self.client.get("/api/school/settings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["school"]["logo_url"], upload.data["logo_url"])
