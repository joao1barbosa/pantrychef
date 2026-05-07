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
        return json.loads(_extrair_texto(resposta))
    except Exception as erro:
        raise AIServiceUnavailable(str(erro)) from erro
