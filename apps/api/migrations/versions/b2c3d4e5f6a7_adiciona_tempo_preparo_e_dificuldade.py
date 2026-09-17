"""adiciona tempo_preparo e dificuldade

Revision ID: b2c3d4e5f6a7
Revises: a1f2c3d4e5b6
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1f2c3d4e5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('receitas', sa.Column('tempo_preparo', sa.Integer(), nullable=True))
    op.add_column('receitas', sa.Column('dificuldade', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('receitas', 'dificuldade')
    op.drop_column('receitas', 'tempo_preparo')
