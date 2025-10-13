from __future__ import annotations

import uuid
from django.conf import settings
from django.db import models


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments"
    )

    # minimal business fields – extend as you like
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)

    # gateway references
    merchant_order_id = models.CharField(max_length=24, db_index=True, blank=True)
    provider_txn_id = models.CharField(max_length=64, blank=True)

    # debugging/trace
    request_payload = models.JSONField(default=dict, blank=True)
    webhook_payload = models.JSONField(default=dict, blank=True)

    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def mark_success(self, provider_txn_id: str | None = None):
        from django.utils import timezone

        self.status = self.Status.SUCCESS
        if provider_txn_id:
            self.provider_txn_id = provider_txn_id
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "provider_txn_id", "completed_at"])

    def mark_failed(self):
        from django.utils import timezone

        self.status = self.Status.FAILED
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at"])

    def __str__(self):
        return f"{self.user} • {self.amount} • {self.status}"