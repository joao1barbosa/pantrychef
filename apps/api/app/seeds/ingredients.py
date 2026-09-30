from sqlalchemy.orm import Session

from app.services.ingredient import get_or_create_ingrediente

INGREDIENTES = [
    # Temperos e condimentos
    "Sal",
    "Açúcar",
    "Pimenta do Reino",
    "Alho",
    "Cebola",
    "Cebolinha",
    "Salsinha",
    "Coentro",
    "Louro",
    "Orégano",
    "Manjericão",
    "Alecrim",
    "Tomilho",
    "Cominho",
    "Páprica",
    "Açafrão",
    "Gengibre",
    "Noz-moscada",
    "Canela",
    "Cravo",
    "Colorau",
    "Caldo de Galinha",
    "Caldo de Legumes",
    "Molho de Soja",
    "Vinagre",
    "Limão",
    "Mostarda",
    "Ketchup",
    "Maionese",

    # Gorduras e óleos
    "Azeite",
    "Manteiga",
    "Margarina",
    "Óleo de Soja",
    "Óleo de Coco",
    "Azeite de Dendê",
    "Banha",

    # Proteínas - carnes
    "Frango",
    "Carne Moída",
    "Carne de Sol",
    "Linguiça Calabresa",
    "Bacon",
    "Costela",
    "Filé de Frango",
    "Coxa de Frango",
    "Sobrecoxa",
    "Carne Seca",
    "Peixe",
    "Camarão",
    "Atum em Lata",
    "Sardinha em Lata",
    "Ovo",

    # Laticínios
    "Leite",
    "Queijo",
    "Queijo Mussarela",
    "Queijo Parmesão",
    "Queijo Prato",
    "Queijo Coalho",
    "Requeijão",
    "Creme de Leite",
    "Leite Condensado",
    "Iogurte",
    "Manteiga",

    # Grãos, cereais e farinhas
    "Arroz",
    "Feijão",
    "Feijão Preto",
    "Feijão Carioca",
    "Lentilha",
    "Grão-de-bico",
    "Macarrão",
    "Macarrão Espaguete",
    "Macarrão Parafuso",
    "Farinha de Trigo",
    "Farinha de Mandioca",
    "Farinha de Rosca",
    "Fubá",
    "Polvilho",
    "Goma de Tapioca",
    "Aveia",
    "Quinoa",
    "Couscous",

    # Legumes e verduras
    "Tomate",
    "Batata",
    "Batata Doce",
    "Cenoura",
    "Pimentão",
    "Pimentão Verde",
    "Pimentão Vermelho",
    "Abobrinha",
    "Berinjela",
    "Abóbora",
    "Chuchu",
    "Pepino",
    "Alface",
    "Rúcula",
    "Couve",
    "Espinafre",
    "Brócolis",
    "Couve-flor",
    "Repolho",
    "Vagem",
    "Ervilha",
    "Milho",
    "Mandioca",
    "Mandioquinha",
    "Inhame",
    "Cará",

    # Frutas
    "Banana",
    "Maçã",
    "Laranja",
    "Limão",
    "Manga",
    "Abacaxi",
    "Morango",
    "Goiaba",
    "Maracujá",
    "Coco",
    "Leite de Coco",
    "Açaí",
    "Abacate",
    "Melancia",
    "Melão",
    "Uva",
    "Pêssego",
    "Ameixa",

    # Oleaginosas e sementes
    "Castanha de Caju",
    "Amendoim",
    "Pasta de Amendoim",
    "Gergelim",
    "Linhaça",
    "Chia",

    # Outros
    "Açúcar Mascavo",
    "Mel",
    "Chocolate em Pó",
    "Chocolate Meio Amargo",
    "Café",
    "Chá",
    "Fermento Biológico",
    "Fermento em Pó",
    "Bicarbonato de Sódio",
    "Gelatina",
    "Amido de Milho",
    "Azeitona",
    "Alcaparra",
    "Palmito",
    "Ervilha em Lata",
    "Milho em Lata",
    "Tomate Pelado",
    "Molho de Tomate",
    "Extrato de Tomate",
    "Pão Francês",
    "Pão de Forma",
    "Biscoito Cream Cracker",
    "Torrada",
]


def seed_ingredientes(db: Session) -> None:
    for nome in INGREDIENTES:
        get_or_create_ingrediente(db, nome)
    db.commit()


def main() -> None:
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        seed_ingredientes(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
