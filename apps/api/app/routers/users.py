from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import Usuario
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.user import create_user, soft_delete_user, update_user

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


@router.patch(
    "/me",
    response_model=UserOut,
    summary="Atualizar perfil",
    description="Atualiza nome e/ou senha do usuário autenticado.",
)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> UserOut:
    return update_user(db, current_user, data)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir conta",
    description="Realiza a exclusão lógica (soft delete) do usuário autenticado.",
)
def delete_me(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    soft_delete_user(db, current_user)
