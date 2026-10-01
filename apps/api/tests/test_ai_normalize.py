from app.services.recipe import normalizar_dificuldade


def test_normalizar_dificuldade_variacoes():
    assert normalizar_dificuldade("Média") == "medio"
    assert normalizar_dificuldade("média") == "medio"
    assert normalizar_dificuldade("FACIL") == "facil"
    assert normalizar_dificuldade("Fácil") == "facil"
    assert normalizar_dificuldade("Difícil") == "dificil"
    assert normalizar_dificuldade("easy") == "facil"
    assert normalizar_dificuldade("hard") == "dificil"
    assert normalizar_dificuldade("desconhecido") is None
    assert normalizar_dificuldade(None) is None
