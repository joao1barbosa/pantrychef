from app.dependencies import get_ai_generator, get_ai_validator
from app.exceptions import AIServiceUnavailable
from app.main import app
from app.models.ingredient import Ingrediente
from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente


def _ingredientes(db_session, nomes=("tomate", "cebola", "alho")):
    ings = {nome: Ingrediente(nome=nome.title(), slug=nome) for nome in nomes}
    db_session.add_all(ings.values())
    db_session.commit()
    return ings


def _receita(db_session, ings, nome="Molho"):
    receita = Receita(nome=nome, slug=nome.lower(), modo_preparo="Misturar")
    receita.itens = [ReceitaIngrediente(ingrediente_id=i.id) for i in ings]
    db_session.add(receita)
    db_session.commit()
    return receita


def _override(gerar=None, validar=None):
    if gerar is not None:
        app.dependency_overrides[get_ai_generator] = lambda: gerar
    if validar is not None:
        app.dependency_overrides[get_ai_validator] = lambda: validar


def teardown_function():
    app.dependency_overrides.pop(get_ai_generator, None)
    app.dependency_overrides.pop(get_ai_validator, None)


def _falha(*_):
    raise AssertionError("IA não deveria ser chamada")


def _indisponivel(*_):
    raise AIServiceUnavailable("fora do ar")


def test_known_names_skip_ai_validation(client, db_session):
    ings = _ingredientes(db_session)
    _receita(db_session, [ings["tomate"], ings["cebola"]])
    _override(gerar=_falha, validar=_falha)

    response = client.post(
        "/recipes/search-by-name", json={"ingredientes": ["Tomate", "cebola", " ALHO "]}
    )

    assert response.status_code == 200
    assert [r["slug"] for r in response.json()] == ["molho"]


def test_validator_unavailable_with_three_known_ignores_unknown(client, db_session):
    ings = _ingredientes(db_session)
    _receita(db_session, list(ings.values()))
    _override(gerar=_falha, validar=_indisponivel)

    response = client.post(
        "/recipes/search-by-name",
        json={"ingredientes": ["tomate", "cebola", "alho", "xpto"]},
    )

    assert response.status_code == 200


def test_validator_unavailable_returns_503(client, db_session):
    _ingredientes(db_session)
    _override(gerar=_falha, validar=_indisponivel)

    response = client.post(
        "/recipes/search-by-name",
        json={"ingredientes": ["tomate", "cebola", "desconhecido"]},
    )

    assert response.status_code == 503


def test_generator_unavailable_returns_503(client, db_session):
    _ingredientes(db_session)
    _override(gerar=_indisponivel, validar=_falha)

    response = client.post(
        "/recipes/search-by-name", json={"ingredientes": ["tomate", "cebola", "alho"]}
    )

    assert response.status_code == 503


def test_unknown_names_are_validated_and_persisted(client, db_session):
    _ingredientes(db_session, ("tomate", "cebola"))

    def validar(nomes):
        assert nomes == ["salsich", "cadeira"]
        return {
            "validos": [{"original": "salsich", "normalizado": "Salsicha"}],
            "invalidos": ["cadeira"],
        }

    def gerar(nomes):
        return {
            "nome": "Cachorro-quente",
            "modo_preparo": "Monte.",
            "ingredientes": [{"nome": "Salsicha", "quantidade": "2"}],
        }

    _override(gerar=gerar, validar=validar)
    response = client.post(
        "/recipes/search-by-name",
        json={"ingredientes": ["tomate", "cebola", "salsich", "cadeira"]},
    )

    assert response.status_code == 200
    assert response.json()[0]["gerada_por_ia"] is True
    assert db_session.query(Ingrediente).filter_by(slug="salsicha").count() == 1


def test_less_than_three_valid_returns_422_with_invalid_names(client, db_session):
    _ingredientes(db_session, ("tomate",))
    _override(
        gerar=_falha,
        validar=lambda nomes: {"validos": [], "invalidos": ["cadeira", "mesa"]},
    )

    response = client.post(
        "/recipes/search-by-name", json={"ingredientes": ["tomate", "cadeira", "mesa"]}
    )

    assert response.status_code == 422
    assert "cadeira" in response.json()["detail"]


def test_oversized_name_rejected_422(client):
    response = client.post(
        "/recipes/search-by-name", json={"ingredientes": ["a" * 500, "b", "c"]}
    )
    assert response.status_code == 422


def test_ai_output_with_invalid_fields_is_sanitized(client, db_session):
    _ingredientes(db_session)
    _override(
        gerar=lambda nomes: {
            "nome": "Receita Estranha",
            "modo_preparo": "Faça.",
            "categoria": 123,
            "tempo_preparo": "-5",
            "dificuldade": "impossível",
            "ingredientes": [
                {"nome": "Tomate", "quantidade": 2},
                {"nome": "tomate", "quantidade": "1"},
                {"nome": ""},
            ],
        },
        validar=_falha,
    )

    response = client.post(
        "/recipes/search-by-name", json={"ingredientes": ["tomate", "cebola", "alho"]}
    )

    assert response.status_code == 200
    receita = response.json()[0]
    assert receita["tempo_preparo"] is None
    assert receita["dificuldade"] is None
    assert receita["categoria"] == "123"
    assert len(receita["ingredientes"]) == 1
