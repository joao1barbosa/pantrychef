from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

NonEmptyStr = Annotated[str, Field(min_length=1)]


class UserBase(BaseModel):
    nome: str = Field(min_length=1)
    email: EmailStr


class UserCreate(UserBase):
    senha: str = Field(min_length=8)


class UserUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1)
    senha: str | None = Field(default=None, min_length=8)


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    criado_em: datetime


class PreferencesBase(BaseModel):
    categorias_favoritas: list[NonEmptyStr] = Field(default_factory=list)
    restricoes_alimentares: list[NonEmptyStr] = Field(default_factory=list)


class PreferencesCreate(PreferencesBase):
    pass


class PreferencesUpdate(BaseModel):
    categorias_favoritas: list[NonEmptyStr] | None = None
    restricoes_alimentares: list[NonEmptyStr] | None = None


class PreferencesResponse(PreferencesBase):
    model_config = ConfigDict(from_attributes=True)
