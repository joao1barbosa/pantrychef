import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

import { FavoritesPage } from '@/features/favorites/pages/favorites-page'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('FavoritesPage', () => {
  it('deve renderizar a tela de favoritos', async () => {
    render(<FavoritesPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/favoritos/i)).toBeInTheDocument()
    })
  })

  it('deve exibir receitas favoritas', async () => {
    render(<FavoritesPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/omelete de queijo/i)).toBeInTheDocument()
    })
  })
})
