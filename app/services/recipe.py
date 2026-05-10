from typing import Callable
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.exceptions import AIServiceUnavailable
from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente
from app.schemas.recipe import RecipeCreate, RecipeIngredientIn
from app.services.ingredient import get_or_create_ingrediente
from app.utils.slug import slugify


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
        "modo_preparo": receita.modo_preparo,
        "categoria": receita.categoria,
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


def _montar_itens(data: RecipeCreate) -> list[ReceitaIngrediente]:
    return [
        ReceitaIngrediente(
            ingrediente_id=item.ingrediente_id,
            quantidade=item.quantidade,
        )
        for item in data.ingredientes
    ]


def criar_receita(db: Session, data: RecipeCreate) -> dict:
    receita = Receita(
        nome=data.nome,
        slug=_gerar_slug_unico(db, data.nome),
        modo_preparo=data.modo_preparo,
        categoria=data.categoria,
        itens=_montar_itens(data),
    )
    db.add(receita)
    db.commit()
    db.refresh(receita)
    return serializar_receita(receita)


def listar_receitas(db: Session) -> list[dict]:
    receitas = _query_receitas(db).order_by(Receita.criado_em.desc()).all()
    return [serializar_receita(receita) for receita in receitas]


def _buscar_receita_ou_404(db: Session, receita_id: UUID) -> Receita:
    receita = _query_receitas(db).filter(Receita.id == receita_id).first()
    if receita is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receita não encontrada.",
        )
    return receita


def obter_receita(db: Session, receita_id: UUID) -> dict:
    return serializar_receita(_buscar_receita_ou_404(db, receita_id))


def atualizar_receita(db: Session, receita_id: UUID, data: RecipeCreate) -> dict:
    receita = _buscar_receita_ou_404(db, receita_id)
    if data.nome != receita.nome:
        receita.slug = _gerar_slug_unico(db, data.nome)
    receita.nome = data.nome
    receita.modo_preparo = data.modo_preparo
    receita.categoria = data.categoria
    receita.itens = _montar_itens(data)
    db.commit()
    db.refresh(receita)
    return serializar_receita(receita)


def deletar_receita(db: Session, receita_id: UUID) -> None:
    receita = _buscar_receita_ou_404(db, receita_id)
    db.delete(receita)
    db.commit()


def _receitas_por_ingredientes(db: Session, ingrediente_ids: list[UUID]) -> list[Receita]:
    tem_ingrediente = (
        select(ReceitaIngrediente.receita_id)
        .where(ReceitaIngrediente.receita_id == Receita.id)
        .exists()
    )
    requer_externo = (
        select(ReceitaIngrediente.receita_id)
        .where(
            ReceitaIngrediente.receita_id == Receita.id,
            ReceitaIngrediente.ingrediente_id.notin_(ingrediente_ids),
        )
        .exists()
    )
    sobreposicao = (
        select(func.count(ReceitaIngrediente.ingrediente_id))
        .where(ReceitaIngrediente.receita_id == Receita.id)
        .scalar_subquery()
    )

    return (
        _query_receitas(db)
        .filter(tem_ingrediente, ~requer_externo)
        .order_by(sobreposicao.desc(), Receita.nome)
        .all()
    )


def buscar_por_ingredientes(db: Session, ingrediente_ids: list[UUID]) -> list[dict]:
    receitas = _receitas_por_ingredientes(db, ingrediente_ids)
    return [serializar_receita(receita) for receita in receitas]


def _nomes_dos_ingredientes(db: Session, ingrediente_ids: list[UUID]) -> list[str]:
    from app.models.ingredient import Ingrediente

    linhas = (
        db.query(Ingrediente.nome)
        .filter(Ingrediente.id.in_(ingrediente_ids))
        .all()
    )
    return [nome for (nome,) in linhas]


def _persistir_receita_gerada(db: Session, gerada: dict) -> dict:
    ingredientes = []
    for item in gerada.get("ingredientes", []):
        ingrediente = get_or_create_ingrediente(db, item["nome"])
        ingredientes.append(
            RecipeIngredientIn(
                ingrediente_id=ingrediente.id, quantidade=item.get("quantidade")
            )
        )
    receita = RecipeCreate(
        nome=gerada["nome"],
        modo_preparo=gerada["modo_preparo"],
        categoria=gerada.get("categoria"),
        ingredientes=ingredientes,
    )
    return criar_receita(db, receita)


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
