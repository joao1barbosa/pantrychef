import type { Dificuldade, Origem, Receita, Refeicao, Restricao } from './dados'

export const TEMPO_MINIMO = 10
export const TEMPO_SEM_LIMITE = 120

export interface Filtros {
  refeicoes: Refeicao[]
  tempoMaximo: number
  dificuldade: Dificuldade | 'qualquer'
  /** Pede para a IA priorizar os ingredientes da geladeira (tratado no backend) */
  usarGeladeira: boolean
  incluir: string[]
  evitar: string[]
  restricoes: Restricao[]
  porcoesMinimas: number
  origem: Origem | 'todas'
}

export const FILTROS_PADRAO: Filtros = {
  refeicoes: [],
  tempoMaximo: TEMPO_SEM_LIMITE,
  dificuldade: 'qualquer',
  usarGeladeira: false,
  incluir: [],
  evitar: [],
  restricoes: [],
  porcoesMinimas: 1,
  origem: 'todas',
}

/** Remove acentos e padroniza para comparar ingredientes ("Abóbora" = "abobora") */
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function contarFiltrosAtivos(f: Filtros) {
  return [
    f.refeicoes.length > 0,
    f.tempoMaximo < TEMPO_SEM_LIMITE,
    f.dificuldade !== 'qualquer',
    f.usarGeladeira,
    f.incluir.length > 0,
    f.evitar.length > 0,
    f.restricoes.length > 0,
    f.porcoesMinimas > 1,
    f.origem !== 'todas',
  ].filter(Boolean).length
}

export function aplicarFiltros(receitas: Receita[], f: Filtros) {
  const incluir = f.incluir.map(normalizar)
  const evitar = f.evitar.map(normalizar)

  return receitas.filter((r) => {
    const ingredientes = r.ingredientes.map(normalizar)
    const temIngrediente = (termo: string) => ingredientes.some((i) => i.includes(termo))

    if (f.refeicoes.length && !f.refeicoes.includes(r.refeicao)) return false
    if (f.tempoMaximo < TEMPO_SEM_LIMITE && r.tempoMinutos > f.tempoMaximo) return false
    if (f.dificuldade !== 'qualquer' && r.dificuldade !== f.dificuldade) return false
    if (f.origem !== 'todas' && r.origem !== f.origem) return false
    if (r.porcoes < f.porcoesMinimas) return false
    if (!f.restricoes.every((x) => r.restricoes.includes(x))) return false
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
