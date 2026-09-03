from pathlib import Path

_RAIZ_LOCAL = Path(__file__).resolve().parent.parent.parent
_RAIZ_CONTAINER = Path("/workspaces/pantrychef")


def _raiz_do_monorepo() -> Path:
    for candidato in (_RAIZ_LOCAL, _RAIZ_CONTAINER):
        if (candidato / "README.md").exists():
            return candidato
    return _RAIZ_LOCAL


ROOT = _raiz_do_monorepo()
SECOES_OBRIGATORIAS = [
    "setup",
    "rotas",
    "variáveis de ambiente",
    "como rodar os testes",
]


def test_readme_exists():
    assert (ROOT / "README.md").exists()


def test_readme_has_required_sections():
    conteudo = (ROOT / "README.md").read_text().lower()
    for secao in SECOES_OBRIGATORIAS:
        assert secao in conteudo, f"seção ausente: {secao}"
