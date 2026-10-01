import { normalizar } from '@/lib/format'
import type { Ingrediente } from '@/types'

export interface IngredienteSelecionado {
  nome: string
  /** false quando digitado livremente (será validado pela IA no backend). */
  conhecido: boolean
}

const MAX_SUGESTOES = 6

/** Ordena sugestões: nomes que começam com o termo vêm antes dos que apenas o contêm. */
export function sugerirIngredientes(
  ingredientes: Ingrediente[],
  termo: string,
  selecionados: IngredienteSelecionado[],
): Ingrediente[] {
  const t = normalizar(termo)
  if (!t) return []
  const jaEscolhidos = new Set(selecionados.map((s) => normalizar(s.nome)))
  const candidatos = ingredientes.filter((i) => {
    const nome = normalizar(i.nome)
    return nome.includes(t) && !jaEscolhidos.has(nome)
  })
  return candidatos
    .sort((a, b) => {
      const pa = normalizar(a.nome).startsWith(t) ? 0 : 1
      const pb = normalizar(b.nome).startsWith(t) ? 0 : 1
      return pa - pb || a.nome.localeCompare(b.nome, 'pt-BR')
    })
    .slice(0, MAX_SUGESTOES)
}
