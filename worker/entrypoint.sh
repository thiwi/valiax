#!/usr/bin/env bash
set -e

# Simple entrypoint script for the Celery worker container.
# It starts the scheduled tasks (Celery beat) in the background
# and then launches the worker in the foreground.

# Celery Beat in background
celery -A worker beat --loglevel=info &

# Celery Worker in foreground
exec celery -A worker worker --loglevel=info
