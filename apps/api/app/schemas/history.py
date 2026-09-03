from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.recipe import RecipeOut


class HistoryOut(BaseModel):
    id: UUID
    visualizado_em: datetime
    receita: RecipeOut
