import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { ProfilePage } from '@/features/profile/pages/profile-page'
import { API_URL } from '@/lib/api'
import { server } from '@/mocks/server'
import { logar, renderComRotas } from './utils'

function renderPerfil() {
  logar()
  return renderComRotas(<ProfilePage />, { rota: '/profile', caminho: '/profile' })
}

describe('ProfilePage', () => {
  it('salva nome e e-mail e confirma o sucesso', async () => {
    const user = userEvent.setup()
    renderPerfil()
    const nome = await screen.findByLabelText('Nome')
    await user.clear(nome)
    await user.type(nome, 'Novo Nome')
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'novo@test.com')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Perfil atualizado com sucesso!')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('novo@test.com')
  })

  it('mostra erro quando o e-mail já está em uso', async () => {
    server.use(
      http.patch(`${API_URL}/users/me`, () =>
        HttpResponse.json({ detail: 'E-mail já cadastrado.' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    renderPerfil()
    const email = await screen.findByLabelText('Email')
    await user.clear(email)
    await user.type(email, 'ocupado@test.com')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail já cadastrado.')
  })

  it('exibe a data de cadastro', async () => {
    renderPerfil()
    expect(await screen.findByText(/Membro desde/)).toBeInTheDocument()
  })
})
