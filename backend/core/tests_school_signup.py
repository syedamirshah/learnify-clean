from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import School

User = get_user_model()

VALID_PAYLOAD = {
    "school_name": "City School Islamabad",
    "city": "Islamabad",
    "province": "Federal Territory",
    "contact_email": "principal@cityschool.test",
    "contact_phone": "03001234567",
    "principal_full_name": "Ayesha Khan",
    "username": "cityschool_admin",
    "password": "securepass123",
    "confirm_password": "securepass123",
    "plan_tier": "small",
    "billing_cycle": "yearly",
}


class SchoolSignupApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_school_signup_creates_school(self):
        response = self.client.post("/api/school/signup/", VALID_PAYLOAD, format="json")
        self.assertEqual(response.status_code, 201)
        school = School.objects.get(pk=response.data["school_id"])
        self.assertEqual(school.name, "City School Islamabad")
        self.assertEqual(school.account_status, "pending_payment")
        self.assertEqual(school.plan_tier, "small")
        self.assertEqual(school.billing_cycle, "yearly")

    def test_school_signup_creates_school_admin_user(self):
        response = self.client.post("/api/school/signup/", VALID_PAYLOAD, format="json")
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="cityschool_admin")
        self.assertEqual(user.role, "school_admin")
        self.assertEqual(user.account_status, "inactive")
        self.assertTrue(user.is_active)

    def test_school_signup_links_user_to_school(self):
        response = self.client.post("/api/school/signup/", VALID_PAYLOAD, format="json")
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="cityschool_admin")
        school = School.objects.get(pk=response.data["school_id"])
        self.assertEqual(user.school_id, school.id)
        self.assertEqual(user.school_name, school.name)
        self.assertEqual(user.city, school.city)

    def test_duplicate_username_rejected(self):
        self.client.post("/api/school/signup/", VALID_PAYLOAD, format="json")
        duplicate = {**VALID_PAYLOAD, "school_name": "Another School", "city": "Lahore"}
        response = self.client.post("/api/school/signup/", duplicate, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data["errors"])

    def test_invalid_plan_rejected(self):
        payload = {**VALID_PAYLOAD, "username": "invalid_plan_user", "plan_tier": "mega"}
        response = self.client.post("/api/school/signup/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("plan_tier", response.data["errors"])

    def test_duplicate_school_name_city_rejected(self):
        self.client.post("/api/school/signup/", VALID_PAYLOAD, format="json")
        payload = {
            **VALID_PAYLOAD,
            "username": "another_admin",
            "contact_email": "other@cityschool.test",
        }
        response = self.client.post("/api/school/signup/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("school_name", response.data["errors"])
