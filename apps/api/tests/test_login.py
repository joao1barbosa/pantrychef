def _register(client, email="user@example.com", senha="senha123"):
    return client.post(
        "/users",
        json={"nome": "User", "email": email, "senha": senha},
    )


def _login(client, email="user@example.com", senha="senha123"):
    return client.post(
        "/auth/login",
        data={"username": email, "password": senha},
    )


def test_login_success(client):
    _register(client)
    response = _login(client)
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_login_wrong_password_401(client):
    _register(client)
    response = _login(client, senha="errada")
    assert response.status_code == 401


def test_protected_route_requires_token_401(client):
    response = client.get("/users/me")
    assert response.status_code == 401


def test_protected_route_with_token_200(client):
    _register(client)
    token = _login(client).json()["access_token"]
    response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
