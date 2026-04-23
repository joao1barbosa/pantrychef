from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import Usuario
from app.schemas.user import UserCreate
from app.services.security import hash_password, verify_password


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


def authenticate_user(db: Session, email: str, senha: str) -> Usuario:
    user = (
        db.query(Usuario)
        .filter(Usuario.email == email, Usuario.deletado_em.is_(None))
        .first()
    )
    if user is None or not verify_password(senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
