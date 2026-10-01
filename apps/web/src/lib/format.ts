import type { Dificuldade } from '@/types'

export const DIFICULDADES: { id: Dificuldade; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'medio', label: 'Média' },
  { id: 'dificil', label: 'Difícil' },
]

export function rotuloDificuldade(dificuldade: string | null | undefined): string | null {
  return DIFICULDADES.find((d) => d.id === dificuldade)?.label ?? null
}

/** Remove acentos e padroniza para comparar textos ("Abóbora" = "abobora"). */
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function formatarDataHora(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  const dia = data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dia} às ${hora}`
}

export function formatarTempo(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function plural(quantidade: number, singular: string, pluralForma = `${singular}s`) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralForma}`
}

/**
 * Divide o modo de preparo em passos quando o texto vem numerado ("1. ... 2. ...")
 * ou com uma etapa por linha.
 */
export function dividirPassos(modoPreparo: string): string[] {
  const texto = modoPreparo.trim()
  if (/^\s*1[.)]\s/.test(texto)) {
    return texto
      .split(/(?:^|\s)\d{1,2}[.)]\s+/)
      .map((p) => p.trim())
      .filter(Boolean)
  }
  const linhas = texto
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  return linhas.length > 1 ? linhas : [texto]
}
