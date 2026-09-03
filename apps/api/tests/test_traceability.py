from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"

ROTAS_ESPERADAS = [
    ("post", "/users"),
    ("get", "/users/me"),
    ("patch", "/users/me"),
    ("delete", "/users/me"),
    ("post", "/auth/login"),
    ("get", "/ingredients"),
    ("post", "/recipes"),
    ("get", "/recipes"),
    ("get", "/recipes/{receita_id}"),
    ("put", "/recipes/{receita_id}"),
    ("delete", "/recipes/{receita_id}"),
    ("post", "/recipes/search"),
    ("get", "/history"),
    ("get", "/favorites"),
    ("post", "/favorites"),
    ("delete", "/favorites/{receita_id}"),
]


def test_all_required_routes_exist(client):
    paths = client.get("/openapi.json").json()["paths"]
    for metodo, rota in ROTAS_ESPERADAS:
        assert rota in paths, f"rota ausente: {rota}"
        assert metodo in paths[rota], f"método ausente: {metodo} {rota}"


def test_no_inline_comments_in_app():
    ofensores = []
    for arquivo in APP.rglob("*.py"):
        for numero, linha in enumerate(arquivo.read_text().splitlines(), start=1):
            despido = linha.strip()
            if despido.startswith("#") and not despido.startswith("#!"):
                ofensores.append(f"{arquivo.relative_to(ROOT)}:{numero}")
    assert ofensores == [], f"comentários encontrados: {ofensores}"
