# ==========================================
# TaskBoard Backend Dockerfile
# Production-ready, non-root, slim Python
# ==========================================
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Create non-root group and user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m -s /bin/bash appuser

WORKDIR /app

# Install dependencies as root to system or user dir
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Alembic migrations and application source
COPY alembic.ini .
COPY alembic alembic
COPY app app
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh && \
    chown -R appuser:appgroup /app /docker-entrypoint.sh

# Switch to non-root user for DevSecOps best practices
USER appuser

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
