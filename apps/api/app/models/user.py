from sqlalchemy import JSON, Column, DateTime, String
from sqlalchemy.sql import func, text

from app.database import Base
from app.models.mixins import CreatedAtMixin, UUIDPrimaryKeyMixin


class Usuario(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "usuarios"

    nome = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    senha_hash = Column(String, nullable=False)
    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deletado_em = Column(DateTime(timezone=True), nullable=True)
    categorias_favoritas = Column(
        JSON, nullable=False, default=list, server_default=text("'[]'::json")
    )
    restricoes_alimentares = Column(
        JSON, nullable=False, default=list, server_default=text("'[]'::json")
    )
