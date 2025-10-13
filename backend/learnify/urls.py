from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import csrf_view  # import at the top
from payments import views as pay_views

# From admin_views only the admin-only views:
from core.admin_views import (
    bulk_upload_students,
    manage_subscriptions,
)

# These three upload views are in core.views
from core.views import (
    register,
    bulk_upload_scq,
    bulk_upload_mcq,
    bulk_upload_fib,
)

# Stats dashboard is in admin_stats_views
from core.admin_stats_views import stats_dashboard_view

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Mount the app routes at root
    path('', include('core.urls')),

    # --- Custom admin page must be ABOVE the admin.site.urls include ---
    path('admin/payments/', pay_views.admin_payments_dashboard, name='payments_admin'),

    # Admin
    path('admin/', admin.site.urls),
    path('admin/core/user/bulk_upload/', bulk_upload_students, name='bulk_upload_students'),
    path('admin/stats-dashboard/', stats_dashboard_view, name='admin-stats-dashboard'),

    # Auth/registration
    path('register/', register, name='register'),
    path('manage-subscriptions/', manage_subscriptions, name='manage_subscriptions'),

    # Question Bank upload endpoints
    path('admin/core/question-bank/<int:bank_id>/upload-scq/', bulk_upload_scq, name='bulk_upload_scq'),
    path('admin/core/question-bank/<int:bank_id>/upload-mcq/', bulk_upload_mcq, name='bulk_upload_mcq'),
    path('admin/core/question-bank/<int:bank_id>/upload-fib/', bulk_upload_fib, name='bulk_upload_fib'),

    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # CKEditor upload/browse
    path('ckeditor/', include('ckeditor_uploader.urls')),

    # (Optional) If you really want every route also under /api/, uncomment:
    # path('api/', include('core.urls')),

    path('api/', include('core.urls')),          # expose your app also under /api/
    path('api/csrf/', csrf_view, name='csrf'),   # GET once to set csrftoken cookie

    path('api/payments/', include('payments.urls')),
]

# Always serve MEDIA on this service so CKEditor images work (even with DEBUG=False)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)