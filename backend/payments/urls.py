from django.urls import path
from . import views

app_name = "payments"

urlpatterns = [
    path("initiate/", views.initiate, name="initiate"),
    path("easypay/start/<uuid:pk>/", views.easypay_start, name="easypay_start"),
    path("easypay/token-handler/", views.easypay_token_handler, name="easypay_token_handler"),
    path("easypay/status-handler/", views.easypay_status_handler, name="easypay_status_handler"),
]