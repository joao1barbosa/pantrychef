import pytest

from app.config import settings
from app.dependencies import limitar_cadastro, limitar_login


def _auth(client, email="h@example.com", senha="senha123"):
    client.post("/users", json={"nome": "H", "email": email, "senha": senha})
    token = client.post(
        "/auth/login", data={"username": email, "password": senha}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _receita(client, headers, nome, ingredientes, **extra):
    return client.post(
        "/recipes",
        json={
            "nome": nome,
            "modo_preparo": "Prepare.",
            "ingredientes": [{"ingrediente_id": i} for i in ingredientes],
            **extra,
        },
        headers=headers,
    )


def test_duplicate_ingredient_in_recipe_returns_422(client, tres_ingredientes):
    headers = _auth(client)
    ing = tres_ingredientes[0]
    response = _receita(client, headers, "Dup", [ing, ing])
    assert response.status_code == 422


def test_favorites_include_receita_id(client, tres_ingredientes):
    headers = _auth(client)
    receita = _receita(client, headers, "Fav", tres_ingredientes).json()
    client.post("/favorites", json={"receita_id": receita["id"]}, headers=headers)

    favorito = client.get("/favorites", headers=headers).json()[0]

    assert favorito["receita_id"] == receita["id"]


def test_manual_recipe_is_not_marked_as_ai(client, tres_ingredientes):
    headers = _auth(client)
    receita = _receita(client, headers, "Manual", tres_ingredientes).json()
    assert receita["gerada_por_ia"] is False


def test_list_recipes_pagination(client, tres_ingredientes):
    headers = _auth(client)
    for nome in ("A", "B", "C"):
        _receita(client, headers, nome, tres_ingredientes)

    primeira = client.get("/recipes?ordenacao=nome_asc&limit=2").json()
    segunda = client.get("/recipes?ordenacao=nome_asc&limit=2&offset=2").json()

    assert [r["nome"] for r in primeira] == ["A", "B"]
    assert [r["nome"] for r in segunda] == ["C"]


def test_list_recipes_order_by_popularity(client, tres_ingredientes):
    headers = _auth(client)
    pouco = _receita(client, headers, "Pouco", tres_ingredientes).json()
    muito = _receita(client, headers, "Muito", tres_ingredientes).json()
    outro = _auth(client, email="h2@example.com")
    for h in (headers, outro):
        client.post("/favorites", json={"receita_id": muito["id"]}, headers=h)
    client.post("/favorites", json={"receita_id": pouco["id"]}, headers=headers)

    nomes = [r["nome"] for r in client.get("/recipes?ordenacao=populares").json()]

    assert nomes == ["Muito", "Pouco"]


def test_tempo_max_lower_than_tempo_min_returns_422(client):
    assert client.get("/recipes?tempo_min=50&tempo_max=10").status_code == 422


def test_like_wildcards_are_literal(client, tres_ingredientes):
    headers = _auth(client)
    _receita(client, headers, "Bolo", tres_ingredientes)
    assert client.get("/recipes?nome=%25").json() == []


def test_get_recipe_without_registering_history(client, tres_ingredientes):
    headers = _auth(client)
    receita = _receita(client, headers, "Hist", tres_ingredientes).json()

    client.get(f"/recipes/{receita['id']}?registrar=false", headers=headers)
    assert client.get("/history", headers=headers).json() == []

    client.get(f"/recipes/{receita['id']}", headers=headers)
    assert len(client.get("/history", headers=headers).json()) == 1


def test_email_is_case_insensitive(client):
    client.post(
        "/users", json={"nome": "C", "email": "Caixa@Example.com", "senha": "senha123"}
    )
    duplicado = client.post(
        "/users", json={"nome": "C", "email": "caixa@example.com", "senha": "senha123"}
    )
    login = client.post(
        "/auth/login", data={"username": "CAIXA@example.com", "password": "senha123"}
    )

    assert duplicado.status_code == 409
    assert login.status_code == 200


def test_update_email(client):
    headers = _auth(client)
    _auth(client, email="ocupado@example.com")

    conflito = client.patch(
        "/users/me", json={"email": "ocupado@example.com"}, headers=headers
    )
    ok = client.patch("/users/me", json={"email": "Novo@Example.com"}, headers=headers)

    assert conflito.status_code == 409
    assert ok.status_code == 200
    assert ok.json()["email"] == "novo@example.com"


@pytest.fixture
def limite_login(monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN", 3)
    limitar_login.reset()
    yield
    limitar_login.reset()


def test_login_rate_limited(client, limite_login):
    respostas = [
        client.post("/auth/login", data={"username": "x@x.com", "password": "errada1"})
        for _ in range(4)
    ]

    assert [r.status_code for r in respostas] == [401, 401, 401, 429]
    assert "Retry-After" in respostas[-1].headers


@pytest.fixture
def limite_cadastro(monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_CADASTRO", 2)
    limitar_cadastro.reset()
    yield
    limitar_cadastro.reset()


def test_register_rate_limited(client, limite_cadastro):
    codigos = [
        client.post(
            "/users",
            json={"nome": "N", "email": f"spam{i}@example.com", "senha": "senha123"},
        ).status_code
        for i in range(3)
    ]

    assert codigos == [201, 201, 429]
