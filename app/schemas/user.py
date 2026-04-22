from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    nome: str = Field(min_length=1)
    email: EmailStr


class UserCreate(UserBase):
    senha: str = Field(min_length=8)


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    criado_em: datetime
