from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import Usuario
from app.schemas.favorite import FavoriteCreate, FavoriteOut
from app.services.favorite import favoritar, listar_favoritos, remover_favorito

router = APIRouter(prefix="/favorites", tags=["Favoritos"])


@router.post(
    "",
    response_model=FavoriteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Favoritar receita",
    description="Adiciona uma receita aos favoritos do usuário autenticado.",
)
def add_favorite(
    data: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> FavoriteOut:
    return favoritar(db, current_user.id, data.receita_id)


@router.get(
    "",
    response_model=list[FavoriteOut],
    summary="Listar favoritos",
    description="Retorna as receitas favoritas do usuário autenticado.",
)
def list_favorites(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[FavoriteOut]:
    return listar_favoritos(db, current_user.id)


@router.delete(
    "/{receita_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover favorito",
    description="Remove uma receita dos favoritos do usuário autenticado.",
)
def remove_favorite(
    receita_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    remover_favorito(db, current_user.id, receita_id)
