def _auth(client, email):
    client.post("/users", json={"nome": "User", "email": email, "senha": "senha123"})
    token = client.post(
        "/auth/login", data={"username": email, "password": "senha123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_recipe(client, nome="Bolo"):
    return client.post(
        "/recipes",
        json={"nome": nome, "modo_preparo": "Assar.", "categoria": "Doce", "ingredientes": []},
        headers=_auth(client, "creator@example.com"),
    ).json()


def test_favorite_recipe_201(client):
    headers = _auth(client, "a@example.com")
    recipe = _create_recipe(client)
    response = client.post(
        "/favorites", json={"receita_id": recipe["id"]}, headers=headers
    )
    assert response.status_code == 201
    assert response.json()["receita"]["id"] == recipe["id"]


def test_unfavorite_204(client):
    headers = _auth(client, "a@example.com")
    recipe = _create_recipe(client)
    client.post("/favorites", json={"receita_id": recipe["id"]}, headers=headers)

    response = client.delete(f"/favorites/{recipe['id']}", headers=headers)
    assert response.status_code == 204
    assert client.get("/favorites", headers=headers).json() == []


def test_list_favorites_per_user(client):
    headers_a = _auth(client, "a@example.com")
    headers_b = _auth(client, "b@example.com")
    recipe = _create_recipe(client)
    client.post("/favorites", json={"receita_id": recipe["id"]}, headers=headers_a)

    assert len(client.get("/favorites", headers=headers_a).json()) == 1
    assert client.get("/favorites", headers=headers_b).json() == []


def test_favorite_requires_auth_401(client):
    recipe = _create_recipe(client)
    response = client.post("/favorites", json={"receita_id": recipe["id"]})
    assert response.status_code == 401


def test_duplicate_favorite_handled(client):
    headers = _auth(client, "a@example.com")
    recipe = _create_recipe(client)
    first = client.post("/favorites", json={"receita_id": recipe["id"]}, headers=headers)
    second = client.post("/favorites", json={"receita_id": recipe["id"]}, headers=headers)

    assert first.status_code == 201
    assert second.status_code in (200, 201)
    assert len(client.get("/favorites", headers=headers).json()) == 1
