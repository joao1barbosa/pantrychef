import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL, ApiError, TOKEN_KEY, fetchWithAuth, getToken, mensagemDoDetalhe } from '@/lib/api'
import type { Usuario } from '@/types'

export type User = Usuario

export interface LoginData {
  email: string
  senha: string
}

export interface RegisterData {
  nome: string
  email: string
  senha: string
}

export const USUARIO_QUERY_KEY = ['users', 'me'] as const

async function postSemToken(url: string, init: RequestInit) {
  try {
    return await fetch(`${API_URL}${url}`, init)
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.')
  }
}

async function login(data: LoginData): Promise<{ access_token: string }> {
  const formData = new URLSearchParams()
  formData.append('username', data.email.trim())
  formData.append('password', data.senha)

  const response = await postSemToken('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })

  if (!response.ok) {
    if (response.status === 401) throw new ApiError(401, 'Email ou senha incorretos')
    const corpo = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      mensagemDoDetalhe(corpo?.detail) ?? 'Não foi possível entrar. Tente novamente.',
    )
  }

  return response.json()
}

async function register(data: RegisterData): Promise<User> {
  const response = await postSemToken('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: data.nome.trim(),
      email: data.email.trim(),
      senha: data.senha,
    }),
  })

  if (!response.ok) {
    if (response.status === 409) throw new ApiError(409, 'Email já cadastrado')
    const corpo = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      mensagemDoDetalhe(corpo?.detail) ?? 'Não foi possível criar a conta. Tente novamente.',
    )
  }

  return response.json()
}

export function useAuth() {
  const queryClient = useQueryClient()
  const token = getToken()

  const { data: user, isLoading } = useQuery({
    queryKey: USUARIO_QUERY_KEY,
    queryFn: () => fetchWithAuth<User>('/users/me'),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.clear()
      localStorage.setItem(TOKEN_KEY, data.access_token)
    },
  })

  const registerMutation = useMutation({
    mutationFn: register,
  })

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    queryClient.clear()
    window.location.assign('/login')
  }

  return {
    user,
    isAuthenticated: !!token,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
  }
}
