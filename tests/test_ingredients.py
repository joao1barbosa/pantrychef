import pytest
from sqlalchemy.exc import IntegrityError

from app.models.ingredient import Ingrediente
from app.seeds.ingredients import seed_ingredientes


def test_ingredient_slug_unique(db_session):
    db_session.add(Ingrediente(nome="Tomate", slug="tomate"))
    db_session.commit()

    db_session.add(Ingrediente(nome="Tomate Italiano", slug="tomate"))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_list_ingredients_returns_seeded(client, db_session):
    seed_ingredientes(db_session)
    response = client.get("/ingredients")
    assert response.status_code == 200
    nomes = [item["nome"] for item in response.json()]
    assert "Tomate" in nomes


def test_seed_is_idempotent(db_session):
    seed_ingredientes(db_session)
    first = db_session.query(Ingrediente).count()
    seed_ingredientes(db_session)
    second = db_session.query(Ingrediente).count()
    assert first == second
