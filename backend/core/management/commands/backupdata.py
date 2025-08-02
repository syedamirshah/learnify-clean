import os
import datetime
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings

class Command(BaseCommand):
    help = 'Creates a JSON backup of the entire database and stores only the latest 3 backups.'

    def handle(self, *args, **options):
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        timestamp = datetime.datetime.now().strftime('%Y-%m-%d_%H-%M')
        backup_filename = f"backup_{timestamp}.json"
        backup_path = os.path.join(backup_dir, backup_filename)

        self.stdout.write(self.style.SUCCESS(f"Creating backup: {backup_filename}"))
        
        # Dump database to JSON
        with open(backup_path, 'w', encoding='utf-8') as f:
            call_command('dumpdata', '--natural-primary', '--natural-foreign', '--indent', '2', stdout=f)

        self.stdout.write(self.style.SUCCESS(f"Backup created at {backup_path}"))

        # Keep only 3 most recent backups
        backups = sorted([f for f in os.listdir(backup_dir) if f.endswith('.json')])
        if len(backups) > 3:
            for old_file in backups[:-3]:
                old_path = os.path.join(backup_dir, old_file)
                os.remove(old_path)
                self.stdout.write(self.style.WARNING(f"Deleted old backup: {old_file}"))