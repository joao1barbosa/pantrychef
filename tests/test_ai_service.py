import json

import pytest

from app.exceptions import AIServiceUnavailable
from app.services.ai import generate_recipe


class _FakeBlock:
    def __init__(self, text):
        self.text = text


class _FakeMessages:
    def __init__(self, payload=None, error=None):
        self._payload = payload
        self._error = error

    def create(self, **kwargs):
        if self._error is not None:
            raise self._error
        return type("Resp", (), {"content": [_FakeBlock(json.dumps(self._payload))]})


class _FakeClient:
    def __init__(self, payload=None, error=None):
        self.messages = _FakeMessages(payload=payload, error=error)


def test_ai_generate_returns_structured_recipe():
    payload = {
        "nome": "Refogado Rápido",
        "modo_preparo": "Refogue tudo.",
        "categoria": "Prato principal",
        "ingredientes": [{"nome": "Tomate", "quantidade": "2 unidades"}],
    }
    result = generate_recipe(
        ["Tomate", "Cebola", "Alho"], client=_FakeClient(payload=payload)
    )
    assert result["nome"] == "Refogado Rápido"
    assert result["modo_preparo"]
    assert isinstance(result["ingredientes"], list)
    assert result["ingredientes"][0]["nome"] == "Tomate"


def test_ai_unavailable_raises_controlled_error():
    client = _FakeClient(error=RuntimeError("network down"))
    with pytest.raises(AIServiceUnavailable):
        generate_recipe(["Tomate", "Cebola", "Alho"], client=client)
