from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.recipe import Receita
from app.models.recipe_ingredient import ReceitaIngrediente


def _query_receitas(db: Session):
    return db.query(Receita).options(
        joinedload(Receita.itens).joinedload(ReceitaIngrediente.ingrediente)
    )
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
    receita.itens = [
        ReceitaIngrediente(
            ingrediente_id=item.ingrediente_id,
            quantidade=item.quantidade,
        )
        for item in data.ingredientes
    ]
    db.commit()
    db.refresh(receita)
    return serializar_receita(receita)


def deletar_receita(db: Session, receita_id: UUID) -> None:
    receita = _buscar_receita_ou_404(db, receita_id)
    db.delete(receita)
    db.commit()
