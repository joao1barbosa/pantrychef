from uuid import UUID

from pydantic import BaseModel, Field


class IngredientSearch(BaseModel):
    ingredientes: list[UUID] = Field(min_length=3)
