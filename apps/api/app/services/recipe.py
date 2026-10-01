from typing import Callable
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.exceptions import AIServiceUnavailable
from app.models.favorite import Favorito
from app.models.ingredient import Ingrediente
from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente
from app.schemas.recipe import RecipeCreate, RecipeIngredientIn
from app.services.ingredient import get_or_create_ingrediente
from app.utils.slug import slugify


_DIFICULDADE_MAP = {
    "facil": "facil", "fácil": "facil", "easy": "facil",
    "medio": "medio", "médio": "medio", "media": "medio", "média": "medio", "medium": "medio",
    "dificil": "dificil", "difícil": "dificil", "hard": "dificil",
}


def normalizar_dificuldade(valor: str | None) -> str | None:
    """Normaliza a dificuldade retornada pela IA para o formato do schema."""
    if valor is None:
        return None
    chave = valor.strip().lower()
    return _DIFICULDADE_MAP.get(chave)  # retorna None se não reconhecer


def _query_receitas(db: Session):
    return db.query(Receita).options(
        joinedload(Receita.itens).joinedload(ReceitaIngrediente.ingrediente)
    )


def _gerar_slug_unico(db: Session, nome: str) -> str:
    base = slugify(nome)
    slug = base
    contador = 2
    while db.query(Receita).filter(Receita.slug == slug).first() is not None:
        slug = f"{base}-{contador}"
        contador += 1
    return slug


def serializar_receita(receita: Receita) -> dict:
    return {
        "id": receita.id,
        "nome": receita.nome,
        "slug": receita.slug,
        "usuario_id": receita.usuario_id,
        "modo_preparo": receita.modo_preparo,
        "categoria": receita.categoria,
        "tempo_preparo": receita.tempo_preparo,
        "dificuldade": receita.dificuldade,
        "gerada_por_ia": bool(receita.gerada_por_ia),
        "criado_em": receita.criado_em,
        "ingredientes": [
            {
                "ingrediente_id": item.ingrediente_id,
                "nome": item.ingrediente.nome,
                "quantidade": item.quantidade,
            }
            for item in receita.itens
        ],
    }


def _validar_ingredientes(db: Session, data: RecipeCreate) -> None:
    ids = {item.ingrediente_id for item in data.ingredientes}
    if not ids:
        return
    existentes = {
        linha[0]
        for linha in db.query(Ingrediente.id).filter(Ingrediente.id.in_(ids)).all()
    }
    ausentes = ids - existentes
    if ausentes:
        raise HTTPException(
            status_code=422,
            detail="Um ou mais ingredientes informados não existem.",
        )


def _montar_itens(data: RecipeCreate) -> list[ReceitaIngrediente]:
    return [
        ReceitaIngrediente(
            ingrediente_id=item.ingrediente_id,
            quantidade=item.quantidade,
        )
        for item in data.ingredientes
    ]


def criar_receita(
    db: Session,
    data: RecipeCreate,
    usuario_id: UUID | None = None,
    gerada_por_ia: bool = False,
) -> dict:
    _validar_ingredientes(db, data)
    receita = Receita(
        nome=data.nome,
        slug=_gerar_slug_unico(db, data.nome),
        modo_preparo=data.modo_preparo,
        categoria=data.categoria,
        tempo_preparo=data.tempo_preparo,
        dificuldade=data.dificuldade,
        usuario_id=usuario_id,
        gerada_por_ia=gerada_por_ia,
        itens=_montar_itens(data),
    )
    db.add(receita)
    db.commit()
    db.refresh(receita)
    return serializar_receita(receita)


def _aplicar_filtros(
    query,
    nome: str | None,
    categoria: str | None,
    tempo_min: int | None = None,
    tempo_max: int | None = None,
    dificuldade: str | None = None,
):
    if nome:
        query = query.filter(Receita.nome.ilike(f"%{_escapar_like(nome)}%", escape="\\"))
    if categoria:
        query = query.filter(
            Receita.categoria.ilike(f"%{_escapar_like(categoria)}%", escape="\\")
        )
    if tempo_min is not None:
        query = query.filter(Receita.tempo_preparo >= tempo_min)
    if tempo_max is not None:
        query = query.filter(Receita.tempo_preparo <= tempo_max)
    if dificuldade:
        query = query.filter(Receita.dificuldade == dificuldade)
    return query


