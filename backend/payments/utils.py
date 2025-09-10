# payments/utils.py
import hashlib
import hmac
import os
from datetime import date, timedelta
from django.conf import settings
from .constants import PLAN_MONTHLY, PLAN_YEARLY, PLAN_AMOUNTS, DEFAULT_CURRENCY

def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)

# ---- Easypaisa config (names match your .env) ----
EP_MERCHANT_ID = env("EASYPaisa_MERCHANT_ID")
EP_STORE_ID    = env("EASYPaisa_STORE_ID")
EP_HASH_KEY    = env("EASYPaisa_HASH_KEY")
EP_RETURN_URL  = env("EASYPaisa_RETURN_URL")
EP_BASE_URL    = env("EASYPaisa_BASE_URL")

# ---- JazzCash config ----
JC_MERCHANT_ID   = env("JAZZCASH_MERCHANT_ID")
JC_PASSWORD      = env("JAZZCASH_PASSWORD")
JC_INTEGRITY_SALT= env("JAZZCASH_INTEGRITY_SALT")
JC_RETURN_URL    = env("JAZZCASH_RETURN_URL")
JC_BASE_URL      = env("JAZZCASH_BASE_URL")

def get_amount_for_plan(plan: str) -> int:
    if plan not in PLAN_AMOUNTS:
        raise ValueError(f"Unknown plan '{plan}'")
    return PLAN_AMOUNTS[plan]

def get_currency() -> str:
    return getattr(settings, "PAYMENTS_DEFAULT_CURRENCY", DEFAULT_CURRENCY)

def compute_new_expiry(current_expiry: date | None, plan: str) -> date:
    """Return the new expiry date by adding plan duration from current or today."""
    base = current_expiry if current_expiry and current_expiry >= date.today() else date.today()
    if plan == PLAN_MONTHLY:
        return base + timedelta(days=30)
    elif plan == PLAN_YEARLY:
        return base + timedelta(days=365)
    raise ValueError(f"Unknown plan '{plan}'")

# -------- JazzCash signature helper (HMAC SHA256 over sorted fields) ----------
def jazzcash_signature(payload: dict) -> str:
    """
    JazzCash signature: HMAC-SHA256 of a &-joined sorted payload using the INTEGRITY_SALT.
    Exact field ordering and inclusion should match JazzCash docs for your flow.
    """
    # Build a canonical string like "key1=value1&key2=value2..."
    items = [f"{k}={payload[k]}" for k in sorted(payload.keys()) if payload[k] is not None]
    message = "&".join(items)
    return hmac.new(JC_INTEGRITY_SALT.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()

# -------- Easypaisa hash helper (placeholder — adapt per your API docs) -------
def easypaisa_hash(message: str) -> str:
    """Typically MD5/HMAC SHA256 depending on Easypaisa flow; adjust as per docs."""
    return hmac.new(EP_HASH_KEY.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()