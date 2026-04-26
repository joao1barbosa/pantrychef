"""cria tabela ingredientes

Revision ID: 56e963b08a58
Revises: 3bb9f0feaa8e
Create Date: 2026-06-07 01:23:37.536790

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '56e963b08a58'
down_revision: Union[str, Sequence[str], None] = '3bb9f0feaa8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ingredientes',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_ingredientes_slug'), 'ingredientes', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_ingredientes_slug'), table_name='ingredientes')
    op.drop_table('ingredientes')
