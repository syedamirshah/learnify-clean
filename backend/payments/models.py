# backend/payments/models.py
from __future__ import annotations

import uuid
from typing import Optional
from django.db import models
from django.utils import timezone


class Payment(models.Model):
    class Provider(models.TextChoices):
        EASYPaisa = "EASYPaisa", "Easypaisa"
        JAZZCASH = "JAZZCASH", "JazzCash"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED  = "FAILED",  "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey("core.User", on_delete=models.CASCADE, related_name="payments")

    # what is being purchased
    plan = models.CharField(max_length=20, choices=[("monthly", "Monthly"), ("yearly", "Yearly")])
    months = models.PositiveIntegerField(default=1)  # 1 for monthly, 12 for yearly (we’ll set it in view)

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    provider = models.CharField(max_length=12, choices=Provider.choices)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)

    # gateway refs
    merchant_order_id = models.CharField(max_length=64, blank=True, null=True)  # our order ref
    provider_txn_id   = models.CharField(max_length=128, blank=True, null=True) # gateway txn id

    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    # raw blobs we may store (optional)
    request_payload  = models.JSONField(blank=True, null=True)
    response_payload = models.JSONField(blank=True, null=True)
    webhook_payload  = models.JSONField(blank=True, null=True)

    note = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.user.username} / {self.plan} / {self.amount} / {self.status}"

    # --- convenience mutators (avoid PEP-604) ---
    def mark_success(self, provider_txn_id: Optional[str] = None) -> None:
        self.status = self.Status.SUCCESS
        if provider_txn_id:
            self.provider_txn_id = provider_txn_id
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "provider_txn_id", "completed_at"])

    def mark_failed(self, note: Optional[str] = None) -> None:
        self.status = self.Status.FAILED
        if note:
            self.note = note
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "note", "completed_at"])


class PaymentLog(models.Model):
    """
    Lightweight append-only log for each payment.
    """
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="logs")
    created_at = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=10, default="INFO")
    message = models.TextField()
    extra = models.JSONField(blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.created_at:%Y-%m-%d %H:%M} [{self.level}] {self.message[:60]}"