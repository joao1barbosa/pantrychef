from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import Usuario
from app.schemas.history import HistoryOut
from app.services.history import listar_historico

router = APIRouter(prefix="/history", tags=["Histórico"])


@router.get(
    "",
    response_model=list[HistoryOut],
    summary="Listar histórico",
    description="Retorna as receitas visualizadas pelo usuário autenticado.",
)
def list_history(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[HistoryOut]:
    return listar_historico(db, current_user.id)
