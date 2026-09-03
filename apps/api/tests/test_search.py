from app.models.ingredient import Ingrediente
from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente


def _seed(db_session):
    ingredientes = {
        nome: Ingrediente(nome=nome.title(), slug=nome)
        for nome in ("tomate", "cebola", "alho", "carne")
    }
    db_session.add_all(ingredientes.values())
    db_session.flush()

    def receita(nome, slug, ings):
        rec = Receita(nome=nome, slug=slug, modo_preparo="Preparar.", categoria="Teste")
        rec.itens = [
            ReceitaIngrediente(ingrediente_id=ingredientes[i].id, quantidade="1")
            for i in ings
        ]
        db_session.add(rec)
        return rec

    receita("Molho", "molho", ["tomate", "cebola"])
    receita("Bife Acebolado", "bife-acebolado", ["carne", "cebola"])
    receita("Refogado", "refogado", ["tomate", "cebola", "alho"])
    db_session.commit()
    return {nome: str(ing.id) for nome, ing in ingredientes.items()}


def test_minimum_ingredients_rule(client, db_session):
    ids = _seed(db_session)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"]]},
    )
    assert response.status_code == 422


def test_search_three_ingredients_ok(client, db_session):
    ids = _seed(db_session)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]},
    )
    assert response.status_code == 200


def test_subset_recipe_matches(client, db_session):
    ids = _seed(db_session)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]},
    )
    slugs = [r["slug"] for r in response.json()]
    assert "molho" in slugs


def test_recipe_with_extra_ingredient_excluded(client, db_session):
    ids = _seed(db_session)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]},
    )
    slugs = [r["slug"] for r in response.json()]
    assert "bife-acebolado" not in slugs


def test_exact_match_returned(client, db_session):
    ids = _seed(db_session)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]},
    )
    slugs = [r["slug"] for r in response.json()]
    assert "refogado" in slugs


def test_results_ordered_by_overlap(client, db_session):
    ids = _seed(db_session)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]},
    )
    slugs = [r["slug"] for r in response.json()]
    assert slugs.index("refogado") < slugs.index("molho")
