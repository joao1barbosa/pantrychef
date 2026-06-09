MISSING_ID = "00000000-0000-0000-0000-000000000000"


def _auth(client, email="owner@example.com"):
    client.post("/users", json={"nome": "User", "email": email, "senha": "senha123"})
    token = client.post(
        "/auth/login", data={"username": email, "password": "senha123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create(client, headers, nome="Sopa"):
    return client.post(
        "/recipes",
        json={
            "nome": nome,
            "modo_preparo": "Ferver.",
            "categoria": "Sopa",
            "ingredientes": [],
        },
        headers=headers,
    ).json()


def test_update_recipe_200(client):
    headers = _auth(client)
    recipe = _create(client, headers)
    response = client.put(
        f"/recipes/{recipe['id']}",
        json={
            "nome": "Sopa de Legumes",
            "modo_preparo": "Ferver os legumes.",
            "categoria": "Sopa",
            "ingredientes": [],
        },
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["nome"] == "Sopa de Legumes"
    assert response.json()["modo_preparo"] == "Ferver os legumes."


def test_update_recipe_requires_auth_401(client):
    headers = _auth(client)
    recipe = _create(client, headers)
    response = client.put(
        f"/recipes/{recipe['id']}",
        json={"nome": "X", "modo_preparo": "Y", "categoria": "Z", "ingredientes": []},
    )
    assert response.status_code == 401


def test_update_recipe_by_non_owner_403(client):
    dono = _auth(client, "dono@example.com")
    intruso = _auth(client, "intruso@example.com")
    recipe = _create(client, dono)
    response = client.put(
        f"/recipes/{recipe['id']}",
        json={"nome": "X", "modo_preparo": "Y", "categoria": "Z", "ingredientes": []},
        headers=intruso,
    )
    assert response.status_code == 403


def test_update_recipe_404(client):
    headers = _auth(client)
    response = client.put(
        f"/recipes/{MISSING_ID}",
        json={"nome": "X", "modo_preparo": "Y", "categoria": "Z", "ingredientes": []},
        headers=headers,
    )
    assert response.status_code == 404


def test_delete_recipe_204(client):
    headers = _auth(client)
    recipe = _create(client, headers)
    response = client.delete(f"/recipes/{recipe['id']}", headers=headers)
    assert response.status_code == 204
    assert client.get(f"/recipes/{recipe['id']}").status_code == 404


def test_delete_recipe_by_non_owner_403(client):
    dono = _auth(client, "dono@example.com")
    intruso = _auth(client, "intruso@example.com")
    recipe = _create(client, dono)
    response = client.delete(f"/recipes/{recipe['id']}", headers=intruso)
    assert response.status_code == 403


def test_delete_recipe_404(client):
    headers = _auth(client)
    response = client.delete(f"/recipes/{MISSING_ID}", headers=headers)
    assert response.status_code == 404
