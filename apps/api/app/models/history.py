from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class Historico(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "historico"

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
    visualizado_em = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    receita = relationship("Receita")
