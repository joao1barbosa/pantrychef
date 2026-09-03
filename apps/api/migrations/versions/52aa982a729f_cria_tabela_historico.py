"""cria tabela historico

Revision ID: 52aa982a729f
Revises: c53171686c28
Create Date: 2026-06-07 01:44:31.392752

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '52aa982a729f'
down_revision: Union[str, Sequence[str], None] = 'c53171686c28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'historico',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('usuario_id', sa.UUID(), nullable=False),
        sa.Column('receita_id', sa.UUID(), nullable=False),
        sa.Column('visualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['receita_id'], ['receitas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_historico_usuario_id'), 'historico', ['usuario_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_historico_usuario_id'), table_name='historico')
    op.drop_table('historico')
