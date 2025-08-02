from django.core.mail import send_mail
from django.conf import settings
import re
from bs4 import BeautifulSoup

def normalize_text(value):
    return re.sub(r'\s+', ' ', BeautifulSoup(str(value), 'html.parser').get_text()).strip().lower()

def send_account_notification_email(user, action, plain_password=None):
    if not user.email:
        return  # No email, do nothing

    subject = ''
    message = ''
    expiry = user.subscription_expiry.strftime('%d %B %Y') if user.subscription_expiry else "N/A"

    if action == 'activated':
        subject = 'Your Learnify account has been activated'
        message = (
            f"Dear {user.full_name},\n\n"
            f"Your account has been successfully activated.\n"
            f"Subscription valid until: {expiry}.\n\n"
            f"Your Login Credentials:\n"
            f"Username: {user.username}\n"
            f"Password: {plain_password if plain_password else '[Not available]'}\n\n"
            f"Login here: http://localhost:5173/login\n\n"
            f"Please keep your credentials safe and do not share them with others.\n\n"
            f"Thank you,\nLearnify Pakistan Team"
        )

    elif action == 'extended':
        subject = 'Your Learnify subscription has been extended'
        message = (
            f"Dear {user.full_name},\n\n"
            f"Your subscription plan has been successfully extended.\n"
            f"New expiry date: {expiry}.\n\n"
            f"Continue enjoying Learnify services without interruption.\n\n"
            f"Thank you,\nLearnify Pakistan Team"
        )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
