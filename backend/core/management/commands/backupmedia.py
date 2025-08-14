import os
import datetime
import zipfile
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Creates a ZIP archive of all media files in MEDIA_ROOT.'

    def handle(self, *args, **options):
        if not settings.MEDIA_ROOT:
            self.stdout.write(self.style.ERROR("MEDIA_ROOT is not set. Cannot proceed."))
            return

        backup_dir = os.path.join(settings.MEDIA_ROOT, 'backups')
        os.makedirs(backup_dir, exist_ok=True)

        timestamp = datetime.datetime.now().strftime('%Y-%m-%d_%H-%M')
        backup_filename = f"media_backup_{timestamp}.zip"
        backup_path = os.path.join(backup_dir, backup_filename)

        self.stdout.write(self.style.SUCCESS(f"Creating media backup: {backup_filename}"))

        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(settings.MEDIA_ROOT):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Don't include backups inside backups
                    if 'backups' in file_path:
                        continue
                    arcname = os.path.relpath(file_path, settings.MEDIA_ROOT)
                    zipf.write(file_path, arcname)

        self.stdout.write(self.style.SUCCESS(f"Media backup created at {backup_path}"))