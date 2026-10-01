import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { API_URL, ApiError, SESSAO_EXPIRADA_KEY, fetchWithAuth, mensagemDoDetalhe } from '@/lib/api'
import { server } from '@/mocks/server'

describe('mensagemDoDetalhe', () => {
  it('aceita string', () => {
    expect(mensagemDoDetalhe('Receita não encontrada.')).toBe('Receita não encontrada.')
  })

  it('converte lista de erros de validação do FastAPI em texto (não "[object Object]")', () => {
    const detalhe = [
      { loc: ['body', 'senha'], msg: 'String should have at least 8 characters' },
      {
        loc: ['body', 'ingredientes'],
        msg: 'Value error, Cada ingrediente só pode aparecer uma vez na receita.',
      },
    ]
    expect(mensagemDoDetalhe(detalhe)).toBe(
      'String should have at least 8 characters Cada ingrediente só pode aparecer uma vez na receita.',
    )
  })

  it('retorna null para formatos desconhecidos', () => {
    expect(mensagemDoDetalhe(undefined)).toBeNull()
  })
})

describe('fetchWithAuth', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lança ApiError com status e mensagem do backend', async () => {
    server.use(
      http.get(`${API_URL}/x`, () => HttpResponse.json({ detail: 'Proibido' }, { status: 403 })),
    )
    const erro = await fetchWithAuth('/x').catch((e) => e)
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ status: 403, message: 'Proibido' })
  })

  it('não expõe detalhes internos em erro 500', async () => {
    server.use(
      http.get(`${API_URL}/x`, () => HttpResponse.text('Internal Server Error', { status: 500 })),
    )
    await expect(fetchWithAuth('/x')).rejects.toThrow(
      'Ocorreu um erro inesperado. Tente novamente.',
    )
  })

  it('trata 204 sem tentar ler JSON', async () => {
    server.use(http.delete(`${API_URL}/x`, () => new HttpResponse(null, { status: 204 })))
    await expect(fetchWithAuth('/x', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('traduz falha de rede', async () => {
    server.use(http.get(`${API_URL}/x`, () => HttpResponse.error()))
    await expect(fetchWithAuth('/x')).rejects.toMatchObject({
      status: 0,
      message: expect.stringMatching(/conexão/),
    })
  })

  it('401 com token salvo encerra a sessão e redireciona para o login', async () => {
    const assign = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/favorites',
      search: '',
      assign,
    } as Location)
    localStorage.setItem('token', 'expirado')
    server.use(
      http.get(`${API_URL}/x`, () =>
        HttpResponse.json({ detail: 'Não autorizado.' }, { status: 401 }),
      ),
    )

    await expect(fetchWithAuth('/x')).rejects.toMatchObject({ status: 401 })
    expect(localStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem(SESSAO_EXPIRADA_KEY)).toBe('1')
    expect(assign).toHaveBeenCalledWith('/login?next=%2Ffavorites')
  })

  it('401 sem token não redireciona (rota pública)', async () => {
    server.use(
      http.get(`${API_URL}/x`, () =>
        HttpResponse.json({ detail: 'Não autorizado.' }, { status: 401 }),
      ),
    )
    await expect(fetchWithAuth('/x')).rejects.toMatchObject({
      status: 401,
      message: 'Não autorizado.',
    })
  })
})
