#!/usr/bin/env bash
set -e

# Simple test runner for local development
# Usage: ./start-tests.sh [--skip-backend] [--skip-frontend]

SKIP_BACKEND=false
SKIP_FRONTEND=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-backend) SKIP_BACKEND=true; shift ;;
    --skip-frontend) SKIP_FRONTEND=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ "$SKIP_BACKEND" = false ]; then
  echo "Running backend tests..."
  export DATABASE_URL="sqlite:///:memory:"
  pytest --cov=backend/app backend/tests
fi

if [ "$SKIP_FRONTEND" = false ]; then
  echo "Running frontend tests..."
  pushd frontend >/dev/null
  npx -y jest --runInBand
  popd >/dev/null
fi
