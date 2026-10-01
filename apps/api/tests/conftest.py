import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

DEFAULT_TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/pantrychef_test"


def _resolver_url_de_teste() -> str:
    """Nunca reutiliza o banco da aplicação: a suíte faz DROP de todas as tabelas.

    Prioridade: TEST_DATABASE_URL > DATABASE_URL com sufixo ``_test`` > padrão local.
    """
    explicita = os.getenv("TEST_DATABASE_URL")
    if explicita:
        url = make_url(explicita)
    elif os.getenv("DATABASE_URL"):
        base = make_url(os.environ["DATABASE_URL"])
        nome = base.database or ""
        url = base if nome.endswith("_test") else base.set(database=f"{nome}_test")
    else:
        url = make_url(DEFAULT_TEST_DATABASE_URL)
    if not (url.database or "").endswith("_test"):
        raise RuntimeError(
            f"Banco de testes '{url.database}' recusado: o nome precisa terminar em '_test'."
        )
    return url.render_as_string(hide_password=False)


def _garantir_banco(url: str) -> None:
    alvo = make_url(url)
    admin = create_engine(alvo.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conexao:
        existe = conexao.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :nome"),
            {"nome": alvo.database},
        ).scalar()
        if not existe:
            conexao.execute(text(f'CREATE DATABASE "{alvo.database}"'))
    admin.dispose()


os.environ["DATABASE_URL"] = _resolver_url_de_teste()
_garantir_banco(os.environ["DATABASE_URL"])
os.environ.setdefault("JWT_SECRET", "test-secret-key-with-at-least-32-bytes")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
os.environ.setdefault("AI_API_KEY", "test-key")
os.environ.setdefault("RATE_LIMIT_LOGIN", "0")
os.environ.setdefault("RATE_LIMIT_IA", "0")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401
from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_schema():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_state():
    yield
    tables = [t.name for t in Base.metadata.sorted_tables]
    if tables:
        with engine.begin() as connection:
            connection.execute(
                text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE")
            )


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def tres_ingredientes(db_session):
    from app.models.ingredient import Ingrediente

    ingredientes = [
        Ingrediente(nome=nome.title(), slug=nome)
        for nome in ("tomate", "cebola", "alho")
    ]
    db_session.add_all(ingredientes)
    db_session.commit()
    return [str(ingrediente.id) for ingrediente in ingredientes]


@pytest.fixture
def auth_headers(client):
    email = "fixture@example.com"
    client.post(
        "/users", json={"nome": "Fixture", "email": email, "senha": "senha123"}
    )
    token = client.post(
        "/auth/login", data={"username": email, "password": "senha123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
