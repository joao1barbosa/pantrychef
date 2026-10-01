import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RecipeForm } from '@/features/recipes/components/recipe-form'
import { buildRecipePayload } from '@/features/recipes/utils/recipe-schema'
import { mockIngredientes } from '@/mocks/handlers'

function renderForm(onSubmit = vi.fn()) {
  render(
    <RecipeForm
      ingredientes={mockIngredientes}
      isPending={false}
      error={null}
      submitLabel="Criar receita"
      pendingLabel="Criando..."
      onSubmit={onSubmit}
    />,
  )
  return onSubmit
}

describe('RecipeForm', () => {
  it('mostra erros de validação dos campos obrigatórios', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()
    await user.click(screen.getByRole('button', { name: 'Criar receita' }))
    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Selecione um ingrediente')).toBeInTheDocument()
    expect(screen.getByText('Modo de preparo é obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejeita tempo de preparo menor ou igual a zero', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Tempo (min)'), '0')
    await user.click(screen.getByRole('button', { name: 'Criar receita' }))
    expect(await screen.findByText('Tempo deve ser maior que 0')).toBeInTheDocument()
  })

  it('não oferece um ingrediente já escolhido em outra linha', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.selectOptions(screen.getByLabelText('Ingrediente 1'), 'ing-6')
    await user.click(screen.getByRole('button', { name: 'Adicionar ingrediente' }))
    const segunda = screen.getByLabelText('Ingrediente 2')
    expect([...(segunda as HTMLSelectElement).options].map((o) => o.value)).not.toContain('ing-6')
  })

  it('adiciona e remove linhas de ingredientes', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: 'Adicionar ingrediente' }))
    expect(screen.getByLabelText('Ingrediente 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remover ingrediente 2' }))
    expect(screen.queryByLabelText('Ingrediente 2')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover ingrediente 1' })).toBeDisabled()
  })

  it('envia os dados preenchidos', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()
    await user.type(screen.getByLabelText('Nome da receita'), 'Omelete')
    await user.type(screen.getByLabelText('Categoria'), 'Café da manhã')
    await user.type(screen.getByLabelText('Tempo (min)'), '15')
    await user.selectOptions(screen.getByLabelText('Dificuldade'), 'facil')
    await user.selectOptions(screen.getByLabelText('Ingrediente 1'), 'ing-6')
    await user.type(screen.getByLabelText('Quantidade 1'), '3')
    await user.type(screen.getByLabelText('Modo de preparo'), '1. Bata. 2. Frite.')
    await user.click(screen.getByRole('button', { name: 'Criar receita' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(buildRecipePayload(onSubmit.mock.calls[0][0])).toEqual({
      nome: 'Omelete',
      categoria: 'Café da manhã',
      tempo_preparo: 15,
      dificuldade: 'facil',
      modo_preparo: '1. Bata. 2. Frite.',
      ingredientes: [{ ingrediente_id: 'ing-6', quantidade: '3' }],
    })
  })
})
