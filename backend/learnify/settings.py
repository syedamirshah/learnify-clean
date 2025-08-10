from pathlib import Path
import os
from datetime import timedelta
import dj_database_url


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-!2nszdij8sl0oljn=f)wd2uowab_ae@mm))r0=6#si8ozke&sy'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DEBUG", "True").lower() == "true"

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

DATABASES = {
    "default": dj_database_url.config(
        env="DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        ssl_require=True,          # ← add this

    )
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

# Use Cloudinary for media in production (when CLOUDINARY_URL is present),
# and local filesystem during local/dev.
USE_CLOUDINARY = bool(os.environ.get("CLOUDINARY_URL"))

if USE_CLOUDINARY:
    # Store all uploaded media on Cloudinary
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
    CKEDITOR_STORAGE_BACKEND = "cloudinary_storage.storage.MediaCloudinaryStorage"

    # Reads CLOUDINARY_URL from env; optional folder prefix for organization
    CLOUDINARY_STORAGE = {
        "CLOUDINARY_URL": os.environ.get("CLOUDINARY_URL"),
        "MEDIA_PREFIX": "learnify/uploads",  # keep assets grouped
    }

    # Cloudinary builds absolute URLs; filesystem MEDIA_* not needed
    MEDIA_URL = ""
    MEDIA_ROOT = None
else:
    # Local/dev behavior: store files on disk
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"


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
    "https://learnify-frontend-7y4n.onrender.com",
    "https://www.learnifypakistan.com",
]

# Extra middleware
MIDDLEWARE += [
    'core.middleware.AutoExpireUserMiddleware',
]

# Gmail SMTP Email Settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = 'polscience.uob@gmail.com'
EMAIL_HOST_PASSWORD = 'fykonmbfkkuhcccn'
DEFAULT_FROM_EMAIL = 'Learnify Pakistan <polscience.uob@gmail.com>'

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/admin/'
LOGOUT_REDIRECT_URL = '/login/'

# ✅ CSRF setting for production frontend
CSRF_TRUSTED_ORIGINS = [
    "https://api.learnifypakistan.com",
    "https://www.learnifypakistan.com",
    "https://learnify-backend-zlf7.onrender.com",
]