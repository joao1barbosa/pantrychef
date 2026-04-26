from sqlalchemy.orm import Session

from app.services.ingredient import get_or_create_ingrediente

INGREDIENTES = [
    "Tomate",
    "Cebola",
    "Alho",
    "Frango",
    "Arroz",
    "Feijão",
    "Batata",
    "Cenoura",
    "Ovo",
    "Leite",
    "Queijo",
    "Macarrão",
    "Carne Moída",
    "Pimentão",
    "Azeite",
    "Manteiga",
    "Farinha de Trigo",
    "Açúcar",
    "Sal",
    "Pimenta do Reino",
]


def seed_ingredientes(db: Session) -> None:
    for nome in INGREDIENTES:
        get_or_create_ingrediente(db, nome)
    db.commit()
