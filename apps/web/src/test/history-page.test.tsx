import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

import { HistoryPage } from '@/features/history/pages/history-page'

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

describe('HistoryPage', () => {
  it('deve renderizar a tela de histórico', async () => {
    render(<HistoryPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/histórico/i)).toBeInTheDocument()
    })
  })

  it('deve exibir receitas visualizadas', async () => {
    render(<HistoryPage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/omelete de queijo/i)).toBeInTheDocument()
    })
  })
})
