#!/usr/bin/env bash
set -e

# Celery Beat in background
celery -A worker beat --loglevel=info &

# Celery Worker in foreground
exec celery -A worker worker --loglevel=info