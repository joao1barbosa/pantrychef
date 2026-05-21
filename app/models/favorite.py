from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class Favorito(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "favoritos"
    __table_args__ = (
        UniqueConstraint("usuario_id", "receita_id", name="uq_favoritos_usuario_receita"),
    )

    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    receita_id = Column(
        UUID(as_uuid=True),
        ForeignKey("receitas.id", ondelete="CASCADE"),
        nullable=False,
    )
    salvo_em = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    receita = relationship("Receita")
