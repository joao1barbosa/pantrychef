from sqlalchemy import Column, String

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class Ingrediente(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ingredientes"

    nome = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True, index=True)
