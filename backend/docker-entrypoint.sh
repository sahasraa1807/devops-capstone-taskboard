#!/bin/sh
set -e

echo "==> Running database migrations..."
alembic upgrade head || echo "Migration warning: could not run alembic immediately, starting app..."

echo "==> Starting TaskBoard FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
