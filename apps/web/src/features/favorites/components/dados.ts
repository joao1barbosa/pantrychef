import type { Dificuldade, Favorito, Receita } from '@/types'

export type { Dificuldade }

export type Origem = 'minha' | 'comunidade' | 'ia'

export interface FavoritoView {
  receita: Receita
  salvoEm: string
  origem: Origem
}

export const ORIGENS: { id: Origem; label: string }[] = [
  { id: 'minha', label: 'Minhas' },
  { id: 'comunidade', label: 'Comunidade' },
  { id: 'ia', label: 'Da IA' },
]

export function paraFavoritoView(favorito: Favorito, usuarioId?: string): FavoritoView {
  const { receita } = favorito
  const origem: Origem = receita.gerada_por_ia
    ? 'ia'
    : usuarioId && receita.usuario_id === usuarioId
      ? 'minha'
      : 'comunidade'
  return { receita, salvoEm: favorito.salvo_em, origem }
}
