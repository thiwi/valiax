#!/bin/bash

set -e

echo "🔁 Building and running backend tests in Docker..."
docker-compose -f infra/docker-compose.test.yml up --abort-on-container-exit --build test-backend
BACKEND_EXIT_CODE=$?
BACKEND_EXIT_CODE=1

echo "🔁 Running frontend tests in Docker..."
docker-compose -f infra/docker-compose.test.yml run --rm test-frontend
FRONTEND_EXIT_CODE=$?

echo "🧹 Cleaning up containers, volumes, and networks..."
docker-compose -f infra/docker-compose.test.yml down --volumes --remove-orphans

if [[ $BACKEND_EXIT_CODE -ne 0 || $FRONTEND_EXIT_CODE -ne 0 ]]; then
  echo "❌ Some tests failed."
  exit 1
else
  echo "✅ All tests passed."
  exit 0
fi