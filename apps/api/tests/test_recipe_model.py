import pytest
from sqlalchemy.exc import IntegrityError

from app.models.ingredient import Ingrediente
from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente


def test_recipe_slug_unique(db_session):
    db_session.add(Receita(nome="Bolo", slug="bolo", modo_preparo="Assar", categoria="Doce"))
    db_session.commit()

    db_session.add(Receita(nome="Bolo 2", slug="bolo", modo_preparo="Assar", categoria="Doce"))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_recipe_ingredient_pivot_links(db_session):
    ingrediente = Ingrediente(nome="Tomate", slug="tomate")
    receita = Receita(nome="Salada", slug="salada", modo_preparo="Misturar", categoria="Salada")
    db_session.add_all([ingrediente, receita])
    db_session.flush()

    db_session.add(
        ReceitaIngrediente(
            receita_id=receita.id,
            ingrediente_id=ingrediente.id,
            quantidade="2 unidades",
        )
    )
    db_session.commit()
    db_session.refresh(receita)

    assert len(receita.itens) == 1
    assert receita.itens[0].ingrediente.nome == "Tomate"
    assert receita.itens[0].quantidade == "2 unidades"


def test_pivot_has_composite_primary_key():
    pk_columns = {col.name for col in ReceitaIngrediente.__table__.primary_key.columns}
    assert pk_columns == {"receita_id", "ingrediente_id"}
