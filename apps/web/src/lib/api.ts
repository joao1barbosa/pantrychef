import { QueryClient } from '@tanstack/react-query'

export const API_URL = import.meta.env.VITE_API_URL || '/api'

export const TOKEN_KEY = 'token'
export const SESSAO_EXPIRADA_KEY = 'sessao-expirada'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (falhas, erro) => {
        if (erro instanceof ApiError && erro.status >= 400 && erro.status < 500) return false
        return falhas < 1
      },
    },
  },
})

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

const MENSAGENS_POR_STATUS: Record<number, string> = {
  0: 'Sem conexão com o servidor. Verifique sua internet.',
  404: 'Não encontrado.',
  429: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  500: 'Ocorreu um erro inesperado. Tente novamente.',
  502: 'Serviço indisponível no momento. Tente novamente em instantes.',
  503: 'Serviço indisponível no momento. Tente novamente em instantes.',
}

/** Converte o `detail` do FastAPI (string ou lista de erros de validação) em texto. */
export function mensagemDoDetalhe(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const mensagens = (detail as { msg?: string }[])
      .map((erro) => (erro.msg ?? '').replace(/^Value error, /, ''))
      .filter(Boolean)
    return mensagens.length > 0 ? [...new Set(mensagens)].join(' ') : 'Dados inválidos.'
  }
  return null
}

export function mensagemDeErro(erro: unknown, padrao = 'Algo deu errado. Tente novamente.') {
  if (erro instanceof Error && erro.message) return erro.message
  return padrao
}

function sessaoExpirou() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.setItem(SESSAO_EXPIRADA_KEY, '1')
  queryClient.clear()
  const destino = window.location.pathname + window.location.search
  window.location.assign(`/login?next=${encodeURIComponent(destino)}`)
}

/**
 * Faz a requisição à API anexando o token (quando houver) e normaliza erros em `ApiError`.
 * Um 401 com token salvo significa sessão expirada: limpa o estado e manda para o login.
 */
export async function fetchWithAuth<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${url}`, { ...options, headers })
  } catch {
    throw new ApiError(0, MENSAGENS_POR_STATUS[0])
  }

  if (response.status === 401 && token) {
    sessaoExpirou()
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.')
  }

  if (!response.ok) {
    const corpo = await response.json().catch(() => null)
    const mensagem =
      (response.status < 500 || response.status === 503
        ? mensagemDoDetalhe(corpo?.detail)
        : null) ??
      MENSAGENS_POR_STATUS[response.status] ??
      (response.status >= 500 ? MENSAGENS_POR_STATUS[500] : 'Não foi possível concluir a ação.')
    throw new ApiError(response.status, mensagem)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
