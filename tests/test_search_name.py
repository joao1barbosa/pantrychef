def _auth(client, email="searchname@example.com"):
    client.post("/users", json={"nome": "User", "email": email, "senha": "senha123"})
    token = client.post(
        "/auth/login", data={"username": email, "password": "senha123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create(client, nome, categoria):
    client.post(
        "/recipes",
        json={"nome": nome, "modo_preparo": "Preparar.", "categoria": categoria, "ingredientes": []},
        headers=_auth(client),
    )


def test_search_by_name_ilike(client):
    _create(client, "Bolo de Cenoura", "Doce")
    _create(client, "Arroz Branco", "Acompanhamento")
    response = client.get("/recipes", params={"nome": "cenoura"})
    assert response.status_code == 200
    nomes = [r["nome"] for r in response.json()]
    assert nomes == ["Bolo de Cenoura"]


def test_search_by_category(client):
    _create(client, "Bolo de Cenoura", "Doce")
    _create(client, "Pudim", "Doce")
    _create(client, "Arroz Branco", "Acompanhamento")
    response = client.get("/recipes", params={"categoria": "doce"})
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_search_empty_returns_empty_list(client):
    _create(client, "Bolo de Cenoura", "Doce")
    response = client.get("/recipes", params={"nome": "inexistente"})
    assert response.status_code == 200
    assert response.json() == []
