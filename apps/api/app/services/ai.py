import json

from app.config import settings
from app.exceptions import AIServiceUnavailable

PROMPT = (
    "Você é um chef brasileiro. Crie uma receita usando APENAS os ingredientes informados.\n\n"
    "Diretrizes:\n"
    "- Use apenas ingredientes reais e comestíveis\n"
    "- Se algum ingrediente parecer errado, ignore-o e use os válidos\n"
    "- Crie uma receita prática e deliciosa\n\n"
    "Responda exclusivamente com JSON no formato:\n"
    '{{"nome": str, "modo_preparo": str, "categoria": str, '
    '"tempo_preparo": int, "dificuldade": str, '
    '"ingredientes": [{{"nome": str, "quantidade": str}}]}}\n\n'
    "Ingredientes: {ingredientes}."
)

VALIDATE_PROMPT = (
    "Você é um validador de ingredientes culinários. Receba uma lista de itens e:\n"
    "1. Valide se cada item é um ingrediente de comida real (rejeite objetos, animais vivos, etc.)\n"
    "2. Normalize o nome (corrija erros de digitação: 'salsich' → 'salsicha', 'sals1ch4' → 'salsicha')\n"
    "3. Mantenha apenas ingredientes válidos\n\n"
    "Responda exclusivamente com JSON no formato:\n"
    '{{"validos": [{{"original": str, "normalizado": str}}], "invalidos": [str]}}\n\n'
    "Itens para validar: {ingredientes}."
)


def _build_client():
    from openai import OpenAI

    return OpenAI(base_url=settings.AI_BASE_URL, api_key=settings.AI_API_KEY)


def _extrair_texto(resposta) -> str:
    return resposta.choices[0].message.content


def _parse_receita(texto: str) -> dict:
    dados = json.loads(_limpar_json(texto))
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
        "tempo_preparo": dados.get("tempo_preparo"),
        "dificuldade": dados.get("dificuldade"),
        "ingredientes": [
            {"nome": item["nome"], "quantidade": item.get("quantidade")}
            for item in ingredientes
        ],
    }


def _limpar_json(texto: str) -> str:
    texto = texto.strip()
    if texto.startswith("```"):
        linhas = texto.splitlines()
        linhas = [l for l in linhas if not l.strip().startswith("```")]
        texto = "\n".join(linhas).strip()
    return texto


def _parse_validacao(texto: str) -> dict:
    dados = json.loads(_limpar_json(texto))
    validos = dados.get("validos", [])
    invalidos = dados.get("invalidos", [])
    if not isinstance(validos, list) or not isinstance(invalidos, list):
        raise ValueError("resposta de validação inválida")
    normalizados = []
    for item in validos:
        if not isinstance(item, dict):
            raise ValueError("item válido inválido")
        original = item.get("original")
        normalizado = item.get("normalizado")
        if not isinstance(original, str) or not isinstance(normalizado, str):
            raise ValueError("item válido inválido")
        normalizado = normalizado.strip()
        if not normalizado:
            continue
        normalizados.append({"original": original, "normalizado": normalizado})
    invalidos_limpos = [str(i) for i in invalidos if isinstance(i, str) or i is not None]
    return {"validos": normalizados, "invalidos": invalidos_limpos}


def _chamar_validacao(client, conteudo: str) -> dict:
    resposta = client.chat.completions.create(
        model=settings.AI_MODEL,
        max_tokens=1024,
        timeout=settings.AI_TIMEOUT,
        messages=[{"role": "user", "content": conteudo}],
    )
    return _parse_validacao(_extrair_texto(resposta))


def _chamar_modelo(client, conteudo: str) -> dict:
    resposta = client.chat.completions.create(
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


def validate_and_normalize_ingredients(ingredientes: list[str], client=None) -> dict:
    """
    Valida e normaliza ingredientes via IA.
    Retorna: {"validos": [{"original": "...", "normalizado": "..."}], "invalidos": [...]}
    """
    client = client or _build_client()
    conteudo = VALIDATE_PROMPT.format(ingredientes=", ".join(ingredientes))
    ultimo_erro: Exception | None = None
    for _ in range(max(1, settings.AI_MAX_TENTATIVAS)):
        try:
            return _chamar_validacao(client, conteudo)
        except Exception as erro:
            ultimo_erro = erro
    raise AIServiceUnavailable(str(ultimo_erro)) from ultimo_erro
