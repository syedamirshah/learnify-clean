from pathlib import Path
import os
from datetime import timedelta
import dj_database_url


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY") or os.environ.get("DJANGO_SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DEBUG", "True").lower() == "true"

# Surface full tracebacks to logs even when DEBUG=False (controlled by env var)
DEBUG_PROPAGATE_EXCEPTIONS = os.getenv("DEBUG_PROPAGATE_EXCEPTIONS", "0") == "1"

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "learnifypakistan.com",
    "www.learnifypakistan.com",
    "learnify-backend-zlf7.onrender.com",  # ✅ Add this
    "api.learnifypakistan.com",
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',
    'django_extensions',
    'ckeditor',
    'ckeditor_uploader',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'cloudinary',
    'cloudinary_storage',
    'payments',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',     # ✅ directly after SecurityMiddleware
    'corsheaders.middleware.CorsMiddleware',          # ✅ as high as possible, before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'learnify.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'core/templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'learnify.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

if os.getenv("DATABASE_URL"):
    # ✅ Use Postgres in production (e.g., Render)
    DATABASES = {
        "default": dj_database_url.config(
            conn_max_age=600,
            ssl_require=True,  # only used if DATABASE_URL exists (Postgres)
        )
    }
else:
    # ✅ Fallback to SQLite locally
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'                                  # ✅ leading slash
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# CKEditor uploads will use Django's default storage (which we switch to Cloudinary in prod)
CKEDITOR_UPLOAD_PATH = "uploads"

# Always keep a real local MEDIA_ROOT so admin utilities (backups/exports) have a filesystem path.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Optional: dedicated local folder for backups/exports
BACKUP_DIR = BASE_DIR / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

# Use Cloudinary for media in production (when CLOUDINARY_URL is present)
USE_CLOUDINARY = bool(os.environ.get("CLOUDINARY_URL"))

if USE_CLOUDINARY:
    # Store user-uploaded media via Cloudinary
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
    CKEDITOR_STORAGE_BACKEND = "cloudinary_storage.storage.MediaCloudinaryStorage"

    CLOUDINARY_STORAGE = {
        "CLOUDINARY_URL": os.environ.get("CLOUDINARY_URL"),
        "MEDIA_PREFIX": "learnify/uploads",  # keep assets grouped
    }

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'core.User'

CKEDITOR_CONFIGS = {
    'default': {
        'toolbar': 'custom',
        'extraAllowedContent': 'iframe[*];img[!src,width,height,alt];',
        'height': 300,
        'width': '100%',
        'toolbar_Custom': [
            ['Bold', 'Italic', 'Underline'],
            ['NumberedList', 'BulletedList'],
            ['Link', 'Unlink'],
            ['Image', 'Embed', 'Iframe'],
            ['Source', 'Maximize'],
        ],
        'extraPlugins': ','.join([
            'image2',
            'embed',
            'embedsemantic',
            'autoembed',
            'clipboard',
            'dialog',
            'dialogui',
            'lineutils',
            'widget',
        ]),
        'removePlugins': 'image',
        'filebrowserUploadUrl': "/ckeditor/upload/",
        'filebrowserBrowseUrl': "/ckeditor/browse/",
        # 🔽 Added for reliable YouTube embedding
        'allowedContent': True,
        'embed_provider': 'https://noembed.com/embed?url={url}&callback={callback}',
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",               # ✅ added for local Vite on 127.0.0.1
    "https://learnify-frontend-7y4n.onrender.com",
    "https://www.learnifypakistan.com",
    "https://learnifypakistan.com",        # ← added non-www
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

# Extra middleware
MIDDLEWARE += [
    'core.middleware.AutoExpireUserMiddleware',
]

# Email (Zoho SMTP)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.zoho.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False

# Pull from environment (Render → Environment tab)
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")        # e.g. "syedamir@learnifypakistan.com"
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")  # Zoho App Password (not your login PW)

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    f"Learnify Pakistan <{EMAIL_HOST_USER}>"
)
SERVER_EMAIL = DEFAULT_FROM_EMAIL                # for Django error emails
EMAIL_SUBJECT_PREFIX = "[Learnify] "

# Optional: send to console while developing locally
if DEBUG and os.getenv("EMAIL_CONSOLE", "0") == "1":
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/admin/'
LOGOUT_REDIRECT_URL = '/login/'

# ✅ CSRF setting for production frontend
CSRF_TRUSTED_ORIGINS = [
    "https://api.learnifypakistan.com",
    "https://www.learnifypakistan.com",
    "https://learnifypakistan.com",   # ← added non-www
    "https://learnify-backend-zlf7.onrender.com",
]

# ---------- Cookie scope (domain) ----------
# If you are serving the API on api.learnifypakistan.com and the frontend on
# learnifypakistan.com, scoping cookies to the parent domain enables cross-subdomain
# use. But when you open pages on the Render hostname, this must be disabled or
# CSRF will fail.
COOKIE_PARENT_DOMAIN = os.environ.get("COOKIE_PARENT_DOMAIN", "").strip()  # e.g. ".learnifypakistan.com"

# CSRF cookies
CSRF_COOKIE_NAME = "csrftoken"     # explicit, matches frontend lookup
CSRF_COOKIE_SECURE = True          # send only over HTTPS
CSRF_COOKIE_SAMESITE = "None"

if COOKIE_PARENT_DOMAIN:
    CSRF_COOKIE_DOMAIN = COOKIE_PARENT_DOMAIN
else:
    CSRF_COOKIE_DOMAIN = None  # host-only cookie (works on Render hostnames)

# Session cookies
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "None"
if COOKIE_PARENT_DOMAIN:
    SESSION_COOKIE_DOMAIN = COOKIE_PARENT_DOMAIN
else:
    SESSION_COOKIE_DOMAIN = None

# Behind Render's proxy: tell Django requests are HTTPS so 'Secure' cookies are sent
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# -----------------------------------------------------------------------------------
# Easypay configuration (auto-detect sandbox/live from environment)
# -----------------------------------------------------------------------------------
EASYPAY_SANDBOX = os.environ.get("EASYPAY_SANDBOX", "0") == "1"

if EASYPAY_SANDBOX:
    EASYPAY_BASE = "https://easypaystg.easypaisa.com.pk"     # ✅ sandbox base URL
else:
    EASYPAY_BASE = "https://easypay.easypaisa.com.pk"        # ✅ production base URL

# Common paths (these do not change)
EASYPAY_INDEX_PATH = os.environ.get("EASYPAY_INDEX_PATH", "/easypay/Index.jsf")
EASYPAY_CONFIRM_PATH = os.environ.get("EASYPAY_CONFIRM_PATH", "/easypay/Confirm.jsf")

# Portal credentials (from Render environment)
EASYPAY_STORE_ID = os.environ.get("EASYPAY_STORE_ID", "")
EASYPAY_HASH_KEY = os.environ.get("EASYPAY_HASH_KEY", "")

# Where the status handler should send users back to on success/failure (overridable)
FRONTEND_RETURN_URL = os.environ.get(
    "FRONTEND_RETURN_URL",
    "https://www.learnifypakistan.com/payments/result"
)