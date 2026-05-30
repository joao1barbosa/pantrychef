import uuid


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
    )
    assert response.status_code == 422
