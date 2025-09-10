from decimal import Decimal
from rest_framework import serializers
from django.conf import settings
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "user",
            "plan",
            "amount",
            "currency",
            "provider",
            "status",
            "merchant_invoice_id",
            "provider_txn_id",
            "redirect_url",
            "return_url",
            "callback_url",
            "description",
            "meta",
            "created_at",
            "paid_at",
            "subscription_applied",
        ]
        read_only_fields = [
            "id",
            "user",
            "amount",
            "currency",
            "status",
            "merchant_invoice_id",
            "provider_txn_id",
            "redirect_url",
            "return_url",
            "callback_url",
            "created_at",
            "paid_at",
            "subscription_applied",
        ]


class CreatePaymentSessionSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=[("easypaisa", "Easypaisa"), ("jazzcash", "JazzCash")])
    plan = serializers.ChoiceField(choices=[("monthly", "Monthly"), ("yearly", "Yearly")])

    def validate(self, attrs):
        plan = attrs["plan"]
        pricing = getattr(settings, "PAYMENT_PRICING", {})
        plan_cfg = pricing.get(plan) or {}
        amount = plan_cfg.get("amount")
        if amount is None:
            raise serializers.ValidationError("Pricing for the selected plan is not configured.")
        # attach computed amount for the view
        attrs["amount"] = Decimal(str(amount))
        attrs["currency"] = plan_cfg.get("currency", "PKR")
        return attrs


class PricingSerializer(serializers.Serializer):
    monthly = serializers.DictField()
    yearly = serializers.DictField()