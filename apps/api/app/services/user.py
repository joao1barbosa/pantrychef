from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user import Usuario
from app.schemas.user import PreferencesUpdate, UserCreate, UserUpdate
from app.services.security import hash_password, verify_password


def _email_em_uso(db: Session, email: str, exceto_id=None) -> bool:
    query = db.query(Usuario).filter(func.lower(Usuario.email) == email.lower())
    if exceto_id is not None:
        query = query.filter(Usuario.id != exceto_id)
    return query.first() is not None


def _erro_email_em_uso() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="E-mail já cadastrado.",
    )


def create_user(db: Session, data: UserCreate) -> Usuario:
    if _email_em_uso(db, data.email):
        raise _erro_email_em_uso()

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
        .filter(
            func.lower(Usuario.email) == email.strip().lower(),
            Usuario.deletado_em.is_(None),
        )
        .first()
    )
    if user is None or not verify_password(senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def update_user(db: Session, user: Usuario, data: UserUpdate) -> Usuario:
    if data.nome is not None:
        user.nome = data.nome
    if data.email is not None and data.email != user.email.lower():
        if _email_em_uso(db, data.email, exceto_id=user.id):
            raise _erro_email_em_uso()
        user.email = data.email
    if data.senha is not None:
        user.senha_hash = hash_password(data.senha)
    db.commit()
    db.refresh(user)
    return user


def soft_delete_user(db: Session, user: Usuario) -> None:
    user.deletado_em = datetime.now(timezone.utc)
    db.commit()


def get_preferences(db: Session, user: Usuario) -> Usuario:
    db.refresh(user)
    return user


def update_preferences(
    db: Session, user: Usuario, data: PreferencesUpdate
) -> Usuario:
    if data.categorias_favoritas is not None:
        user.categorias_favoritas = data.categorias_favoritas
    if data.restricoes_alimentares is not None:
        user.restricoes_alimentares = data.restricoes_alimentares
    db.commit()
    db.refresh(user)
    return user
