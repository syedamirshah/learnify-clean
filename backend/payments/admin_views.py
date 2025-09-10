# backend/payments/admin_views.py
from datetime import timedelta
from django.utils import timezone
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.db import models

from .models import Payment

# Preset ranges
RANGE_PRESETS = {
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "120d": timedelta(days=120),
    "1y": timedelta(days=365),
    "all": None,   # no lower bound
}

@staff_member_required
def payments_console(request):
    """
    Payments console with quick range filters (default: 7d).
    """
    now = timezone.now()
    range_key = (request.GET.get("range") or "7d").lower()
    if range_key not in RANGE_PRESETS:
        range_key = "7d"

    delta = RANGE_PRESETS[range_key]
    since = now - delta if delta else None

    # Base queryset (newest first)
    qs = Payment.objects.select_related("user").order_by("-initiated_at")
    if since:
        qs = qs.filter(initiated_at__gte=since)

    # Stats for the selected range
    total = qs.count()
    success = qs.filter(status="success").count()
    failed = qs.filter(status="failed").count()
    pending = Payment.objects.filter(status="pending").count()  # pending is global
    amount_sum = qs.filter(status="success").aggregate(models.Sum("amount"))["amount__sum"] or 0

    # Cap list to keep page snappy
    rows = list(qs[:200])

    context = {
        "range_key": range_key,
        "range_presets": {
            "7d": "Last 7 days",
            "30d": "Last 30 days",
            "120d": "Last 120 days",
            "1y": "Last 1 year",
            "all": "All time",
        },
        "stats": {
            "total": total,
            "success": success,
            "failed": failed,
            "pending": pending,
            "amount_sum": amount_sum,
        },
        "rows": rows,
    }
    return render(request, "admin/core/payments_console.html", context)