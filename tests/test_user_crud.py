from app.models.user import Usuario


def _auth(client, email="user@example.com", senha="senha123"):
    client.post("/users", json={"nome": "User", "email": email, "senha": senha})
    token = client.post(
        "/auth/login", data={"username": email, "password": senha}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_update_own_profile_200(client):
    headers = _auth(client)
    response = client.patch("/users/me", json={"nome": "Novo Nome"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["nome"] == "Novo Nome"


def test_update_requires_auth_401(client):
    response = client.patch("/users/me", json={"nome": "X"})
    assert response.status_code == 401


def test_soft_delete_sets_deletado_em(client, db_session):
    headers = _auth(client, email="del@example.com")
    response = client.delete("/users/me", headers=headers)
    assert response.status_code == 204

    user = db_session.query(Usuario).filter_by(email="del@example.com").one()
    assert user.deletado_em is not None


def test_deleted_user_cannot_login_401(client):
    headers = _auth(client, email="gone@example.com")
    client.delete("/users/me", headers=headers)

    response = client.post(
        "/auth/login", data={"username": "gone@example.com", "password": "senha123"}
    )
    assert response.status_code == 401


def test_update_password_rehashes_and_allows_login(client):
    headers = _auth(client, email="pw@example.com")
    client.patch("/users/me", json={"senha": "novasenha123"}, headers=headers)

    response = client.post(
        "/auth/login", data={"username": "pw@example.com", "password": "novasenha123"}
    )
    assert response.status_code == 200
