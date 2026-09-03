import pytest
from sqlalchemy.exc import IntegrityError

from app.models.user import Usuario


def test_usuario_has_expected_columns():
    columns = Usuario.__table__.columns
    for name in ("id", "nome", "email", "senha_hash", "criado_em", "atualizado_em", "deletado_em"):
        assert name in columns


def test_email_is_unique():
    assert Usuario.__table__.columns["email"].unique is True


def test_persisted_user_gets_id_and_timestamps(db_session):
    user = Usuario(nome="Ana", email="ana@example.com", senha_hash="hash")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.criado_em is not None
    assert user.deletado_em is None


def test_duplicate_email_raises_integrity_error(db_session):
    db_session.add(Usuario(nome="A", email="dup@example.com", senha_hash="h1"))
    db_session.commit()

    db_session.add(Usuario(nome="B", email="dup@example.com", senha_hash="h2"))
    with pytest.raises(IntegrityError):
        db_session.commit()
