# payments/constants.py

PKR = "PKR"

PROVIDER_EASYPaisa = "easypaisa"
PROVIDER_JAZZCASH = "jazzcash"
PROVIDERS = {PROVIDER_EASYPaisa, PROVIDER_JAZZCASH}

# Single source of truth for amounts (PKR)
PLAN_MONTHLY = "monthly"
PLAN_YEARLY = "yearly"

PLAN_AMOUNTS = {
    PLAN_MONTHLY: 500,   # <-- set your real monthly price
    PLAN_YEARLY: 5000,   # <-- set your real yearly price
}

DEFAULT_CURRENCY = PKR