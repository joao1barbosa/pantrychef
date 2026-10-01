import json

import pytest

from app.exceptions import AIServiceUnavailable
from app.services import ai


class _Message:
    def __init__(self, content):
        self.content = content


class _Choice:
    def __init__(self, content):
        self.message = _Message(content)
        self.finish_reason = "stop"


class _Resp:
    def __init__(self, text):
        self.choices = [_Choice(text)]


class _TimeoutCompletions:
    def create(self, **kwargs):
        raise TimeoutError("tempo esgotado")


class _MalformedCompletions:
    def create(self, **kwargs):
        return _Resp("isto não é json")


class _FlakyCompletions:
    def __init__(self, payload):
        self.calls = 0
        self._payload = payload

    def create(self, **kwargs):
        self.calls += 1
        if self.calls == 1:
            raise RuntimeError("falha temporária")
        return _Resp(json.dumps(self._payload))


class _Client:
    def __init__(self, completions):
        self.chat = type("Chat", (), {"completions": completions})


def test_ai_timeout_raises_controlled_error():
    with pytest.raises(AIServiceUnavailable):
        ai.generate_recipe(["Tomate", "Cebola", "Alho"], client=_Client(_TimeoutCompletions()))


def test_ai_malformed_response_handled():
    with pytest.raises(AIServiceUnavailable):
        ai.generate_recipe(["Tomate", "Cebola", "Alho"], client=_Client(_MalformedCompletions()))


def test_ai_retries_once_then_succeeds():
    payload = {
        "nome": "Refogado",
        "modo_preparo": "Refogue.",
        "categoria": "Prato principal",
        "ingredientes": [{"nome": "Tomate", "quantidade": "1"}],
    }
    completions = _FlakyCompletions(payload)
    result = ai.generate_recipe(["Tomate", "Cebola", "Alho"], client=_Client(completions))
    assert result["nome"] == "Refogado"
    assert completions.calls == 2


def test_system_stays_up_after_ai_failure(client, db_session):
    from app.dependencies import get_ai_generator
    from app.main import app

    def broken(nomes):
        raise AIServiceUnavailable("indisponível")

    from app.models.ingredient import Ingrediente

    ings = [Ingrediente(nome=n.title(), slug=n) for n in ("tomate", "cebola", "alho")]
    db_session.add_all(ings)
    db_session.commit()
    ids = [str(i.id) for i in ings]

    app.dependency_overrides[get_ai_generator] = lambda: broken
    try:
        failed = client.post("/recipes/search", json={"ingredientes": ids})
        assert failed.status_code == 503
        assert client.get("/health").status_code == 200
    finally:
        app.dependency_overrides.pop(get_ai_generator, None)


def test_ai_failures_are_logged_with_cause(caplog):
    with caplog.at_level("WARNING", logger="app.services.ai"):
        with pytest.raises(AIServiceUnavailable):
            ai.validate_and_normalize_ingredients(
                ["xpto"], client=_Client(_TimeoutCompletions())
            )

    mensagens = [r.getMessage() for r in caplog.records]
    assert mensagens, "nenhuma falha registrada"
    assert all("validação de ingredientes" in m for m in mensagens)
    assert "TimeoutError: tempo esgotado" in mensagens[-1]


class _AuthErrorCompletions:
    def __init__(self):
        self.calls = 0

    def create(self, **kwargs):
        self.calls += 1
        erro = RuntimeError("API key expired.")
        erro.status_code = 401
        raise erro


def test_ai_does_not_retry_permanent_client_errors(monkeypatch):
    monkeypatch.setattr(ai.settings, "AI_MAX_TENTATIVAS", 3)
    completions = _AuthErrorCompletions()
    with pytest.raises(AIServiceUnavailable):
        ai.generate_recipe(["Tomate", "Cebola", "Alho"], client=_Client(completions))
    assert completions.calls == 1


def _cliente_com_respostas(*respostas):
    class _Sequencia:
        def __init__(self):
            self.calls = 0
            self.kwargs = []

        def create(self, **kwargs):
            self.kwargs.append(kwargs)
            resposta = respostas[min(self.calls, len(respostas) - 1)]
            self.calls += 1
            return resposta

    completions = _Sequencia()
    return _Client(completions), completions


_RECEITA_OK = {"nome": "Omelete", "modo_preparo": "Bata.", "ingredientes": []}


def test_ai_retries_when_reasoning_model_returns_no_content(monkeypatch):
    monkeypatch.setattr(ai.settings, "AI_MAX_TENTATIVAS", 3)
    vazio = _Resp(None)
    vazio.choices[0].finish_reason = "length"
    client, completions = _cliente_com_respostas(vazio, _Resp(json.dumps(_RECEITA_OK)))

    assert ai.generate_recipe(["Ovo", "Queijo", "Sal"], client=client)["nome"] == "Omelete"
    assert completions.calls == 2


def test_ai_extracts_json_surrounded_by_text():
    texto = "Claro! Aqui está:\n```json\n" + json.dumps(_RECEITA_OK) + "\n```\nBom apetite!"
    client, _ = _cliente_com_respostas(_Resp(texto))
    assert ai.generate_recipe(["Ovo", "Queijo", "Sal"], client=client)["nome"] == "Omelete"


def test_ai_non_recipe_answer_is_retried(monkeypatch):
    monkeypatch.setattr(ai.settings, "AI_MAX_TENTATIVAS", 2)
    client, completions = _cliente_com_respostas(
        _Resp("User Safety: safe"), _Resp(json.dumps(_RECEITA_OK))
    )
    assert ai.generate_recipe(["Ovo", "Queijo", "Sal"], client=client)["nome"] == "Omelete"
    assert completions.calls == 2


def test_ai_request_uses_token_budget_and_low_reasoning():
    client, completions = _cliente_com_respostas(_Resp(json.dumps(_RECEITA_OK)))
    ai.generate_recipe(["Ovo", "Queijo", "Sal"], client=client)
    kwargs = completions.kwargs[0]
    assert kwargs["max_tokens"] == ai.settings.AI_MAX_TOKENS
    assert kwargs["extra_body"]["reasoning"]["effort"] == "low"


def test_ai_slow_response_hits_total_deadline(monkeypatch):
    import time

    monkeypatch.setattr(ai.settings, "AI_TIMEOUT", 0.2)
    monkeypatch.setattr(ai.settings, "AI_MAX_TENTATIVAS", 1)

    class _Lenta:
        def create(self, **kwargs):
            time.sleep(1)
            return _Resp(json.dumps(_RECEITA_OK))

    inicio = time.monotonic()
    with pytest.raises(AIServiceUnavailable):
        ai.generate_recipe(["Ovo", "Queijo", "Sal"], client=_Client(_Lenta()))
    assert time.monotonic() - inicio < 0.8
