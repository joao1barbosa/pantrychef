import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth, API_URL } from '@/lib/api'

export interface User {
  id: string
  nome: string
  email: string
}

export interface LoginData {
  email: string
  senha: string
}

export interface RegisterData {
  nome: string
  email: string
  senha: string
}

async function login(data: LoginData): Promise<{ access_token: string }> {
  const formData = new URLSearchParams()
  formData.append('username', data.email)
  formData.append('password', data.senha)

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })

  if (!response.ok) {
    throw new Error('Email ou senha incorretos')
  }

  return response.json()
}

async function register(data: RegisterData): Promise<User> {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: data.nome,
      email: data.email,
      senha: data.senha,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro ao cadastrar' }))
    if (response.status === 409) {
      throw new Error('Email já cadastrado')
    }
    throw new Error(error.detail || 'Erro ao cadastrar')
  }

  return response.json()
}

async function getCurrentUser(): Promise<User> {
  return fetchWithAuth('/users/me')
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    enabled: !!localStorage.getItem('token'),
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  const registerMutation = useMutation({
    mutationFn: register,
  })

  const logout = () => {
    localStorage.removeItem('token')
    queryClient.clear()
    window.location.href = '/login'
  }

  return {
    user,
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
