#!/usr/bin/env bash
set -e

alembic upgrade head

if [ "${SEED_INGREDIENTES:-true}" = "true" ]; then
    python -m app.seeds.ingredients
fi

if [ $# -eq 0 ]; then
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips="*"
fi

exec "$@"
