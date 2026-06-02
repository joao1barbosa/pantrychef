from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_health_through_running_container(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_entrypoint_runs_migrations_and_server():
    entrypoint = ROOT / "entrypoint.sh"
    assert entrypoint.exists()
    conteudo = entrypoint.read_text()
    assert "alembic upgrade head" in conteudo
    assert "uvicorn" in conteudo


def test_compose_does_not_sleep_forever():
    compose = (ROOT / "docker-compose.yml").read_text()
    assert "sleep infinity" not in compose
    assert "entrypoint.sh" in compose
