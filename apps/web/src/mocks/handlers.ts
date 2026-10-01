import { http, HttpResponse } from 'msw'
import { API_URL } from '@/lib/api'
import type { Favorito, HistoricoItem, Ingrediente, Receita, Usuario } from '@/types'

export const mockToken = 'mock-jwt-token-12345'

export const mockUser: Usuario = {
  id: 'test-user-id',
  nome: 'João Teste',
  email: 'joao@test.com',
  criado_em: '2026-01-01T00:00:00Z',
}

export const mockIngredientes: Ingrediente[] = [
  { id: 'ing-1', nome: 'Cebola', slug: 'cebola' },
  { id: 'ing-2', nome: 'Alho', slug: 'alho' },
  { id: 'ing-3', nome: 'Tomate', slug: 'tomate' },
  { id: 'ing-4', nome: 'Extrato de Tomate', slug: 'extrato-de-tomate' },
  { id: 'ing-5', nome: 'Queijo', slug: 'queijo' },
  { id: 'ing-6', nome: 'Ovo', slug: 'ovo' },
]

function receita(parcial: Partial<Receita> & Pick<Receita, 'id' | 'nome'>): Receita {
  return {
    slug: parcial.nome.toLowerCase().replace(/\s+/g, '-'),
    modo_preparo: '1. Prepare. 2. Sirva.',
    categoria: null,
    tempo_preparo: null,
    dificuldade: null,
    usuario_id: null,
    gerada_por_ia: false,
    criado_em: '2026-09-01T00:00:00Z',
    ingredientes: [],
    ...parcial,
  }
}

export const mockReceitas: Receita[] = [
  receita({
    id: 'receita-1',
    nome: 'Omelete de Queijo',
    categoria: 'Café da manhã',
    tempo_preparo: 10,
    dificuldade: 'facil',
    usuario_id: mockUser.id,
    ingredientes: [
      { ingrediente_id: 'ing-6', nome: 'Ovo', quantidade: '3' },
      { ingrediente_id: 'ing-5', nome: 'Queijo', quantidade: '50 g' },
    ],
  }),
  receita({
    id: 'receita-2',
    nome: 'Molho de Tomate',
    categoria: 'Molho',
    tempo_preparo: 30,
    dificuldade: 'medio',
    usuario_id: 'outro-usuario',
    criado_em: '2026-09-10T00:00:00Z',
    ingredientes: [
      { ingrediente_id: 'ing-3', nome: 'Tomate', quantidade: '4' },
      { ingrediente_id: 'ing-1', nome: 'Cebola', quantidade: '1' },
    ],
  }),
]

export const mockFavorites: Favorito[] = [
  {
    id: 'fav-1',
    receita_id: 'receita-1',
    salvo_em: '2026-09-01T00:00:00Z',
    receita: mockReceitas[0],
  },
]

export const mockHistory: HistoricoItem[] = [
  {
    id: 'hist-1',
    visualizado_em: '2026-09-17T10:00:00Z',
    receita: mockReceitas[0],
  },
]

export const handlers = [
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.formData()
    if (body.get('username') === 'joao@test.com' && body.get('password') === 'senha123') {
      return HttpResponse.json({ access_token: mockToken, token_type: 'bearer' })
    }
    return HttpResponse.json({ detail: 'Credenciais inválidas.' }, { status: 401 })
  }),

  http.post(`${API_URL}/users`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>
    if (body.email === 'existente@test.com') {
      return HttpResponse.json({ detail: 'E-mail já cadastrado.' }, { status: 409 })
    }
    return HttpResponse.json({ ...mockUser, nome: body.nome, email: body.email }, { status: 201 })
  }),

  http.get(`${API_URL}/users/me`, () => HttpResponse.json(mockUser)),

  http.patch(`${API_URL}/users/me`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...mockUser, ...body })
  }),

  http.get(`${API_URL}/users/me/preferences`, () =>
    HttpResponse.json({ categorias_favoritas: [], restricoes_alimentares: [] }),
  ),

  http.patch(`${API_URL}/users/me/preferences`, async ({ request }) =>
    HttpResponse.json(await request.json()),
  ),

  http.get(`${API_URL}/ingredients`, () => HttpResponse.json(mockIngredientes)),

  http.get(`${API_URL}/recipes`, ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') ?? mockReceitas.length)
    const offset = Number(url.searchParams.get('offset') ?? 0)
    const nome = url.searchParams.get('nome')?.toLowerCase()
    const lista = nome
      ? mockReceitas.filter((r) => r.nome.toLowerCase().includes(nome))
      : mockReceitas
    return HttpResponse.json(lista.slice(offset, offset + limit))
  }),

  http.get(`${API_URL}/recipes/:id`, ({ params }) => {
    const encontrada = mockReceitas.find((r) => r.id === params.id)
    if (encontrada) return HttpResponse.json(encontrada)
    return HttpResponse.json({ detail: 'Receita não encontrada.' }, { status: 404 })
  }),

  http.post(`${API_URL}/recipes`, async ({ request }) => {
    const body = (await request.json()) as Partial<Receita>
    return HttpResponse.json(
      receita({ ...body, id: 'nova-receita-id', nome: body.nome ?? '', ingredientes: [] }),
      { status: 201 },
    )
  }),

  http.put(`${API_URL}/recipes/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Partial<Receita>
    return HttpResponse.json(
      receita({ ...body, id: String(params.id), nome: body.nome ?? '', ingredientes: [] }),
    )
  }),

  http.delete(`${API_URL}/recipes/:id`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${API_URL}/recipes/search`, () => HttpResponse.json(mockReceitas)),

  http.post(`${API_URL}/recipes/search-by-name`, () => HttpResponse.json(mockReceitas)),

  http.get(`${API_URL}/favorites`, () => HttpResponse.json(mockFavorites)),

  http.post(`${API_URL}/favorites`, async ({ request }) => {
    const body = (await request.json()) as { receita_id: string }
    const alvo = mockReceitas.find((r) => r.id === body.receita_id) ?? mockReceitas[0]
    return HttpResponse.json(
      {
        id: 'novo-fav-id',
        receita_id: body.receita_id,
        salvo_em: new Date().toISOString(),
        receita: alvo,
      },
      { status: 201 },
    )
  }),

  http.delete(`${API_URL}/favorites/:receita_id`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${API_URL}/history`, () => HttpResponse.json(mockHistory)),
]
