from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from core.admin_views import (
    bulk_upload_students,
    manage_subscriptions,
    bulk_upload_scq,
    bulk_upload_mcq,
    bulk_upload_fib,
    stats_dashboard_view  # ‚Äö√∫√ñ Fixed import here
)
from core.views import register
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('', include('core.urls')),

    path('admin/', admin.site.urls),
    path('admin/core/user/bulk_upload/', bulk_upload_students, name='bulk_upload_students'),
    path('register/', register, name='register'),
    path('manage-subscriptions/', manage_subscriptions, name='manage_subscriptions'),

    # Question Bank Upload Endpoints
    path('admin/core/question-bank/<int:bank_id>/upload-scq/', bulk_upload_scq, name='bulk_upload_scq'),
    path('admin/core/question-bank/<int:bank_id>/upload-mcq/', bulk_upload_mcq, name='bulk_upload_mcq'),
    path('admin/core/question-bank/<int:bank_id>/upload-fib/', bulk_upload_fib, name='bulk_upload_fib'),

    # JWT Auth Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API Routes
    path('api/', include('core.urls')),

    # CKEditor Upload/Browse Support
    path('ckeditor/', include('ckeditor_uploader.urls')),

    # ‚Äö√∫√ñ Admin Stats Dashboard (final line)
    path('admin/stats-dashboard/', stats_dashboard_view, name='admin-stats-dashboard'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
