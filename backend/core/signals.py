# backend/core/signals.py
from __future__ import annotations

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .emails import (
    send_welcome_email,
    send_payment_receipt_email,
    send_password_change_email,   # 👈 optional import for view usage

)

User = get_user_model()


# -------------------------------------------------------------------
# (i) ACCOUNT CREATION → welcome email
# -------------------------------------------------------------------
@receiver(post_save, sender=User)
def _send_welcome_on_create(sender, instance: User, created: bool, **kwargs):
    """
    Fire once when a new user row is created.
    If your creation code sets instance._plain_password, it will be included.
    """
    if not created:
        return
    plain = getattr(instance, "_plain_password", "")  # optional
    try:
        send_welcome_email(instance, password=plain)
    except Exception:
        # Never break user creation on mail errors
        pass


# -------------------------------------------------------------------
# (ii) PAYMENT SUCCESS → receipt email
#      We detect a transition to Status.SUCCESS using pre_save + post_save.
# -------------------------------------------------------------------
Payment = apps.get_model("payments", "Payment")  # lazy import to avoid circulars


@receiver(pre_save, sender=Payment)
def _stash_old_payment_status(sender, instance, **kwargs):
    """
    Before saving, stash the previous status (if this is an update).
    """
    if not instance.pk:
        instance._old_status = None
        return
    try:
        old = sender.objects.only("status").get(pk=instance.pk)
        instance._old_status = old.status
    except sender.DoesNotExist:
        instance._old_status = None


@receiver(post_save, sender=Payment)
def _send_receipt_on_success(sender, instance, created: bool, **kwargs):
    """
    Send receipt only when status moves to SUCCESS
    (either created as success or updated from non-success → success).
    """
    try:
        Status = sender.Status  # enum from the Payment model
        moved_to_success = (
            instance.status == Status.SUCCESS
            and (created or getattr(instance, "_old_status", None) != Status.SUCCESS)
        )
        if moved_to_success:
            send_payment_receipt_email(instance.user, instance)
    except Exception:
        # Never block request flow on mail issues
        pass