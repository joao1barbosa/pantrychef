from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
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
