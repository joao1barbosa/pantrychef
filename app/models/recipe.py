from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import CreatedAtMixin, UUIDPrimaryKeyMixin


class Receita(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "receitas"

    nome = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True, index=True)
    modo_preparo = Column(Text, nullable=False)
    categoria = Column(String, nullable=True)
    usuario_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    itens = relationship(
        "ReceitaIngrediente",
        back_populates="receita",
        cascade="all, delete-orphan",
    )
    ingredientes = association_proxy("itens", "ingrediente")
