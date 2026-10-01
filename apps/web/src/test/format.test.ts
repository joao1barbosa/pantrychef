import { describe, expect, it } from 'vitest'
import { dividirPassos, formatarTempo, normalizar, plural, rotuloDificuldade } from '@/lib/format'

describe('format', () => {
  it('divide modo de preparo numerado', () => {
    expect(dividirPassos('1. Bata os ovos. 2. Asse a 180 graus por 30 min. 3. Sirva.')).toEqual([
      'Bata os ovos.',
      'Asse a 180 graus por 30 min.',
      'Sirva.',
    ])
  })

  it('não quebra texto corrido que contém números', () => {
    expect(dividirPassos('Cozinhe por 10. Depois sirva.')).toEqual([
      'Cozinhe por 10. Depois sirva.',
    ])
  })

  it('usa uma linha por passo quando não há numeração', () => {
    expect(dividirPassos('Misture tudo\nLeve ao forno')).toEqual(['Misture tudo', 'Leve ao forno'])
  })

  it('normaliza acentos e caixa', () => {
    expect(normalizar('  Abóbora ')).toBe('abobora')
  })

  it('formata tempo, plural e dificuldade', () => {
    expect(formatarTempo(45)).toBe('45 min')
    expect(formatarTempo(90)).toBe('1 h 30 min')
    expect(plural(1, 'receita')).toBe('1 receita')
    expect(plural(2, 'receita')).toBe('2 receitas')
    expect(rotuloDificuldade('medio')).toBe('Média')
    expect(rotuloDificuldade('xyz')).toBeNull()
  })
})
