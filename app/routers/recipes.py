from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.recipe import RecipeCreate, RecipeOut
from app.services.recipe import (
    atualizar_receita,
    criar_receita,
    deletar_receita,
    listar_receitas,
    obter_receita,
)

router = APIRouter(prefix="/recipes", tags=["Receitas"])


@router.post(
    "",
    response_model=RecipeOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar receita",
    description="Cadastra uma nova receita com seus ingredientes e quantidades.",
)
def create_recipe(data: RecipeCreate, db: Session = Depends(get_db)) -> RecipeOut:
    return criar_receita(db, data)


@router.get(
    "",
    response_model=list[RecipeOut],
    summary="Listar receitas",
    description="Retorna todas as receitas cadastradas.",
)
def list_recipes(db: Session = Depends(get_db)) -> list[RecipeOut]:
    return listar_receitas(db)


@router.get(
    "/{receita_id}",
    response_model=RecipeOut,
    summary="Obter receita",
    description="Retorna uma receita específica pelo seu identificador.",
)
def get_recipe(receita_id: UUID, db: Session = Depends(get_db)) -> RecipeOut:
    return obter_receita(db, receita_id)


@router.put(
    "/{receita_id}",
    response_model=RecipeOut,
    summary="Atualizar receita",
    description="Atualiza os dados e ingredientes de uma receita existente.",
)
def update_recipe(
    receita_id: UUID, data: RecipeCreate, db: Session = Depends(get_db)
) -> RecipeOut:
    return atualizar_receita(db, receita_id, data)


@router.delete(
    "/{receita_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover receita",
    description="Remove uma receita existente pelo seu identificador.",
)
def delete_recipe(receita_id: UUID, db: Session = Depends(get_db)) -> None:
    deletar_receita(db, receita_id)
