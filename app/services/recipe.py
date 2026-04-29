from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente
from app.schemas.recipe import RecipeCreate
from app.utils.slug import slugify


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


def criar_receita(db: Session, data: RecipeCreate) -> dict:
    receita = Receita(
        nome=data.nome,
        slug=_gerar_slug_unico(db, data.nome),
        modo_preparo=data.modo_preparo,
        categoria=data.categoria,
    )
    for item in data.ingredientes:
        receita.itens.append(
            ReceitaIngrediente(
                ingrediente_id=item.ingrediente_id,
                quantidade=item.quantidade,
            )
        )
    db.add(receita)
    db.commit()
    db.refresh(receita)
    return serializar_receita(receita)


def listar_receitas(db: Session) -> list[dict]:
    receitas = db.query(Receita).order_by(Receita.criado_em.desc()).all()
    return [serializar_receita(receita) for receita in receitas]


def obter_receita(db: Session, receita_id: UUID) -> dict:
    receita = db.query(Receita).filter(Receita.id == receita_id).first()
    if receita is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receita não encontrada.",
        )
    return serializar_receita(receita)
