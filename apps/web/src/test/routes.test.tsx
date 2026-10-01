import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { routes } from '@/app/routes'
import { criarQueryClient, logar } from './utils'

function renderApp(rota: string) {
  const router = createMemoryRouter(routes, { initialEntries: [rota] })
  render(
    <QueryClientProvider client={criarQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('rotas', () => {
  it('Home é pública em "/"', async () => {
    renderApp('/')
    expect(
      await screen.findByRole('heading', { name: 'O que tem na cozinha?' }),
    ).toBeInTheDocument()
  })

  it('rota protegida redireciona para o login guardando o destino', async () => {
    const router = renderApp('/favorites')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?next=%2Ffavorites')
  })

  it('usuário logado não vê a tela de login', async () => {
    logar()
    const router = renderApp('/login')
    await screen.findByRole('heading', { name: 'O que tem na cozinha?' })
    expect(router.state.location.pathname).toBe('/')
  })

  it('links antigos /home/* continuam funcionando', async () => {
    const router = renderApp('/home/recipes/receita-2')
    expect(await screen.findByRole('heading', { name: 'Molho de Tomate' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/recipes/receita-2')
  })

  it('rota inexistente mostra página 404 amigável', async () => {
    renderApp('/nao-existe')
    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument()
  })

  it('apenas o item de navegação atual fica ativo (Home usa end)', async () => {
    logar()
    renderApp('/history')
    await screen.findByRole('heading', { name: 'Histórico' })
    const ativos = screen.getAllByRole('link', { current: 'page' }).map((l) => l.textContent)
    expect(ativos).not.toContain('Home')
    expect(ativos).toContain('Histórico')
  })

  it('visitante vê opção de entrar na sidebar, não um usuário vazio', async () => {
    renderApp('/')
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sair da conta' })).not.toBeInTheDocument()
  })
})
