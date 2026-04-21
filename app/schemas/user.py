from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    nome: str = Field(min_length=1)
    email: EmailStr
    senha: str = Field(min_length=8)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nome: str
    email: EmailStr
    criado_em: datetime
