import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth, getToken } from '@/lib/api'
import type { Favorito } from '@/types'

export const FAVORITOS_QUERY_KEY = ['favorites'] as const

export function useFavoritos() {
  return useQuery({
    queryKey: FAVORITOS_QUERY_KEY,
    queryFn: () => fetchWithAuth<Favorito[]>('/favorites'),
    enabled: Boolean(getToken()),
  })
}

/** Favorita/desfavorita com atualização otimista da lista. */
export function useAlternarFavorito() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ receitaId, favoritar }: { receitaId: string; favoritar: boolean }) => {
      if (favoritar) {
        await fetchWithAuth('/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receita_id: receitaId }),
        })
      } else {
        await fetchWithAuth(`/favorites/${receitaId}`, { method: 'DELETE' })
      }
    },
    onMutate: async ({ receitaId, favoritar }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITOS_QUERY_KEY })
      const anterior = queryClient.getQueryData<Favorito[]>(FAVORITOS_QUERY_KEY)
      if (anterior && !favoritar) {
        queryClient.setQueryData<Favorito[]>(
          FAVORITOS_QUERY_KEY,
          anterior.filter((f) => f.receita_id !== receitaId),
        )
      }
      return { anterior }
    },
    onError: (_erro, _vars, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(FAVORITOS_QUERY_KEY, contexto.anterior)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITOS_QUERY_KEY }),
  })
}
