import { normalizar } from '@/lib/format'
import type { Dificuldade, FavoritoView, Origem } from './dados'

export { normalizar }

export const TEMPO_MINIMO = 10
export const TEMPO_SEM_LIMITE = 120

export interface Filtros {
  tempoMaximo: number
  dificuldade: Dificuldade | 'qualquer'
  incluir: string[]
  evitar: string[]
  origem: Origem | 'todas'
}

export const FILTROS_PADRAO: Filtros = {
  tempoMaximo: TEMPO_SEM_LIMITE,
  dificuldade: 'qualquer',
  incluir: [],
  evitar: [],
  origem: 'todas',
}

export function contarFiltrosAtivos(f: Filtros) {
  return [
    f.tempoMaximo < TEMPO_SEM_LIMITE,
    f.dificuldade !== 'qualquer',
    f.incluir.length > 0,
    f.evitar.length > 0,
    f.origem !== 'todas',
  ].filter(Boolean).length
}

export function aplicarFiltros(favoritos: FavoritoView[], f: Filtros) {
  const incluir = f.incluir.map(normalizar)
  const evitar = f.evitar.map(normalizar)

  return favoritos.filter(({ receita, origem }) => {
    const ingredientes = receita.ingredientes.map((i) => normalizar(i.nome))
    const temIngrediente = (termo: string) => ingredientes.some((i) => i.includes(termo))
    const tempo = receita.tempo_preparo

    if (f.tempoMaximo < TEMPO_SEM_LIMITE && (tempo == null || tempo > f.tempoMaximo)) return false
    if (f.dificuldade !== 'qualquer' && receita.dificuldade !== f.dificuldade) return false
    if (f.origem !== 'todas' && origem !== f.origem) return false
    if (!incluir.every(temIngrediente)) return false
    if (evitar.some(temIngrediente)) return false
    return true
  })
}

export function formatarTempoMaximo(minutos: number) {
  if (minutos >= TEMPO_SEM_LIMITE) return 'Sem limite'
  if (minutos < 60) return `Até ${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `Até ${h} h${m ? ` ${m} min` : ''}`
}
