from django.core.management.base import BaseCommand
from core.models import User

MANAGER_CREDENTIALS = [
    ("manager_1", "Manager 1"),
    ("manager_2", "Manager 2"),
    ("manager_3", "Manager 3"),
    ("manager_4", "Manager 4"),
    ("manager_5", "Manager 5"),
]

class Command(BaseCommand):
    help = "Create 5 fixed manager accounts"

    def handle(self, *args, **kwargs):
        for username, full_name in MANAGER_CREDENTIALS:
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(
                    username=username,
                    email="syedamirshah@gmail.com",
                    password="abcd1234",
                    role="manager",
                    first_name=full_name,
                    account_status="active"
                )
                self.stdout.write(self.style.SUCCESS(f"Created: {username}"))
            else:
                self.stdout.write(f"Skipped (already exists): {username}")