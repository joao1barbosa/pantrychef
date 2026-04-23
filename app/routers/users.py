from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import Usuario
from app.schemas.user import UserCreate, UserOut
from app.services.user import create_user

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar usuário",
    description="Cria um novo usuário com e-mail único e senha protegida por hash.",
)
def register(data: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    return create_user(db, data)


@router.get(
    "/me",
    response_model=UserOut,
    summary="Obter perfil autenticado",
    description="Retorna os dados do usuário autenticado.",
)
def read_me(current_user: Usuario = Depends(get_current_user)) -> UserOut:
    return current_user
