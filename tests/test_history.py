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
    ).json()


def test_view_recipe_records_history(client):
    headers = _auth(client, "a@example.com")
    recipe = _create_recipe(client)

    client.get(f"/recipes/{recipe['id']}", headers=headers)

    response = client.get("/history", headers=headers)
    assert response.status_code == 200
    receita_ids = [item["receita"]["id"] for item in response.json()]
    assert recipe["id"] in receita_ids


def test_history_is_per_user(client):
    headers_a = _auth(client, "a@example.com")
    headers_b = _auth(client, "b@example.com")
    recipe = _create_recipe(client)

    client.get(f"/recipes/{recipe['id']}", headers=headers_a)

    response_b = client.get("/history", headers=headers_b)
    assert response_b.status_code == 200
    assert response_b.json() == []


def test_history_requires_auth_401(client):
    response = client.get("/history")
    assert response.status_code == 401


def test_consecutive_views_are_deduplicated(client):
    headers = _auth(client, "a@example.com")
    recipe = _create_recipe(client)

    client.get(f"/recipes/{recipe['id']}", headers=headers)
    client.get(f"/recipes/{recipe['id']}", headers=headers)

    response = client.get("/history", headers=headers)
    assert len(response.json()) == 1
