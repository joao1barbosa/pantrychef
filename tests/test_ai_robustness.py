import json

import pytest

from app.exceptions import AIServiceUnavailable
from app.services import ai


class _Block:
    def __init__(self, text):
        self.text = text


class _Resp:
    def __init__(self, text):
        self.content = [_Block(text)]


class _TimeoutMessages:
    def create(self, **kwargs):
        raise TimeoutError("tempo esgotado")


class _MalformedMessages:
    def create(self, **kwargs):
        return _Resp("isto não é json")


class _FlakyMessages:
    def __init__(self, payload):
        self.calls = 0
        self._payload = payload

    def create(self, **kwargs):
        self.calls += 1
        if self.calls == 1:
            raise RuntimeError("falha temporária")
        return _Resp(json.dumps(self._payload))


class _Client:
    def __init__(self, messages):
        self.messages = messages


def test_ai_timeout_raises_controlled_error():
    with pytest.raises(AIServiceUnavailable):
        ai.generate_recipe(["Tomate", "Cebola", "Alho"], client=_Client(_TimeoutMessages()))


def test_ai_malformed_response_handled():
    with pytest.raises(AIServiceUnavailable):
        ai.generate_recipe(["Tomate", "Cebola", "Alho"], client=_Client(_MalformedMessages()))


def test_ai_retries_once_then_succeeds():
    payload = {
        "nome": "Refogado",
        "modo_preparo": "Refogue.",
        "categoria": "Prato principal",
        "ingredientes": [{"nome": "Tomate", "quantidade": "1"}],
    }
    messages = _FlakyMessages(payload)
    result = ai.generate_recipe(["Tomate", "Cebola", "Alho"], client=_Client(messages))
    assert result["nome"] == "Refogado"
    assert messages.calls == 2


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
