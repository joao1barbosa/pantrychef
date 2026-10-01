import { http, HttpResponse } from 'msw'
import { API_URL } from '@/lib/api'

// Dados mock
const mockUser = {
  id: 'test-user-id',
  nome: 'João Teste',
  email: 'joao@test.com',
  criado_em: '2026-01-01T00:00:00Z',
}

const mockToken = 'mock-jwt-token-12345'

const mockIngredientes = [
  { id: '1', nome: 'Cebola', slug: 'cebola' },
  { id: '2', nome: 'Alho', slug: 'alho' },
  { id: '3', nome: 'Tomate', slug: 'tomate' },
  { id: '4', nome: 'Queijo', slug: 'queijo' },
  { id: '5', nome: 'Ovo', slug: 'ovo' },
]

const mockReceitas = [
  {
    id: 'receita-1',
    nome: 'Omelete de Queijo',
    categoria: 'Café da manhã',
    tempo_preparo: 10,
    dificuldade: 'facil',
    ingredientes: [{ nome: 'Ovo' }, { nome: 'Queijo' }],
  },
  {
    id: 'receita-2',
    nome: 'Macarrão ao Molho',
    categoria: 'Almoço',
    tempo_preparo: 30,
    dificuldade: 'medio',
    ingredientes: [{ nome: 'Macarrão' }, { nome: 'Tomate' }],
  },
]

const mockFavorites = [
  {
    id: 'fav-1',
    receita_id: 'receita-1',
    salvo_em: '2026-09-01T00:00:00Z',
    receita: mockReceitas[0],
  },
]

const mockHistory = [
  {
    id: 'hist-1',
    receita_id: 'receita-1',
    visualizado_em: '2026-09-17T10:00:00Z',
    receita: mockReceitas[0],
  },
]

export const handlers = [
  // Auth
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.formData()
    const username = body.get('username')
    const password = body.get('password')

    if (username === 'joao@test.com' && password === 'senha123') {
      return HttpResponse.json({
        access_token: mockToken,
        token_type: 'bearer',
      })
    }

    return HttpResponse.json(
      { detail: 'Email ou senha incorretos' },
      { status: 401 }
    )
  }),

  // Users
  http.post(`${API_URL}/users`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      ...mockUser,
      ...body,
    })
  }),

  http.get(`${API_URL}/users/me`, () => {
    return HttpResponse.json(mockUser)
  }),

  http.patch(`${API_URL}/users/me`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...mockUser, ...body })
  }),

  http.get(`${API_URL}/users/me/preferences`, () => {
    return HttpResponse.json({
      categorias_favoritas: [],
      restricoes_alimentares: [],
    })
  }),

  http.patch(`${API_URL}/users/me/preferences`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),

  // Ingredients
  http.get(`${API_URL}/ingredients`, () => {
    return HttpResponse.json(mockIngredientes)
  }),

  // Recipes
  http.get(`${API_URL}/recipes`, () => {
    return HttpResponse.json(mockReceitas)
  }),

  http.get(`${API_URL}/recipes/:id`, ({ params }) => {
    const receita = mockReceitas.find((r) => r.id === params.id)
    if (receita) {
      return HttpResponse.json(receita)
    }
    return HttpResponse.json({ detail: 'Receita não encontrada' }, { status: 404 })
  }),

  http.post(`${API_URL}/recipes`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: 'nova-receita-id',
      ...body,
    })
  }),

  http.put(`${API_URL}/recipes/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: params.id,
      ...body,
    })
  }),

  http.post(`${API_URL}/recipes/search`, () => {
    return HttpResponse.json(mockReceitas)
  }),

  // Favorites
  http.get(`${API_URL}/favorites`, () => {
    return HttpResponse.json(mockFavorites)
  }),

  http.post(`${API_URL}/favorites`, async ({ request }) => {
    const body = (await request.json()) as { receita_id: string }
    return HttpResponse.json({
      id: 'novo-fav-id',
      receita_id: body.receita_id,
      salvo_em: new Date().toISOString(),
    })
  }),

  http.delete(`${API_URL}/favorites/:receita_id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // History
  http.get(`${API_URL}/history`, () => {
    return HttpResponse.json(mockHistory)
  }),
]
