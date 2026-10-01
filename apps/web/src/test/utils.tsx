import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom'
import { TOKEN_KEY } from '@/lib/api'
import { mockToken } from '@/mocks/handlers'

export function criarQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
}

export function logar() {
  localStorage.setItem(TOKEN_KEY, mockToken)
}

interface Opcoes {
  rota?: string
  caminho?: string
  /** Rotas extras (ex.: destino de um redirecionamento) renderizadas como marcadores. */
  extras?: string[]
  routes?: RouteObject[]
}

/** Renderiza um elemento dentro de um memory router + React Query isolados. */
export function renderComRotas(elemento: ReactElement | null, opcoes: Opcoes = {}) {
  const { rota = '/', caminho = '/', extras = [], routes } = opcoes
  const queryClient = criarQueryClient()
  const definicao: RouteObject[] = routes ?? [
    { path: caminho, element: elemento },
    ...extras.map((path) => ({ path, element: <p>rota:{path}</p> })),
  ]
  const router = createMemoryRouter(definicao, { initialEntries: [rota] })
  const resultado = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...resultado, router, queryClient }
}
