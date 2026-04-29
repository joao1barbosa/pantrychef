from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RecipeIngredientIn(BaseModel):
    ingrediente_id: UUID
    quantidade: str | None = None


class RecipeIngredientOut(BaseModel):
    ingrediente_id: UUID
    nome: str
    quantidade: str | None = None


class RecipeBase(BaseModel):
    nome: str = Field(min_length=1)
    modo_preparo: str = Field(min_length=1)
    categoria: str | None = None


class RecipeCreate(RecipeBase):
    ingredientes: list[RecipeIngredientIn] = Field(default_factory=list)


class RecipeOut(RecipeBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    criado_em: datetime
    ingredientes: list[RecipeIngredientOut] = Field(default_factory=list)
