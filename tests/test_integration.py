from app.dependencies import get_ai_generator
from app.exceptions import AIServiceUnavailable
from app.main import app


def test_happy_path_end_to_end(client, auth_headers, tres_ingredientes):
    ids = tres_ingredientes

    recipe = client.post(
        "/recipes",
        json={
            "nome": "Molho de Tomate",
            "modo_preparo": "Cozinhe.",
            "categoria": "Molho",
            "ingredientes": [{"ingrediente_id": ids[0], "quantidade": "3"}],
        },
    ).json()

    search = client.post("/recipes/search", json={"ingredientes": ids})
    assert search.status_code == 200
    assert any(r["id"] == recipe["id"] for r in search.json())

    favorite = client.post(
        "/favorites", json={"receita_id": recipe["id"]}, headers=auth_headers
    )
    assert favorite.status_code == 201

    assert len(client.get("/favorites", headers=auth_headers).json()) == 1

    client.get(f"/recipes/{recipe['id']}", headers=auth_headers)
    assert len(client.get("/history", headers=auth_headers).json()) == 1


def test_error_422_few_ingredients(client, tres_ingredientes):
    ids = tres_ingredientes
    response = client.post("/recipes/search", json={"ingredientes": ids[:2]})
    assert response.status_code == 422


def test_error_409_duplicate_email(client):
    payload = {"nome": "Dup", "email": "dup@example.com", "senha": "senha123"}
    client.post("/users", json=payload)
    assert client.post("/users", json=payload).status_code == 409


def test_error_404_recipe_missing(client):
    response = client.get("/recipes/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_error_401_history_without_token(client):
    assert client.get("/history").status_code == 401


def test_error_503_ai_unavailable(client, tres_ingredientes):
    ids = tres_ingredientes

    def broken(nomes):
        raise AIServiceUnavailable("indisponível")

    app.dependency_overrides[get_ai_generator] = lambda: broken
    try:
        response = client.post("/recipes/search", json={"ingredientes": ids})
        assert response.status_code == 503
    finally:
        app.dependency_overrides.pop(get_ai_generator, None)
