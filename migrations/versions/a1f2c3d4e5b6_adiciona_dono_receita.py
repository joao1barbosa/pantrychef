"""adiciona dono da receita

Revision ID: a1f2c3d4e5b6
Revises: 5d6497d1018f
Create Date: 2026-06-09 16:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1f2c3d4e5b6'
down_revision: Union[str, Sequence[str], None] = '5d6497d1018f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('receitas', sa.Column('usuario_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_receitas_usuario_id'), 'receitas', ['usuario_id'], unique=False)
    op.create_foreign_key(
        'fk_receitas_usuario_id',
        'receitas',
        'usuarios',
        ['usuario_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_receitas_usuario_id', 'receitas', type_='foreignkey')
    op.drop_index(op.f('ix_receitas_usuario_id'), table_name='receitas')
    op.drop_column('receitas', 'usuario_id')
