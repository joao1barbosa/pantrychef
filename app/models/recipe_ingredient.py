from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ReceitaIngrediente(Base):
    __tablename__ = "receita_ingredientes"

    receita_id = Column(
        UUID(as_uuid=True),
        ForeignKey("receitas.id", ondelete="CASCADE"),
        primary_key=True,
    )
    ingrediente_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ingredientes.id", ondelete="CASCADE"),
        primary_key=True,
    )
    quantidade = Column(String, nullable=True)

    receita = relationship("Receita", back_populates="itens")
    ingrediente = relationship("Ingrediente")
