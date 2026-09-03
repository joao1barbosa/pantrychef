from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ingredient import IngredientOut
from app.services.ingredient import listar_ingredientes

router = APIRouter(prefix="/ingredients", tags=["Ingredientes"])


@router.get(
    "",
    response_model=list[IngredientOut],
    summary="Listar ingredientes",
    description="Retorna todos os ingredientes disponíveis para busca de receitas.",
)
def list_ingredients(db: Session = Depends(get_db)) -> list[IngredientOut]:
    return listar_ingredientes(db)
