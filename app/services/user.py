from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import Usuario
from app.schemas.user import UserCreate
from app.services.security import hash_password


def create_user(db: Session, data: UserCreate) -> Usuario:
    existing = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="E-mail já cadastrado.",
        )

    user = Usuario(
        nome=data.nome,
        email=data.email,
        senha_hash=hash_password(data.senha),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
