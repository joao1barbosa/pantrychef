"""cria tabela favoritos

Revision ID: 5d6497d1018f
Revises: 52aa982a729f
Create Date: 2026-06-07 01:48:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5d6497d1018f'
down_revision: Union[str, Sequence[str], None] = '52aa982a729f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'favoritos',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('usuario_id', sa.UUID(), nullable=False),
        sa.Column('receita_id', sa.UUID(), nullable=False),
        sa.Column('salvo_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['receita_id'], ['receitas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('usuario_id', 'receita_id', name='uq_favoritos_usuario_receita'),
    )
    op.create_index(op.f('ix_favoritos_usuario_id'), 'favoritos', ['usuario_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_favoritos_usuario_id'), table_name='favoritos')
    op.drop_table('favoritos')
