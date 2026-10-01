FROM python:3.11-slim

ARG INSTALL_DEV=false

ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && if [ "$INSTALL_DEV" = "true" ]; then pip install --no-cache-dir -r requirements-dev.txt; fi

RUN useradd --create-home --uid 1000 app
COPY --chown=app:app . .
RUN chmod +x entrypoint.sh

USER app

ENTRYPOINT ["./entrypoint.sh"]
