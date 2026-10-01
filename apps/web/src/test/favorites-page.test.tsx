import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { FavoritesPage } from '@/features/favorites/pages/favorites-page'
import { API_URL } from '@/lib/api'
import { server } from '@/mocks/server'
import { logar, renderComRotas } from './utils'

function renderFavoritos() {
  logar()
  return renderComRotas(<FavoritesPage />, {
    rota: '/favorites',
    caminho: '/favorites',
    extras: ['/'],
  })
}

describe('FavoritesPage', () => {
  it('lista os favoritos com dados reais da receita', async () => {
    renderFavoritos()
    expect(await screen.findByRole('link', { name: 'Omelete de Queijo' })).toHaveAttribute(
      'href',
      '/recipes/receita-1',
    )
    expect(screen.getByText('1 receita salva')).toBeInTheDocument()
    expect(screen.getByText('10 min')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Café da manhã/ })).toBeInTheDocument()
  })

  it('mostra estado vazio', async () => {
    server.use(http.get(`${API_URL}/favorites`, () => HttpResponse.json([])))
    renderFavoritos()
    expect(await screen.findByText('Nenhuma receita salva ainda')).toBeInTheDocument()
  })

  it('remove com opção de desfazer', async () => {
    const user = userEvent.setup()
    renderFavoritos()
    await user.click(
      await screen.findByRole('button', { name: 'Remover Omelete de Queijo dos favoritos' }),
    )
    expect(screen.getByRole('status')).toHaveTextContent('Receita removida dos favoritos')
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Omelete de Queijo' })).toBeInTheDocument(),
    )
  })
})
