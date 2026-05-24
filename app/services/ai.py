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


def _chamar_modelo(client, conteudo: str) -> dict:
    resposta = client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=1024,
        timeout=settings.AI_TIMEOUT,
        messages=[{"role": "user", "content": conteudo}],
    )
    return _parse_receita(_extrair_texto(resposta))


def generate_recipe(ingredientes: list[str], client=None) -> dict:
    client = client or _build_client()
    conteudo = PROMPT.format(ingredientes=", ".join(ingredientes))
    ultimo_erro: Exception | None = None
    for _ in range(max(1, settings.AI_MAX_TENTATIVAS)):
        try:
            return _chamar_modelo(client, conteudo)
        except Exception as erro:
            ultimo_erro = erro
    raise AIServiceUnavailable(str(ultimo_erro)) from ultimo_erro
