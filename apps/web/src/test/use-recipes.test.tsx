import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import {
  TAMANHO_PAGINA,
  montarQueryReceitas,
  useRecipes,
} from '@/features/recipes/hooks/use-recipes'
import { API_URL } from '@/lib/api'
import { mockReceitas } from '@/mocks/handlers'
import { server } from '@/mocks/server'
import { criarQueryClient } from './utils'

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={criarQueryClient()}>{children}</QueryClientProvider>
}

describe('montarQueryReceitas', () => {
  it('inclui só os filtros preenchidos', () => {
    expect(
      montarQueryReceitas(
        { nome: ' bolo ', dificuldade: '', tempoMax: 30, ordenacao: 'populares' },
        12,
        24,
      ),
    ).toBe('nome=bolo&tempo_max=30&ordenacao=populares&limit=12&offset=24')
  })
})

describe('useRecipes', () => {
  it('pagina com limit/offset até a última página', async () => {
    const pedidos: string[] = []
    const muitas = Array.from({ length: TAMANHO_PAGINA + 3 }, (_, i) => ({
      ...mockReceitas[0],
      id: `r-${i}`,
    }))
    server.use(
      http.get(`${API_URL}/recipes`, ({ request }) => {
        const url = new URL(request.url)
        pedidos.push(url.search)
        const offset = Number(url.searchParams.get('offset'))
        const limit = Number(url.searchParams.get('limit'))
        return HttpResponse.json(muitas.slice(offset, offset + limit))
      }),
    )

    const { result } = renderHook(() => useRecipes({ dificuldade: 'facil' }), { wrapper })
    await waitFor(() => expect(result.current.data).toHaveLength(TAMANHO_PAGINA))
    expect(result.current.hasNextPage).toBe(true)

    await act(() => result.current.fetchNextPage())
    await waitFor(() => expect(result.current.data).toHaveLength(TAMANHO_PAGINA + 3))
    expect(result.current.hasNextPage).toBe(false)
    expect(pedidos).toEqual([
      `?dificuldade=facil&limit=${TAMANHO_PAGINA}&offset=0`,
      `?dificuldade=facil&limit=${TAMANHO_PAGINA}&offset=${TAMANHO_PAGINA}`,
    ])
  })
})
