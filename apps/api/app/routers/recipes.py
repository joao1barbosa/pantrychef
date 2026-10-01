from typing import Callable
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    get_ai_generator,
    get_ai_validator,
    get_current_user,
    get_optional_user,
    limitar_ia,
)
from app.models.user import Usuario
from app.schemas.recipe import Dificuldade, Ordenacao, RecipeCreate, RecipeOut
from app.schemas.search import IngredientSearch, IngredientSearchByName
from app.services.history import registrar_visualizacao
from app.services.recipe import (
    atualizar_receita,
    buscar_com_fallback_ia,
    buscar_por_nomes,
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
    description=(
        "Lista receitas, com filtros opcionais por nome, categoria, "
        "tempo de preparo, dificuldade e ordenação, com paginação via limit/offset."
    ),
)
def list_recipes(
    nome: str | None = Query(default=None, max_length=120),
    categoria: str | None = Query(default=None, max_length=60),
    tempo_min: int | None = Query(default=None, gt=0),
    tempo_max: int | None = Query(default=None, gt=0),
    dificuldade: Dificuldade | None = None,
    ordenacao: Ordenacao | None = None,
    limit: int | None = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[RecipeOut]:
    if tempo_min is not None and tempo_max is not None and tempo_max < tempo_min:
        raise HTTPException(
            status_code=422, detail="tempo_max deve ser maior ou igual a tempo_min."
        )
    return listar_receitas(
        db,
        nome=nome,
        categoria=categoria,
        tempo_min=tempo_min,
        tempo_max=tempo_max,
        dificuldade=dificuldade,
        ordenacao=ordenacao,
        limite=limit,
        deslocamento=offset,
    )


@router.post(
    "/search",
    response_model=list[RecipeOut],
    summary="Buscar receitas por ingredientes",
    description="Retorna receitas preparáveis com os ingredientes informados (mínimo de 3).",
    dependencies=[Depends(limitar_ia)],
)
def search_recipes(
    data: IngredientSearch,
    db: Session = Depends(get_db),
    gerar: Callable[[list[str]], dict] = Depends(get_ai_generator),
) -> list[RecipeOut]:
    return buscar_com_fallback_ia(db, data.ingredientes, gerar)


@router.post(
    "/search-by-name",
    response_model=list[RecipeOut],
    summary="Buscar receitas por nomes de ingredientes",
    description=(
        "Aceita nomes de ingredientes em texto livre. Nomes já cadastrados são usados "
        "diretamente; apenas os desconhecidos são validados via IA."
    ),
    dependencies=[Depends(limitar_ia)],
)
def search_recipes_by_name(
    data: IngredientSearchByName,
    db: Session = Depends(get_db),
    gerar: Callable[[list[str]], dict] = Depends(get_ai_generator),
    validar: Callable[[list[str]], dict] = Depends(get_ai_validator),
) -> list[RecipeOut]:
    return buscar_por_nomes(db, data.ingredientes, gerar, validar)


@router.get(
    "/{receita_id}",
    response_model=RecipeOut,
    summary="Obter receita",
    description="Retorna uma receita específica pelo seu identificador.",
)
def get_recipe(
    receita_id: UUID,
    registrar: bool = Query(
        default=True,
        description="Quando falso, não registra a visualização no histórico.",
    ),
    db: Session = Depends(get_db),
    current_user: Usuario | None = Depends(get_optional_user),
) -> RecipeOut:
    receita = obter_receita(db, receita_id)
    if current_user is not None and registrar:
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
