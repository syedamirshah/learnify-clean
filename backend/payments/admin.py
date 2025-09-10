# backend/payments/admin.py
from django.contrib import admin, messages
from django.utils import timezone
from .models import Payment, PaymentLog


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "plan",
        "months",
        "amount",
        "provider",
        "status",
        "merchant_order_id",
        "provider_txn_id",
        "initiated_at",
        "completed_at",
    )
    list_filter = ("provider", "status", "plan", "initiated_at", "completed_at")
    search_fields = ("id", "user__username", "merchant_order_id", "provider_txn_id")
    ordering = ("-initiated_at", "-id")
    date_hierarchy = "initiated_at"
    list_per_page = 50

    readonly_fields = (
        "id",                 # primary key is fine to include here
        "initiated_at",
        "completed_at",
        "request_payload",
        "response_payload",
        "webhook_payload",
    )

    fieldsets = (
        ("Who & What", {
            "fields": ("user", "plan", "months", "amount"),
        }),
        ("Gateway", {
            "fields": ("provider", "status", "merchant_order_id", "provider_txn_id"),
        }),
        ("Timestamps", {
            "fields": ("initiated_at", "completed_at"),
        }),
        ("Payloads (raw)", {
            "classes": ("collapse",),
            "fields": ("request_payload", "response_payload", "webhook_payload"),
        }),
        ("Notes", {
            "fields": ("note",),
        }),
    )

    autocomplete_fields = ("user",)

    # --- Optional: quick admin actions (won't error if fields exist as in your model) ---
    actions = ("mark_as_success", "mark_as_failed", "mark_as_pending")

    def mark_as_success(self, request, queryset):
        updated = 0
        now = timezone.now()
        for p in queryset:
            p.status = "success"
            if not p.completed_at:
                p.completed_at = now
            p.save(update_fields=["status", "completed_at"])
            updated += 1
        self.message_user(request, f"Marked {updated} payment(s) as SUCCESS.", messages.SUCCESS)

    mark_as_success.short_description = "Mark selected payments as SUCCESS"

    def mark_as_failed(self, request, queryset):
        updated = queryset.update(status="failed")
        self.message_user(request, f"Marked {updated} payment(s) as FAILED.", messages.WARNING)

    mark_as_failed.short_description = "Mark selected payments as FAILED"

    def mark_as_pending(self, request, queryset):
        updated = queryset.update(status="pending", completed_at=None)
        self.message_user(request, f"Reset {updated} payment(s) to PENDING.", messages.INFO)

    mark_as_pending.short_description = "Set selected payments to PENDING"


@admin.register(PaymentLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ("id", "payment", "created_at", "level", "message_short")
    list_filter = ("level", "created_at")
    search_fields = ("payment__id", "payment__user__username", "message")
    ordering = ("-created_at", "-id")
    readonly_fields = ("created_at",)
    list_per_page = 50

    def message_short(self, obj):
        return (obj.message or "")[:80]

    message_short.short_description = "Message"