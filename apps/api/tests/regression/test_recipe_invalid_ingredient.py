import uuid


def _auth(client, email="regression@example.com"):
    client.post("/users", json={"nome": "User", "email": email, "senha": "senha123"})
    token = client.post(
        "/auth/login", data={"username": email, "password": "senha123"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_recipe_with_invalid_ingredient_returns_422(client):
    response = client.post(
        "/recipes",
        json={
            "nome": "Receita Invalida",
            "modo_preparo": "Preparar.",
            "categoria": "Teste",
            "ingredientes": [
                {"ingrediente_id": str(uuid.uuid4()), "quantidade": "1"}
            ],
        },
        headers=_auth(client),
    )
    assert response.status_code == 422
