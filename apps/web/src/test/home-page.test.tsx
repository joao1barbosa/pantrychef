import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { HomePage } from '@/features/recipes/pages/home-page'
import { sugerirIngredientes } from '@/features/recipes/utils/ingredientes'
import { API_URL } from '@/lib/api'
import { mockIngredientes, mockReceitas } from '@/mocks/handlers'
import { server } from '@/mocks/server'
import { renderComRotas } from './utils'

function renderHome(rota = '/') {
  return renderComRotas(<HomePage />, { rota })
}

async function adicionar(user: ReturnType<typeof userEvent.setup>, texto: string) {
  const campo = screen.getByRole('combobox')
  await user.type(campo, texto)
  await user.keyboard('{Enter}')
}

describe('sugerirIngredientes', () => {
  it('prioriza nomes que começam com o termo e ignora acentos', () => {
    const nomes = sugerirIngredientes(mockIngredientes, 'TOMATE', []).map((i) => i.nome)
    expect(nomes).toEqual(['Tomate', 'Extrato de Tomate'])
  })

  it('não sugere ingredientes já escolhidos', () => {
    const nomes = sugerirIngredientes(mockIngredientes, 'tomate', [
      { nome: 'Tomate', conhecido: true },
    ])
    expect(nomes.map((i) => i.nome)).toEqual(['Extrato de Tomate'])
  })
})

describe('HomePage (busca de receitas)', () => {
  it('exige ao menos 3 ingredientes para buscar', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => expect(screen.getByRole('combobox')).toBeEnabled())
    await adicionar(user, 'ovo')
    expect(screen.getByRole('button', { name: 'Buscar receitas' })).toBeDisabled()
    expect(screen.getByText('Falta 2 ingredientes para buscar.')).toBeInTheDocument()
  })

  it('Enter escolhe o ingrediente com nome exato, não o primeiro que contém o texto', async () => {
    const user = userEvent.setup()
    renderHome()
    await screen.findByRole('combobox')
    await user.type(screen.getByRole('combobox'), 'tom')
    await screen.findByRole('option', { name: /Extrato de Tomate/ })
    await user.clear(screen.getByRole('combobox'))
    await adicionar(user, 'tomate')

    const chips = screen.getByRole('list', { name: 'Ingredientes selecionados' })
    expect(within(chips).getByText('Tomate')).toBeInTheDocument()
    expect(within(chips).queryByText('Extrato de Tomate')).not.toBeInTheDocument()
  })

  it('navega pelas sugestões com o teclado', async () => {
    const user = userEvent.setup()
    renderHome()
    await screen.findByRole('combobox')
    await user.type(screen.getByRole('combobox'), 'tom')
    await screen.findByRole('option', { name: /Extrato de Tomate/ })
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    const chips = screen.getByRole('list', { name: 'Ingredientes selecionados' })
    expect(within(chips).getByText('Extrato de Tomate')).toBeInTheDocument()
  })

  it('busca e exibe os resultados', async () => {
    const user = userEvent.setup()
    let corpo: unknown
    server.use(
      http.post(`${API_URL}/recipes/search-by-name`, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json(mockReceitas)
      }),
    )
    renderHome()
    await screen.findByRole('combobox')
    for (const nome of ['ovo', 'queijo', 'cebola']) await adicionar(user, nome)
    await user.click(screen.getByRole('button', { name: 'Buscar receitas' }))

    expect(await screen.findByRole('link', { name: 'Omelete de Queijo' })).toHaveAttribute(
      'href',
      '/recipes/receita-1',
    )
    expect(screen.getByText('2 receitas')).toBeInTheDocument()
    expect(corpo).toEqual({ ingredientes: ['Ovo', 'Queijo', 'Cebola'] })
  })

  it('restaura a busca a partir da URL (voltar de uma receita)', async () => {
    renderHome('/?i=Ovo&i=Queijo&i=Cebola')
    expect(await screen.findByRole('link', { name: 'Molho de Tomate' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: 'Ingredientes selecionados' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(3)
  })

  it('indica quando a receita foi criada pela IA', async () => {
    server.use(
      http.post(`${API_URL}/recipes/search-by-name`, () =>
        HttpResponse.json([
          { ...mockReceitas[1], id: 'ia-1', nome: 'Receita IA', gerada_por_ia: true },
        ]),
      ),
    )
    renderHome('/?i=a&i=b&i=c')
    expect(await screen.findByText(/a IA criou esta para você/)).toBeInTheDocument()
    expect(screen.getByText('Criada pela IA')).toBeInTheDocument()
  })

  it('mostra mensagem do backend quando a IA está indisponível (503)', async () => {
    server.use(
      http.post(`${API_URL}/recipes/search-by-name`, () =>
        HttpResponse.json({ detail: 'Serviço de IA indisponível no momento.' }, { status: 503 }),
      ),
    )
    renderHome('/?i=a&i=b&i=c')
    expect(await screen.findByText('Serviço de IA indisponível no momento.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('filtra resultados por dificuldade', async () => {
    const user = userEvent.setup()
    renderHome('/?i=a&i=b&i=c')
    await screen.findByRole('link', { name: 'Omelete de Queijo' })
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.click(screen.getByRole('button', { name: 'Média' }))
    expect(screen.queryByRole('link', { name: 'Omelete de Queijo' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Molho de Tomate' })).toBeInTheDocument()
  })
})
