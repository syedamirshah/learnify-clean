from django.urls import path
from . import views

app_name = "payments"

urlpatterns = [
    # --- No-login user entry to payment ---
    path("choose/", views.choose_plan, name="choose"),

    # --- Authenticated initiation (if needed later) ---
    path("initiate/", views.initiate, name="initiate"),

    # --- Easypay transaction flow ---
    path("easypay/start/<uuid:pk>/", views.easypay_start, name="easypay_start"),
    path("easypay/token-handler/", views.easypay_token_handler, name="easypay_token_handler"),
    path("easypay/status-handler/", views.easypay_status_handler, name="easypay_status_handler"),

    # --- Read APIs for signed-in users ---
    path("mine/", views.my_payments, name="my_payments"),
    path("<uuid:pk>/", views.payment_detail, name="payment_detail"),
]