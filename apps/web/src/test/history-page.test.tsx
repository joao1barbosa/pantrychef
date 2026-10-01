import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { HistoryPage } from '@/features/history/pages/history-page'
import { API_URL } from '@/lib/api'
import { server } from '@/mocks/server'
import { logar, renderComRotas } from './utils'

function renderHistorico() {
  logar()
  return renderComRotas(<HistoryPage />, { rota: '/history', caminho: '/history' })
}

describe('HistoryPage', () => {
  it('exibe receitas visualizadas com horário', async () => {
    renderHistorico()
    expect(await screen.findByRole('link', { name: 'Omelete de Queijo' })).toBeInTheDocument()
    expect(screen.getByText('1 receita visualizada')).toBeInTheDocument()
    expect(screen.getByText(/^Vista às/)).toBeInTheDocument()
  })

  it('mostra estado vazio', async () => {
    server.use(http.get(`${API_URL}/history`, () => HttpResponse.json([])))
    renderHistorico()
    expect(await screen.findByText('Nenhuma receita visualizada')).toBeInTheDocument()
  })

  it('mostra erro com opção de tentar de novo', async () => {
    server.use(http.get(`${API_URL}/history`, () => HttpResponse.json({}, { status: 500 })))
    renderHistorico()
    expect(
      await screen.findByText('Ocorreu um erro inesperado. Tente novamente.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })
})
