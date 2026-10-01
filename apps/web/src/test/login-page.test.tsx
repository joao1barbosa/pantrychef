import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { LoginPage } from '@/features/auth/pages/login-page'
import { SESSAO_EXPIRADA_KEY } from '@/lib/api'
import { renderComRotas } from './utils'

function renderLogin(rota = '/login') {
  return renderComRotas(<LoginPage />, { rota, caminho: '/login', extras: ['/', '/favorites'] })
}

describe('LoginPage', () => {
  it('renderiza o formulário de login', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('valida campos antes de enviar', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Email inválido')).toBeInTheDocument()
    expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
  })

  it('faz login e volta para a página de origem (?next=)', async () => {
    const user = userEvent.setup()
    renderLogin('/login?next=%2Ffavorites')
    await user.type(screen.getByLabelText('Email'), 'joao@test.com')
    await user.type(screen.getByLabelText('Senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('rota:/favorites')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeTruthy()
  })

  it('ignora ?next= externo (open redirect)', async () => {
    const user = userEvent.setup()
    renderLogin('/login?next=%2F%2Fevil.com')
    await user.type(screen.getByLabelText('Email'), 'joao@test.com')
    await user.type(screen.getByLabelText('Senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('rota:/')).toBeInTheDocument()
  })

  it('mostra erro com credenciais incorretas', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText('Email'), 'joao@test.com')
    await user.type(screen.getByLabelText('Senha'), 'errada123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha incorretos')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('avisa quando a sessão expirou', () => {
    sessionStorage.setItem(SESSAO_EXPIRADA_KEY, '1')
    renderLogin()
    expect(screen.getByText(/sessão expirou/i)).toBeInTheDocument()
  })

  it('permite mostrar a senha', async () => {
    const user = userEvent.setup()
    renderLogin()
    const campo = screen.getByLabelText('Senha')
    expect(campo).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    await waitFor(() => expect(campo).toHaveAttribute('type', 'text'))
  })
})
