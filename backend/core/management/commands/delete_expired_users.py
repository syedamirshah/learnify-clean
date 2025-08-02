from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import User

class Command(BaseCommand):
    help = 'Delete users whose subscription expired more than 60 days ago'

    def handle(self, *args, **kwargs):
        threshold_date = timezone.now() - timedelta(days=60)
        expired_users = User.objects.filter(subscription_expiry__lt=threshold_date)
        count = expired_users.count()
        expired_users.delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {count} expired users.'))