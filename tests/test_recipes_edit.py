MISSING_ID = "00000000-0000-0000-0000-000000000000"


def _create(client, nome="Sopa"):
    return client.post(
        "/recipes",
        json={
            "nome": nome,
            "modo_preparo": "Ferver.",
            "categoria": "Sopa",
            "ingredientes": [],
        },
    ).json()


def test_update_recipe_200(client):
    recipe = _create(client)
    response = client.put(
        f"/recipes/{recipe['id']}",
        json={
            "nome": "Sopa de Legumes",
            "modo_preparo": "Ferver os legumes.",
            "categoria": "Sopa",
            "ingredientes": [],
        },
    )
    assert response.status_code == 200
    assert response.json()["nome"] == "Sopa de Legumes"
    assert response.json()["modo_preparo"] == "Ferver os legumes."


def test_update_recipe_404(client):
    response = client.put(
        f"/recipes/{MISSING_ID}",
        json={"nome": "X", "modo_preparo": "Y", "categoria": "Z", "ingredientes": []},
    )
    assert response.status_code == 404


def test_delete_recipe_204(client):
    recipe = _create(client)
    response = client.delete(f"/recipes/{recipe['id']}")
    assert response.status_code == 204
    assert client.get(f"/recipes/{recipe['id']}").status_code == 404


def test_delete_recipe_404(client):
    response = client.delete(f"/recipes/{MISSING_ID}")
    assert response.status_code == 404
