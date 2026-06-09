from typing import Callable
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_ai_generator, get_current_user, get_optional_user
from app.models.user import Usuario
from app.schemas.recipe import RecipeCreate, RecipeOut
from app.schemas.search import IngredientSearch
from app.services.history import registrar_visualizacao
from app.services.recipe import (
    atualizar_receita,
    buscar_com_fallback_ia,
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
    description="Cadastra uma nova receita, vinculada ao usuário autenticado.",
)
def create_recipe(
    data: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> RecipeOut:
    return criar_receita(db, data, current_user.id)


@router.get(
    "",
    response_model=list[RecipeOut],
    summary="Listar receitas",
    description="Lista receitas, com filtros opcionais por nome e categoria.",
)
def list_recipes(
    nome: str | None = None,
    categoria: str | None = None,
    db: Session = Depends(get_db),
) -> list[RecipeOut]:
    return listar_receitas(db, nome=nome, categoria=categoria)


@router.post(
    "/search",
    response_model=list[RecipeOut],
    summary="Buscar receitas por ingredientes",
    description="Retorna receitas preparáveis com os ingredientes informados (mínimo de 3).",
)
def search_recipes(
    data: IngredientSearch,
    db: Session = Depends(get_db),
    gerar: Callable[[list[str]], dict] = Depends(get_ai_generator),
) -> list[RecipeOut]:
    return buscar_com_fallback_ia(db, data.ingredientes, gerar)


@router.get(
    "/{receita_id}",
    response_model=RecipeOut,
    summary="Obter receita",
    description="Retorna uma receita específica pelo seu identificador.",
)
def get_recipe(
    receita_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario | None = Depends(get_optional_user),
) -> RecipeOut:
    receita = obter_receita(db, receita_id)
    if current_user is not None:
        registrar_visualizacao(db, current_user.id, receita_id)
    return receita


@router.put(
    "/{receita_id}",
    response_model=RecipeOut,
    summary="Atualizar receita",
    description="Atualiza uma receita existente (apenas o usuário que a criou).",
)
def update_recipe(
    receita_id: UUID,
    data: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> RecipeOut:
    return atualizar_receita(db, receita_id, data, current_user.id)


@router.delete(
    "/{receita_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover receita",
    description="Remove uma receita existente (apenas o usuário que a criou).",
)
def delete_recipe(
    receita_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    deletar_receita(db, receita_id, current_user.id)
