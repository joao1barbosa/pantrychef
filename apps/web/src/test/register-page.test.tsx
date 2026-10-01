import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { RegisterPage } from '@/features/auth/pages/register-page'
import { renderComRotas } from './utils'

async function preencher(dados: {
  nome: string
  email: string
  senha: string
  confirmacao?: string
}) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nome'), dados.nome)
  await user.type(screen.getByLabelText('Email'), dados.email)
  await user.type(screen.getByLabelText('Senha'), dados.senha)
  await user.type(screen.getByLabelText('Confirmar senha'), dados.confirmacao ?? dados.senha)
  await user.click(screen.getByRole('button', { name: 'Criar conta' }))
}

function renderCadastro() {
  return renderComRotas(<RegisterPage />, {
    rota: '/register',
    caminho: '/register',
    extras: ['/', '/login'],
  })
}

describe('RegisterPage', () => {
  it('exige senha com pelo menos 8 caracteres (mesma regra do backend)', async () => {
    renderCadastro()
    await preencher({ nome: 'Ana', email: 'ana@test.com', senha: 'abc123' })
    expect(await screen.findByText('Senha deve ter pelo menos 8 caracteres')).toBeInTheDocument()
  })

  it('valida confirmação de senha', async () => {
    renderCadastro()
    await preencher({
      nome: 'Ana',
      email: 'ana@test.com',
      senha: 'senha123',
      confirmacao: 'outra123',
    })
    expect(await screen.findByText('Senhas não coincidem')).toBeInTheDocument()
  })

  it('mostra erro legível para e-mail já cadastrado', async () => {
    renderCadastro()
    await preencher({ nome: 'Ana', email: 'existente@test.com', senha: 'senha123' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Email já cadastrado')
  })

  it('cria a conta e já entra no app', async () => {
    renderCadastro()
    await preencher({ nome: 'João', email: 'joao@test.com', senha: 'senha123' })
    expect(await screen.findByText('rota:/')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeTruthy()
  })
})
