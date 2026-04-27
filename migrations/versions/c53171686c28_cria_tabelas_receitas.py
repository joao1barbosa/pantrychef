"""cria tabelas receitas

Revision ID: c53171686c28
Revises: 56e963b08a58
Create Date: 2026-06-07 01:25:39.469228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c53171686c28'
down_revision: Union[str, Sequence[str], None] = '56e963b08a58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'receitas',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('modo_preparo', sa.Text(), nullable=False),
        sa.Column('categoria', sa.String(), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_receitas_slug'), 'receitas', ['slug'], unique=True)
    op.create_table(
        'receita_ingredientes',
        sa.Column('receita_id', sa.UUID(), nullable=False),
        sa.Column('ingrediente_id', sa.UUID(), nullable=False),
        sa.Column('quantidade', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['ingrediente_id'], ['ingredientes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['receita_id'], ['receitas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('receita_id', 'ingrediente_id'),
    )


def downgrade() -> None:
    op.drop_table('receita_ingredientes')
    op.drop_index(op.f('ix_receitas_slug'), table_name='receitas')
    op.drop_table('receitas')
