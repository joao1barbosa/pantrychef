from sqlalchemy import event

from app.models.ingredient import Ingrediente
from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente
from app.services.recipe import buscar_por_ingredientes
from tests.conftest import engine


def _seed_recipes(db_session, quantidade):
    ingredientes = [
        Ingrediente(nome=nome.title(), slug=nome)
        for nome in ("tomate", "cebola", "alho")
    ]
    db_session.add_all(ingredientes)
    db_session.flush()
    ids = [ingrediente.id for ingrediente in ingredientes]
    for indice in range(quantidade):
        receita = Receita(
            nome=f"Receita {indice}",
            slug=f"receita-{indice}",
            modo_preparo="Preparar.",
            categoria="Teste",
        )
        receita.itens = [
            ReceitaIngrediente(ingrediente_id=ids[0], quantidade="1"),
            ReceitaIngrediente(ingrediente_id=ids[1], quantidade="1"),
        ]
        db_session.add(receita)
    db_session.commit()
    return ids


def _contar_selects(funcao):
    contador = {"total": 0}

    def listener(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            contador["total"] += 1

    event.listen(engine, "before_cursor_execute", listener)
    try:
        funcao()
    finally:
        event.remove(engine, "before_cursor_execute", listener)
    return contador["total"]


def test_search_eager_loads_no_n_plus_1(db_session):
    ids = _seed_recipes(db_session, quantidade=5)
    selects = _contar_selects(lambda: buscar_por_ingredientes(db_session, ids))
    assert selects <= 2
