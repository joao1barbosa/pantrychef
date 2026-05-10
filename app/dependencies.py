from typing import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Usuario
from app.services.ai import generate_recipe
from app.services.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Não autorizado.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Usuario:
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
    except jwt.PyJWTError:
        raise credentials_exception

    if subject is None:
        raise credentials_exception

    user = (
        db.query(Usuario)
        .filter(Usuario.id == subject, Usuario.deletado_em.is_(None))
        .first()
    )
    if user is None:
        raise credentials_exception

    return user


def get_ai_generator() -> Callable[[list[str]], dict]:
    return generate_recipe
