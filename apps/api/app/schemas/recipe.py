from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

Dificuldade = Literal["facil", "medio", "dificil"]
Ordenacao = Literal["tempo_asc", "tempo_desc", "nome_asc", "nome_desc", "recentes", "populares"]


class RecipeIngredientIn(BaseModel):
    ingrediente_id: UUID
    quantidade: str | None = Field(default=None, max_length=60)


class RecipeIngredientOut(BaseModel):
    ingrediente_id: UUID
    nome: str
    quantidade: str | None = None


class RecipeBase(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    modo_preparo: str = Field(min_length=1, max_length=10000)
    categoria: str | None = Field(default=None, max_length=60)
    tempo_preparo: int | None = Field(default=None, gt=0, le=1440)
    dificuldade: Dificuldade | None = None


class RecipeCreate(RecipeBase):
    ingredientes: list[RecipeIngredientIn] = Field(default_factory=list, max_length=50)

    @field_validator("ingredientes")
    @classmethod
    def ingredientes_sem_repeticao(
        cls, ingredientes: list[RecipeIngredientIn]
    ) -> list[RecipeIngredientIn]:
        ids = [item.ingrediente_id for item in ingredientes]
        if len(ids) != len(set(ids)):
            raise ValueError("Cada ingrediente só pode aparecer uma vez na receita.")
        return ingredientes


class RecipeOut(RecipeBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    usuario_id: UUID | None = None
    gerada_por_ia: bool = False
    criado_em: datetime
    ingredientes: list[RecipeIngredientOut] = Field(default_factory=list)
