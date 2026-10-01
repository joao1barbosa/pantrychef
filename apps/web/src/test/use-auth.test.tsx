import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useAuth } from '@/features/auth/hooks/use-auth'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve retornar user indefinido quando não autenticado', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.user).toBeFalsy()
  })

  it('deve fazer login com credenciais válidas', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await result.current.login({ email: 'joao@test.com', senha: 'senha123' })

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeTruthy()
    })
  })

  it('deve falhar login com credenciais inválidas', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.login({ email: 'joao@test.com', senha: 'senha-errada' }),
    ).rejects.toThrow()

    expect(localStorage.getItem('token')).toBeNull()
  })

  it('deve fazer logout e limpar token', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    // Primeiro faz login
    await result.current.login({ email: 'joao@test.com', senha: 'senha123' })
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeTruthy()
    })

    // Depois faz logout
    result.current.logout()

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull()
    })
  })
})
