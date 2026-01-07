# core/utils.py
from __future__ import annotations
from django.core.mail import send_mail
from django.conf import settings

import os
import re
from bs4 import BeautifulSoup


# -----------------------------------------------------------------------------
# Configurable origins (via env)
# -----------------------------------------------------------------------------
# Where media actually lives publicly (your backend domain)
PUBLIC_BACKEND_ORIGIN = os.getenv("PUBLIC_BACKEND_ORIGIN", "").rstrip("/")
# Where users should log in (your frontend domain)
PUBLIC_FRONTEND_ORIGIN = os.getenv("PUBLIC_FRONTEND_ORIGIN", "https://learnifypakistan.com").rstrip("/")


# -----------------------------------------------------------------------------
# Existing helpers (kept intact)
# -----------------------------------------------------------------------------
def normalize_text(value):
    """
    Strip HTML, collapse spaces, lowercase.
    """
    return re.sub(r'\s+', ' ', BeautifulSoup(str(value), 'html.parser').get_text()).strip().lower()


# -----------------------------------------------------------------------------
# NEW (SAFE): numeric comma normalization for FIB answers only
# -----------------------------------------------------------------------------
# Accept:
#   1234
#   1,234
#   12,345,678
# Reject (won't modify):
#   1, 234   (space)
#   12,34    (wrong grouping)
#   abc,123  (not numeric)
_INTL_COMMA_NUMBER_RE = re.compile(r"^\d{1,3}(?:,\d{3})+$")
_PLAIN_NUMBER_RE = re.compile(r"^\d+$")


def normalize_numeric_commas(value) -> str:
    """
    For numeric-like FIB inputs, ignore commas safely.

    - Removes HTML tags (if any)
    - Trims whitespace
    - If value is a plain integer or a correctly comma-grouped integer
      (International system), return the digits-only version.
    - Otherwise, return the cleaned text unchanged.

    IMPORTANT: This is intended to be used ONLY in FIB comparisons
    (not in "put commas correctly" quizzes, which you are converting to SCQ).
    """
    if value is None:
        return ""

    # Strip HTML but DO NOT lowercase (numbers don't need it; text should use normalize_text)
    text = BeautifulSoup(str(value), "html.parser").get_text()
    text = text.strip()

    if not text:
        return ""

    # Only normalize commas if it's clearly a number in international grouping
    if _PLAIN_NUMBER_RE.match(text):
        return text
    if _INTL_COMMA_NUMBER_RE.match(text):
        return text.replace(",", "")

    # Not a pure number -> return as-is (trimmed)
    return text


def send_account_notification_email(user, action, plain_password=None):
    """
    Send activation/extension emails. Login URL now uses PUBLIC_FRONTEND_ORIGIN
    instead of localhost.
    """
    if not user.email:
        return  # No email, do nothing

    subject = ''
    message = ''
    expiry = user.subscription_expiry.strftime('%d %B %Y') if user.subscription_expiry else "N/A"

    login_url = f"{PUBLIC_FRONTEND_ORIGIN}/login"

    if action == 'activated':
        subject = 'Your Learnify account has been activated'
        message = (
            f"Dear {user.full_name},\n\n"
            f"Your account has been successfully activated.\n"
            f"Subscription valid until: {expiry}.\n\n"
            f"Your Login Credentials:\n"
            f"Username: {user.username}\n"
            f"Password: {plain_password if plain_password else '[Not available]'}\n\n"
            f"Login here: {login_url}\n\n"
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

    if subject and message:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )


# -----------------------------------------------------------------------------
# NEW: HTML media URL normalization
# -----------------------------------------------------------------------------
# Matches src="http://localhost:8000/media/...", src="/media/...", src="https://127.0.0.1:8000/media/..."
_SRC_RE = re.compile(
    r'''(?P<prefix>\bsrc\s*=\s*["'])               # src=" or src='
        (?P<url>
            (?:https?://(?:localhost|127\.0\.0\.1)(?::\d+)?|)   # localhost or 127.0.0.1 or empty
            /?media/\S+                                         # /media/...
        )
        (?P<suffix>["'])
    ''',
    re.VERBOSE | re.IGNORECASE
)


def _abs_media(url: str) -> str:
    """
    Convert any localhost/relative media URL to absolute URL on PUBLIC_BACKEND_ORIGIN.
    Leaves already-correct absolute URLs alone if they point to /media on the same host.
    """
    if not url:
        return url
    # Keep only the path from /media/ onward
    media_idx = url.lower().find("/media/")
    path = url[media_idx:] if media_idx != -1 else url
    if PUBLIC_BACKEND_ORIGIN:
        return f"{PUBLIC_BACKEND_ORIGIN}{path}"
    # Fallback: return the path (useful in dev if env not set)
    return path


def fix_media_src(html: str | None) -> str | None:
    """
    Rewrite any <img src="..."> that uses localhost/127.0.0.1 or a bare /media/ path
    so that it always points to the public backend origin.
    Safe to call on any HTML field before save or before render.
    """
    if not html:
        return html

    def _repl(m: re.Match) -> str:
        return f"{m.group('prefix')}{_abs_media(m.group('url'))}{m.group('suffix')}"

    return _SRC_RE.sub(_repl, html)


def sanitize_html_for_save(html: str | None) -> str | None:
    """
    Convenience: normalize media src + trim obvious whitespace noise.
    (Does not strip markup—use normalize_text if you want plain text.)
    """
    if html is None:
        return None
    fixed = fix_media_src(html)
    return fixed.strip() if isinstance(fixed, str) else fixed