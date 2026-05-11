import pytest

from app.dependencies import get_ai_generator
from app.exceptions import AIServiceUnavailable
from app.main import app
from app.models.ingredient import Ingrediente
from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente


def _ingredientes(db_session):
    ings = {
        nome: Ingrediente(nome=nome.title(), slug=nome)
        for nome in ("tomate", "cebola", "alho")
    }
    db_session.add_all(ings.values())
    db_session.commit()
    return {nome: str(ing.id) for nome, ing in ings.items()}


def _override_ai(generator):
    app.dependency_overrides[get_ai_generator] = lambda: generator


def teardown_function():
    app.dependency_overrides.pop(get_ai_generator, None)


def test_ai_fallback_only_when_no_db_match(client, db_session):
    ids = _ingredientes(db_session)
    receita = Receita(nome="Molho", slug="molho", modo_preparo="Misturar", categoria="Molho")
    receita.itens = [
        ReceitaIngrediente(ingrediente_id=ids["tomate"], quantidade="2"),
        ReceitaIngrediente(ingrediente_id=ids["cebola"], quantidade="1"),
    ]
    db_session.add(receita)
    db_session.commit()

    def fail_if_called(nomes):
        raise AssertionError("IA não deve ser chamada quando há match no banco")

    _override_ai(fail_if_called)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]},
    )
    assert response.status_code == 200
    assert [r["slug"] for r in response.json()] == ["molho"]


def test_ai_result_is_persisted(client, db_session):
    ids = _ingredientes(db_session)

    def fake_generator(nomes):
        return {
            "nome": "Receita IA",
            "modo_preparo": "Prepare conforme a IA.",
            "categoria": "IA",
            "ingredientes": [{"nome": "Tomate", "quantidade": "1"}],
        }

    _override_ai(fake_generator)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]},
    )
    assert response.status_code == 200
    assert response.json()[0]["nome"] == "Receita IA"

    assert db_session.query(Receita).filter_by(nome="Receita IA").count() == 1


def test_ai_result_not_duplicated_on_repeat(client, db_session):
    ids = _ingredientes(db_session)

    def fake_generator(nomes):
        return {
            "nome": "Receita IA",
            "modo_preparo": "Prepare conforme a IA.",
            "categoria": "IA",
            "ingredientes": [{"nome": "Tomate", "quantidade": "1"}],
        }

    _override_ai(fake_generator)
    payload = {"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]}
    client.post("/recipes/search", json=payload)
    client.post("/recipes/search", json=payload)

    assert db_session.query(Receita).filter_by(nome="Receita IA").count() == 1


def test_ai_unavailable_returns_503(client, db_session):
    ids = _ingredientes(db_session)

    def broken_generator(nomes):
        raise AIServiceUnavailable("indisponível")

    _override_ai(broken_generator)
    response = client.post(
        "/recipes/search",
        json={"ingredientes": [ids["tomate"], ids["cebola"], ids["alho"]]},
    )
    assert response.status_code == 503
