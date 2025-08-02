from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from core.models import User
from datetime import timedelta, date
from django.conf import settings

class Command(BaseCommand):
    help = 'Send reminder emails to users whose subscription will expire in 5 days.'

    def handle(self, *args, **kwargs):
        target_date = date.today() + timedelta(days=5)
        users_to_notify = User.objects.filter(subscription_expiry=target_date)

        if not users_to_notify.exists():
            self.stdout.write("📭 No users expiring in 5 days.")
            return

        for user in users_to_notify:
            if not user.email:
                continue

            subject = "📢 Reminder: Your Learnify Pakistan subscription is expiring soon!"
            message = (
                f"Dear {user.full_name},\n\n"
                f"Your subscription is set to expire on {user.subscription_expiry}.\n"
                f"Please renew your subscription to continue enjoying access to quizzes, reports, and awards.\n\n"
                "Visit your Learnify account to renew now.\n\n"
                "Thank you,\n"
                "Team Learnify Pakistan"
            )

            try:
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
                self.stdout.write(f"✅ Reminder sent to: {user.email}")
            except Exception as e:
                self.stderr.write(f"❌ Failed to send reminder to {user.email}: {str(e)}")