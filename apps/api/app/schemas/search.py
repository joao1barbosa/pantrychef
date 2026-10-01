from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field, StringConstraints

NomeIngrediente = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)
]


class IngredientSearch(BaseModel):
    ingredientes: list[UUID] = Field(min_length=3, max_length=20)


class IngredientSearchByName(BaseModel):
    ingredientes: list[NomeIngrediente] = Field(min_length=3, max_length=10)
