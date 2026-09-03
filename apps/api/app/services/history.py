from uuid import UUID

from sqlalchemy.orm import Session

from app.models.history import Historico
from app.services.recipe import serializar_receita


def registrar_visualizacao(db: Session, usuario_id: UUID, receita_id: UUID) -> None:
    ultimo = (
        db.query(Historico)
        .filter(Historico.usuario_id == usuario_id)
        .order_by(Historico.visualizado_em.desc())
        .first()
    )
    if ultimo is not None and ultimo.receita_id == receita_id:
        return
    db.add(Historico(usuario_id=usuario_id, receita_id=receita_id))
    db.commit()


def listar_historico(db: Session, usuario_id: UUID) -> list[dict]:
    registros = (
        db.query(Historico)
        .filter(Historico.usuario_id == usuario_id)
        .order_by(Historico.visualizado_em.desc())
        .all()
    )
    return [
        {
            "id": registro.id,
            "visualizado_em": registro.visualizado_em,
            "receita": serializar_receita(registro.receita),
        }
        for registro in registros
    ]
