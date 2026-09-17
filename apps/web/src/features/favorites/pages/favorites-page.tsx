import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { fetchWithAuth } from '@/lib/api'

import { FavoritosScreen, type Dificuldade, type Receita, type Refeicao } from '../components'

interface FavoritoIngrediente {
  nome: string
}

interface FavoritoReceita {
  id: string
  nome: string
  categoria?: string | null
  tempo_preparo?: number | null
  dificuldade?: string | null
  ingredientes?: FavoritoIngrediente[] | null
}

interface Favorito {
  id: string
  receita_id: string
  salvo_em: string
  receita?: FavoritoReceita | null
}

function mapCategoriaToRefeicao(categoria: string | null | undefined): Refeicao {
  const lower = categoria?.toLowerCase() ?? ''
  if (lower.includes('caf') || lower.includes('breakfast')) return 'cafe'
  if (lower.includes('almoco') || lower.includes('almoço') || lower.includes('lunch')) return 'almoco'
  if (lower.includes('lanche') || lower.includes('snack')) return 'lanche'
  return 'jantar'
}

function mapDificuldade(dificuldade: string | null | undefined): Dificuldade {
  // A API usa "medio"; o componente espera "media"
  if (dificuldade === 'medio' || dificuldade === 'media') return 'media'
  if (dificuldade === 'dificil') return 'dificil'
  return 'facil'
}

function mapFavoritoToReceita(favorito: Favorito): Receita {
  const receita = favorito.receita
  return {
    id: receita?.id ?? favorito.receita_id,
    nome: receita?.nome ?? 'Receita',
    imagem: '/receitas/pao-de-queijo.jpg',
    refeicao: mapCategoriaToRefeicao(receita?.categoria),
    tempoMinutos: receita?.tempo_preparo ?? 30,
    dificuldade: mapDificuldade(receita?.dificuldade),
    porcoes: 4,
    origem: 'comunidade',
    restricoes: [],
    ingredientes: receita?.ingredientes?.map((i) => i.nome) ?? [],
    salvaEm: favorito.salvo_em ?? new Date().toISOString(),
  }
}

export function FavoritesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: favoritos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => fetchWithAuth('/favorites') as Promise<Favorito[]>,
  })

  const removeMutation = useMutation({
    mutationFn: (receitaId: string) =>
      fetchWithAuth(`/favorites/${receitaId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Carregando favoritos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Erro ao carregar favoritos.</p>
      </div>
    )
  }

  const receitas: Receita[] = (favoritos ?? []).map(mapFavoritoToReceita)

  return (
    <FavoritosScreen
      receitas={receitas}
      onAbrirReceita={(receita) => navigate(`/recipes/${receita.id}`)}
      onRemoverFavorito={(receita) => removeMutation.mutate(receita.id)}
      onDescobrir={() => navigate('/')}
    />
  )
}
