from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

NonEmptyStr = Annotated[str, Field(min_length=1, max_length=50)]
EmailNormalizado = Annotated[EmailStr, AfterValidator(lambda email: email.strip().lower())]
SENHA_MIN = 8


class UserBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    email: EmailNormalizado


class UserCreate(UserBase):
    senha: str = Field(min_length=SENHA_MIN, max_length=128)


class UserUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailNormalizado | None = None
    senha: str | None = Field(default=None, min_length=SENHA_MIN, max_length=128)


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
    categorias_favoritas: list[NonEmptyStr] | None = Field(default=None, max_length=20)
    restricoes_alimentares: list[NonEmptyStr] | None = Field(default=None, max_length=20)


class PreferencesResponse(PreferencesBase):
    model_config = ConfigDict(from_attributes=True)
