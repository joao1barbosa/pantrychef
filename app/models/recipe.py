from sqlalchemy import Column, String, Text
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

    itens = relationship(
        "ReceitaIngrediente",
        back_populates="receita",
        cascade="all, delete-orphan",
    )
    ingredientes = association_proxy("itens", "ingrediente")
