def _create(client, nome, categoria):
    client.post(
        "/recipes",
        json={"nome": nome, "modo_preparo": "Preparar.", "categoria": categoria, "ingredientes": []},
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
