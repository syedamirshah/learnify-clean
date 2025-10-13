#!/bin/bash
cd "$(dirname "$0")/.."
source venv/bin/activate
python manage.py delete_expired_users