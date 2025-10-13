from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "amount", "status", "merchant_order_id", "provider_txn_id", "initiated_at")
    list_filter = ("status", "initiated_at")
    search_fields = ("id", "merchant_order_id", "provider_txn_id", "user__username", "user__email")
    readonly_fields = ("initiated_at", "completed_at", "request_payload", "webhook_payload")