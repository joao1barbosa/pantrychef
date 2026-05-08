import json

from app.config import settings
from app.exceptions import AIServiceUnavailable

PROMPT = (
    "Você é um chef. Crie uma receita em português do Brasil usando apenas os "
    "ingredientes informados. Responda exclusivamente com um JSON no formato: "
    '{{"nome": str, "modo_preparo": str, "categoria": str, '
    '"ingredientes": [{{"nome": str, "quantidade": str}}]}}. '
    "Ingredientes disponíveis: {ingredientes}."
)


def _build_client():
    from anthropic import Anthropic

    return Anthropic(api_key=settings.AI_API_KEY)


def _extrair_texto(resposta) -> str:
    return resposta.content[0].text


def _parse_receita(texto: str) -> dict:
    dados = json.loads(texto)
    nome = dados["nome"]
    modo_preparo = dados["modo_preparo"]
    ingredientes = dados.get("ingredientes", [])
    if not isinstance(nome, str) or not isinstance(modo_preparo, str):
        raise ValueError("campos obrigatórios ausentes")
    if not isinstance(ingredientes, list):
        raise ValueError("ingredientes inválidos")
    return {
        "nome": nome,
        "modo_preparo": modo_preparo,
        "categoria": dados.get("categoria"),
        "ingredientes": [
            {"nome": item["nome"], "quantidade": item.get("quantidade")}
            for item in ingredientes
        ],
    }


def generate_recipe(ingredientes: list[str], client=None) -> dict:
    client = client or _build_client()
    try:
        resposta = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": PROMPT.format(ingredientes=", ".join(ingredientes)),
                }
            ],
        )
        return _parse_receita(_extrair_texto(resposta))
    except AIServiceUnavailable:
        raise
    except Exception as erro:
        raise AIServiceUnavailable(str(erro)) from erro
