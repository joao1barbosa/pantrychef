import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { RecipeDetailPage } from '@/features/recipes/pages/recipe-detail-page'
import { API_URL } from '@/lib/api'
import { mockFavorites } from '@/mocks/handlers'
import { server } from '@/mocks/server'
import { logar, renderComRotas } from './utils'

function renderDetalhe(id: string) {
  return renderComRotas(<RecipeDetailPage />, {
    rota: `/recipes/${id}`,
    caminho: '/recipes/:id',
    extras: ['/login', '/recipes', '/recipes/:id/edit'],
  })
}

describe('RecipeDetailPage', () => {
  it('mostra a receita com ingredientes e passos', async () => {
    renderDetalhe('receita-2')
    expect(await screen.findByRole('heading', { name: 'Molho de Tomate' })).toBeInTheDocument()
    expect(screen.getByText('Tomate')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(2)
  })

  it('reconhece receita já favoritada (usa receita_id) e permite desfavoritar', async () => {
    logar()
    let removido = ''
    server.use(
      http.delete(`${API_URL}/favorites/:id`, ({ params }) => {
        removido = String(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDetalhe(mockFavorites[0].receita_id)
    const botao = await screen.findByRole('button', { name: 'Favoritada' })
    expect(botao).toHaveAttribute('aria-pressed', 'true')
    await user.click(botao)
    await waitFor(() => expect(removido).toBe('receita-1'))
  })

  it('autor vê editar e excluir; excluir pede confirmação', async () => {
    logar()
    let excluida = false
    server.use(
      http.delete(`${API_URL}/recipes/:id`, () => {
        excluida = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDetalhe('receita-1')
    expect(await screen.findByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/recipes/receita-1/edit',
    )
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    const dialogo = screen.getByRole('alertdialog')
    expect(dialogo).toHaveTextContent('Excluir receita?')
    await user.click(within(dialogo).getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(excluida).toBe(true))
    expect(await screen.findByText('rota:/recipes')).toBeInTheDocument()
  })

  it('quem não é autor não vê editar/excluir', async () => {
    logar()
    renderDetalhe('receita-2')
    await screen.findByRole('heading', { name: 'Molho de Tomate' })
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument(),
    )
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
  })

  it('visitante que tenta favoritar vai para o login', async () => {
    const user = userEvent.setup()
    renderDetalhe('receita-2')
    await user.click(await screen.findByRole('button', { name: 'Favoritar' }))
    expect(await screen.findByText('rota:/login')).toBeInTheDocument()
  })

  it('compartilha pelo WhatsApp e copia o link', async () => {
    const user = userEvent.setup()
    renderDetalhe('receita-2')
    await user.click(await screen.findByRole('button', { name: 'Compartilhar' }))
    expect(screen.getByRole('menuitem', { name: 'WhatsApp' }).getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\/\?text=/,
    )
    await user.click(screen.getByRole('menuitem', { name: 'Copiar link' }))
    expect(await screen.findByRole('button', { name: 'Link copiado!' })).toBeInTheDocument()
  })

  it('mostra "Receita não encontrada" para 404 e para id inválido (422)', async () => {
    server.use(
      http.get(`${API_URL}/recipes/abc`, () => HttpResponse.json({ detail: [] }, { status: 422 })),
    )
    renderDetalhe('nao-existe')
    expect(
      await screen.findByRole('heading', { name: 'Receita não encontrada' }),
    ).toBeInTheDocument()
  })
})
