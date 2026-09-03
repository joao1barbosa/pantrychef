from app.services.security import verify_password
from app.models.user import Usuario


def test_register_success(client):
    response = client.post(
        "/users",
        json={"nome": "Ana", "email": "ana@example.com", "senha": "senha123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nome"] == "Ana"
    assert body["email"] == "ana@example.com"
    assert "id" in body
    assert "senha" not in body
    assert "senha_hash" not in body


def test_register_duplicate_email_returns_409(client):
    payload = {"nome": "Ana", "email": "dup@example.com", "senha": "senha123"}
    first = client.post("/users", json=payload)
    assert first.status_code == 201

    second = client.post("/users", json=payload)
    assert second.status_code == 409


def test_password_is_hashed(client, db_session):
    client.post(
        "/users",
        json={"nome": "Bob", "email": "bob@example.com", "senha": "segredo123"},
    )
    user = db_session.query(Usuario).filter_by(email="bob@example.com").one()
    assert user.senha_hash != "segredo123"
    assert verify_password("segredo123", user.senha_hash)
