from sqlalchemy.orm import Session

from app.models.ingredient import Ingrediente
from app.utils.slug import slugify


def listar_ingredientes(db: Session) -> list[Ingrediente]:
    return db.query(Ingrediente).order_by(Ingrediente.nome).all()


def _formatar_nome(nome: str) -> str:
    nome = " ".join(nome.split())
    return nome[:1].upper() + nome[1:]


def get_or_create_ingrediente(db: Session, nome: str) -> Ingrediente:
    nome = _formatar_nome(nome)
    slug = slugify(nome)
    ingrediente = db.query(Ingrediente).filter(Ingrediente.slug == slug).first()
    if ingrediente is None:
        ingrediente = Ingrediente(nome=nome, slug=slug)
        db.add(ingrediente)
        db.flush()
    return ingrediente