def _escapar_like(valor: str) -> str:
    return valor.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _contagem_favoritos():
    return (
        select(func.count(Favorito.id))
        .where(Favorito.receita_id == Receita.id)
        .scalar_subquery()
    )


def _aplicar_ordenacao(query, ordenacao: str | None):
    if ordenacao == "populares":
        return query.order_by(_contagem_favoritos().desc(), Receita.criado_em.desc())
    if ordenacao == "tempo_asc":
        return query.order_by(Receita.tempo_preparo.asc().nulls_last())
    if ordenacao == "tempo_desc":
        return query.order_by(Receita.tempo_preparo.desc().nulls_last())
    if ordenacao == "nome_asc":
        return query.order_by(Receita.nome.asc())
    if ordenacao == "nome_desc":
        return query.order_by(Receita.nome.desc())
    return query.order_by(Receita.criado_em.desc())


def listar_receitas(
    db: Session,
    nome: str | None = None,
    categoria: str | None = None,
    tempo_min: int | None = None,
    tempo_max: int | None = None,
    dificuldade: str | None = None,
    ordenacao: str | None = None,
    limite: int | None = None,
    deslocamento: int = 0,
) -> list[dict]:
    query = _aplicar_filtros(
        _query_receitas(db), nome, categoria, tempo_min, tempo_max, dificuldade
    )
    query = _aplicar_ordenacao(query, ordenacao).order_by(Receita.id)
    if deslocamento:
        query = query.offset(deslocamento)
    if limite is not None:
        query = query.limit(limite)
    receitas = query.all()
    return [serializar_receita(receita) for receita in receitas]


def buscar_receita_ou_404(db: Session, receita_id: UUID) -> Receita:
    receita = _query_receitas(db).filter(Receita.id == receita_id).first()
    if receita is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receita não encontrada.",
        )
    return receita


def obter_receita(db: Session, receita_id: UUID) -> dict:
    return serializar_receita(buscar_receita_ou_404(db, receita_id))


def _garantir_dono(receita: Receita, usuario_id: UUID) -> None:
    if receita.usuario_id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para alterar esta receita.",
        )


def atualizar_receita(
    db: Session, receita_id: UUID, data: RecipeCreate, usuario_id: UUID
) -> dict:
    receita = buscar_receita_ou_404(db, receita_id)
    _garantir_dono(receita, usuario_id)
    _validar_ingredientes(db, data)
    if data.nome != receita.nome:
        receita.slug = _gerar_slug_unico(db, data.nome)
    receita.nome = data.nome
    receita.modo_preparo = data.modo_preparo
    receita.categoria = data.categoria
    receita.tempo_preparo = data.tempo_preparo
    receita.dificuldade = data.dificuldade
    receita.itens = _montar_itens(data)
    db.commit()
    db.refresh(receita)
    return serializar_receita(receita)


def deletar_receita(db: Session, receita_id: UUID, usuario_id: UUID) -> None:
    receita = buscar_receita_ou_404(db, receita_id)
    _garantir_dono(receita, usuario_id)
    db.delete(receita)
    db.commit()


def _possui_ingrediente():
    return (
        select(ReceitaIngrediente.receita_id)
        .where(ReceitaIngrediente.receita_id == Receita.id)
        .exists()
    )


def _requer_ingrediente_externo(ingrediente_ids: list[UUID]):
    return (
        select(ReceitaIngrediente.receita_id)
        .where(
            ReceitaIngrediente.receita_id == Receita.id,
            ReceitaIngrediente.ingrediente_id.notin_(ingrediente_ids),
        )
        .exists()
    )


def _contagem_sobreposicao():
    return (
        select(func.count(ReceitaIngrediente.ingrediente_id))
        .where(ReceitaIngrediente.receita_id == Receita.id)
        .scalar_subquery()
    )


def _receitas_por_ingredientes(db: Session, ingrediente_ids: list[UUID]) -> list[Receita]:
    return (
        _query_receitas(db)
        .filter(_possui_ingrediente(), ~_requer_ingrediente_externo(ingrediente_ids))
        .order_by(_contagem_sobreposicao().desc(), Receita.nome)
        .all()
    )


def buscar_por_ingredientes(db: Session, ingrediente_ids: list[UUID]) -> list[dict]:
    receitas = _receitas_por_ingredientes(db, ingrediente_ids)
    return [serializar_receita(receita) for receita in receitas]


