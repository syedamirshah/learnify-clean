# core/middleware.py

from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

class AutoExpireUserMiddleware(MiddlewareMixin):
    def process_request(self, request):
        user = request.user
        if user.is_authenticated:
            if user.subscription_expiry and user.subscription_expiry < timezone.now().date():
                if user.account_status != 'expired':
                    user.account_status = 'expired'
                    user.is_active = False
                    user.save()