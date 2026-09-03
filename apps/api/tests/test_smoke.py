from pathlib import Path

_RAIZ_LOCAL = Path(__file__).resolve().parent.parent.parent
_RAIZ_CONTAINER = Path("/workspaces/pantrychef")


def _raiz_do_monorepo() -> Path:
    for candidato in (_RAIZ_LOCAL, _RAIZ_CONTAINER):
        if (candidato / "docker-compose.yml").exists():
            return candidato
    return _RAIZ_LOCAL


ROOT = _raiz_do_monorepo()


def test_health_through_running_container(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_entrypoint_runs_migrations_and_server():
    entrypoint = ROOT / "apps/api/entrypoint.sh"
    assert entrypoint.exists()
    conteudo = entrypoint.read_text()
    assert "alembic upgrade head" in conteudo
    assert "uvicorn" in conteudo


def test_compose_does_not_sleep_forever():
    compose = (ROOT / "docker-compose.yml").read_text()
    assert "sleep infinity" not in compose
    assert "entrypoint.sh" in compose