def _nomes_dos_ingredientes(db: Session, ingrediente_ids: list[UUID]) -> list[str]:
    linhas = (
        db.query(Ingrediente.nome)
        .filter(Ingrediente.id.in_(ingrediente_ids))
        .all()
    )
    return [nome for (nome,) in linhas]


def _texto_ou_none(valor, limite: int) -> str | None:
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto[:limite] or None


def _tempo_valido(valor) -> int | None:
    try:
        tempo = int(valor)
    except (TypeError, ValueError):
        return None
    return tempo if 0 < tempo <= 1440 else None


def _persistir_receita_gerada(db: Session, gerada: dict) -> dict:
    nome = _texto_ou_none(gerada.get("nome"), 120)
    modo_preparo = _texto_ou_none(gerada.get("modo_preparo"), 10000)
    if nome is None or modo_preparo is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de IA indisponível no momento.",
        )
    slug = slugify(nome)
    existente = _query_receitas(db).filter(Receita.slug == slug).first()
    if existente is not None:
        return serializar_receita(existente)

    ingredientes: dict[UUID, RecipeIngredientIn] = {}
    for item in gerada.get("ingredientes", [])[:50]:
        nome_ingrediente = _texto_ou_none(item.get("nome"), 60)
        if nome_ingrediente is None:
            continue
        ingrediente = get_or_create_ingrediente(db, nome_ingrediente)
        ingredientes.setdefault(
            ingrediente.id,
            RecipeIngredientIn(
                ingrediente_id=ingrediente.id,
                quantidade=_texto_ou_none(item.get("quantidade"), 60),
            ),
        )
    receita = RecipeCreate(
        nome=nome,
        modo_preparo=modo_preparo,
        categoria=_texto_ou_none(gerada.get("categoria"), 60),
        tempo_preparo=_tempo_valido(gerada.get("tempo_preparo")),
        dificuldade=normalizar_dificuldade(_texto_ou_none(gerada.get("dificuldade"), 20)),
        ingredientes=list(ingredientes.values()),
    )
    return criar_receita(db, receita, gerada_por_ia=True)


def buscar_com_fallback_ia(
    db: Session,
    ingrediente_ids: list[UUID],
    gerar: Callable[[list[str]], dict],
) -> list[dict]:
    receitas = _receitas_por_ingredientes(db, ingrediente_ids)
    if receitas:
        return [serializar_receita(receita) for receita in receitas]

    nomes = _nomes_dos_ingredientes(db, ingrediente_ids)
    try:
        gerada = gerar(nomes)
    except AIServiceUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de IA indisponível no momento.",
        )
    return [_persistir_receita_gerada(db, gerada)]


def resolver_ingredientes_por_nome(
    db: Session, nomes: list[str]
) -> tuple[list[Ingrediente], list[str]]:
    conhecidos: dict[UUID, Ingrediente] = {}
    desconhecidos: list[str] = []
    for nome in nomes:
        ingrediente = (
            db.query(Ingrediente).filter(Ingrediente.slug == slugify(nome)).first()
        )
        if ingrediente is None:
            desconhecidos.append(nome)
        else:
            conhecidos.setdefault(ingrediente.id, ingrediente)
    return list(conhecidos.values()), desconhecidos


def buscar_por_nomes(
    db: Session,
    nomes: list[str],
    gerar: Callable[[list[str]], dict],
    validar: Callable[[list[str]], dict],
) -> list[dict]:
    conhecidos, desconhecidos = resolver_ingredientes_por_nome(db, nomes)
    ids = [ingrediente.id for ingrediente in conhecidos]
    invalidos: list[str] = []

    if desconhecidos:
        try:
            validacao = validar(desconhecidos)
        except AIServiceUnavailable:
            if len(ids) < 3:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        "Não foi possível validar os ingredientes digitados agora. "
                        "Escolha ingredientes da lista ou tente novamente mais tarde."
                    ),
                )
            validacao = {"validos": [], "invalidos": []}
        for item in validacao.get("validos", []):
            ingrediente = get_or_create_ingrediente(db, item["normalizado"][:60])
            if ingrediente.id not in ids:
                ids.append(ingrediente.id)
        invalidos = [str(i) for i in validacao.get("invalidos", [])]
        db.commit()

    if len(ids) < 3:
        detalhe = "Envie pelo menos 3 ingredientes válidos."
        if invalidos:
            detalhe += f" Inválidos: {', '.join(invalidos)}"
        raise HTTPException(status_code=422, detail=detalhe)

    return buscar_com_fallback_ia(db, ids, gerar)
