import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnify.settings')  # ✅ change if your settings file is different
django.setup()

from core.models import FIBQuestion

def fix_answers():
    count = 0
    for q in FIBQuestion.objects.all():
        ans = q.correct_answers
        if isinstance(ans, str):
            try:
                parsed = json.loads(ans)
                if isinstance(parsed, dict):
                    q.correct_answers = parsed
                    q.save()
                    count += 1
            except json.JSONDecodeError:
                continue
    print(f"{count} FIB questions were fixed.")

if __name__ == "__main__":
    fix_answers()
