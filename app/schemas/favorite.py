from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.recipe import RecipeOut


class FavoriteCreate(BaseModel):
    receita_id: UUID


class FavoriteOut(BaseModel):
    id: UUID
    salvo_em: datetime
    receita: RecipeOut
