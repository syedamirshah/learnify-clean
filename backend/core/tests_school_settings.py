from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import School

User = get_user_model()


class SchoolSettingsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(
            name="Beaconhouse Quetta",
            city="Quetta",
            province="Balochistan",
            contact_email="principal@beaconhouse.test",
            contact_phone="03001234567",
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
            username="schooladmin_settings",
            password="OldPass123!",
            role="school_admin",
            school=self.school,
            full_name="Principal Ali",
            email="principal@beaconhouse.test",
            school_name=self.school.name,
            city=self.school.city,
            province=self.school.province,
        )
        self.other_admin = User.objects.create_user(
            username="other_admin",
            password="OldPass123!",
            role="school_admin",
            school=self.other_school,
            school_name=self.other_school.name,
            city=self.other_school.city,
            province=self.other_school.province,
        )
        self.teacher = User.objects.create_user(
            username="teacher_settings",
            password="OldPass123!",
            role="teacher",
            school=self.school,
        )

    def test_school_admin_can_get_settings(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.get("/api/school/settings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["school"]["name"], "Beaconhouse Quetta")
        self.assertEqual(response.data["principal"]["username"], "schooladmin_settings")
        self.assertEqual(response.data["capacity"]["used_students"], 0)
        self.assertEqual(response.data["capacity"]["max_students"], 200)

    def test_school_admin_can_update_settings(self):
        self.client.force_authenticate(user=self.school_admin)
        payload = {
            "name": "Beaconhouse Quetta Campus",
            "city": "Quetta",
            "province": "Balochistan",
            "contact_email": "office@beaconhouse.test",
            "contact_phone": "03009998877",
        }
        response = self.client.patch("/api/school/settings/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["school"]["name"], "Beaconhouse Quetta Campus")
        self.assertEqual(response.data["school"]["contact_email"], "office@beaconhouse.test")

        self.school.refresh_from_db()
        self.school_admin.refresh_from_db()
        self.assertEqual(self.school.name, "Beaconhouse Quetta Campus")
        self.assertEqual(self.school_admin.school_name, "Beaconhouse Quetta Campus")
        self.assertEqual(self.school_admin.city, "Quetta")
        self.assertEqual(self.school_admin.province, "Balochistan")
        self.assertEqual(self.school_admin.email, "principal@beaconhouse.test")

    def test_non_school_admin_forbidden(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get("/api/school/settings/")
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(
            "/api/school/settings/",
            {"name": "Hack", "city": "X", "province": "Punjab", "contact_email": "x@test.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_uniqueness_enforced(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.patch(
            "/api/school/settings/",
            {
                "name": "Other School",
                "city": "Lahore",
                "province": "Punjab",
                "contact_email": "dup@test.com",
                "contact_phone": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data["errors"])

    def test_invalid_province_rejected(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.patch(
            "/api/school/settings/",
            {
                "name": "Beaconhouse Quetta",
                "city": "Quetta",
                "province": "Invalid Province",
                "contact_email": "principal@beaconhouse.test",
                "contact_phone": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("province", response.data["errors"])

    def test_school_admin_password_change_smoke_test(self):
        self.client.force_authenticate(user=self.school_admin)
        response = self.client.post(
            "/api/user/change-password/",
            {
                "old_password": "OldPass123!",
                "new_password": "NewPass456!",
                "confirm_password": "NewPass456!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.school_admin.refresh_from_db()
        self.assertTrue(self.school_admin.check_password("NewPass456!"))
