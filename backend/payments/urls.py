from django.urls import path
from .admin_views import payments_console

from .views import (
    PricingView,
    CreatePaymentSessionView,
    PaymentStatusView,
    gateway_callback,
)

urlpatterns = [
    path("pricing/", PricingView.as_view(), name="payments-pricing"),
    path("create-session/", CreatePaymentSessionView.as_view(), name="payments-create-session"),
    path("status/<uuid:payment_id>/", PaymentStatusView.as_view(), name="payments-status"),
    path("callback/<str:provider>/", gateway_callback, name="payments-callback"),  # GET from gateway
    path("admin/console/", payments_console, name="payments_console"),

]