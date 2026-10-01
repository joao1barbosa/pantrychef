import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api'
import type { Dificuldade, Ingrediente, Ordenacao, Receita } from '@/types'

export const TAMANHO_PAGINA = 12

export interface FiltrosReceitas {
  nome?: string
  categoria?: string
  dificuldade?: Dificuldade | ''
  tempoMax?: number | null
  ordenacao?: Ordenacao | ''
}

/** Monta a query string de GET /recipes ignorando filtros vazios. */
export function montarQueryReceitas(filtros: FiltrosReceitas, limit: number, offset: number) {
  const params = new URLSearchParams()
  if (filtros.nome?.trim()) params.set('nome', filtros.nome.trim())
  if (filtros.categoria?.trim()) params.set('categoria', filtros.categoria.trim())
  if (filtros.dificuldade) params.set('dificuldade', filtros.dificuldade)
  if (filtros.tempoMax && filtros.tempoMax > 0) params.set('tempo_max', String(filtros.tempoMax))
  if (filtros.ordenacao) params.set('ordenacao', filtros.ordenacao)
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return params.toString()
}

export function useRecipes(filtros: FiltrosReceitas) {
  return useInfiniteQuery({
    queryKey: ['recipes', 'list', filtros],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchWithAuth<Receita[]>(
        `/recipes?${montarQueryReceitas(filtros, TAMANHO_PAGINA, pageParam)}`,
      ),
    getNextPageParam: (ultima, paginas) =>
      ultima.length < TAMANHO_PAGINA ? undefined : paginas.length * TAMANHO_PAGINA,
    select: (dados) => dados.pages.flat(),
  })
}

export function useRecipe(id: string | undefined, { registrar = true } = {}) {
  return useQuery({
    queryKey: registrar ? ['recipe', id] : ['recipe', id, 'sem-registro'],
    queryFn: () => fetchWithAuth<Receita>(`/recipes/${id}${registrar ? '' : '?registrar=false'}`),
    enabled: Boolean(id),
    staleTime: registrar ? 0 : undefined,
  })
}

export function useIngredientes() {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: () => fetchWithAuth<Ingrediente[]>('/ingredients'),
    staleTime: 10 * 60 * 1000,
  })
}
