from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.favorite import Favorito
from app.services.recipe import _buscar_receita_ou_404, serializar_receita


def _serializar_favorito(favorito: Favorito) -> dict:
    return {
        "id": favorito.id,
        "salvo_em": favorito.salvo_em,
        "receita": serializar_receita(favorito.receita),
    }


def favoritar(db: Session, usuario_id: UUID, receita_id: UUID) -> dict:
    _buscar_receita_ou_404(db, receita_id)
    favorito = (
        db.query(Favorito)
        .filter(
            Favorito.usuario_id == usuario_id,
            Favorito.receita_id == receita_id,
        )
        .first()
    )
    if favorito is None:
        favorito = Favorito(usuario_id=usuario_id, receita_id=receita_id)
        db.add(favorito)
        db.commit()
        db.refresh(favorito)
    return _serializar_favorito(favorito)


def remover_favorito(db: Session, usuario_id: UUID, receita_id: UUID) -> None:
    favorito = (
        db.query(Favorito)
        .filter(
            Favorito.usuario_id == usuario_id,
            Favorito.receita_id == receita_id,
        )
        .first()
    )
    if favorito is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorito não encontrado.",
        )
    db.delete(favorito)
    db.commit()


def listar_favoritos(db: Session, usuario_id: UUID) -> list[dict]:
    favoritos = (
        db.query(Favorito)
        .filter(Favorito.usuario_id == usuario_id)
        .order_by(Favorito.salvo_em.desc())
        .all()
    )
    return [_serializar_favorito(favorito) for favorito in favoritos]
