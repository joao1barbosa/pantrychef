import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { aplicarTema } from '@/lib/theme'
import { ThemeSelector, ThemeToggleButton } from '@/shared/components/theme-toggle'

function simularSistemaEscuro(escuro: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: escuro && query.includes('dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

describe('tema', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove('dark')
  })

  it('segue o sistema quando não há preferência salva', () => {
    simularSistemaEscuro(true)
    expect(aplicarTema()).toBe(true)
    expect(document.documentElement).toHaveClass('dark')
  })

  it('seletor aplica e persiste a escolha; "Sistema" remove a preferência', async () => {
    simularSistemaEscuro(false)
    const user = userEvent.setup()
    render(<ThemeSelector />)

    expect(screen.getByRole('radio', { name: 'Sistema' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('radio', { name: 'Escuro' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('tema')).toBe('escuro')
    expect(screen.getByRole('radio', { name: 'Escuro' })).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('radio', { name: 'Sistema' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('tema')).toBeNull()
  })

  it('botão da sidebar alterna entre claro e escuro', async () => {
    simularSistemaEscuro(false)
    const user = userEvent.setup()
    render(<ThemeToggleButton />)
    await user.click(screen.getByRole('button', { name: 'Usar tema escuro' }))
    expect(document.documentElement).toHaveClass('dark')
    await user.click(screen.getByRole('button', { name: 'Usar tema claro' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('tema')).toBe('claro')
  })
})
