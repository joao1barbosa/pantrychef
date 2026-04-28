from app.models.ingredient import Ingrediente
from app.models.recipe_ingredient import ReceitaIngrediente


def _ingrediente(db_session, nome="Tomate", slug="tomate"):
    ingrediente = Ingrediente(nome=nome, slug=slug)
    db_session.add(ingrediente)
    db_session.commit()
    db_session.refresh(ingrediente)
    return ingrediente


def test_create_recipe_201(client):
    response = client.post(
        "/recipes",
        json={
            "nome": "Arroz Simples",
            "modo_preparo": "Cozinhe o arroz.",
            "categoria": "Acompanhamento",
            "ingredientes": [],
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nome"] == "Arroz Simples"
    assert body["slug"] == "arroz-simples"


def test_create_recipe_with_ingredients_persists_pivot(client, db_session):
    ingrediente = _ingrediente(db_session)
    response = client.post(
        "/recipes",
        json={
            "nome": "Salada de Tomate",
            "modo_preparo": "Misture tudo.",
            "categoria": "Salada",
            "ingredientes": [
                {"ingrediente_id": str(ingrediente.id), "quantidade": "2 unidades"}
            ],
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["ingredientes"][0]["nome"] == "Tomate"
    assert body["ingredientes"][0]["quantidade"] == "2 unidades"

    pivots = db_session.query(ReceitaIngrediente).all()
    assert len(pivots) == 1


def test_list_recipes_200(client):
    client.post(
        "/recipes",
        json={"nome": "Bolo", "modo_preparo": "Asse.", "categoria": "Doce", "ingredientes": []},
    )
    response = client.get("/recipes")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_recipe_by_id_404_when_missing(client):
    response = client.get("/recipes/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
