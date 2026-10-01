import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { mensagemDeErro } from '@/lib/api'
import { RecipeGridSkeleton } from '@/shared/components/recipe-card'
import { useAuth } from '@/features/auth/hooks/use-auth'

import { FavoritosScreen, paraFavoritoView } from '../components'
import { useAlternarFavorito, useFavoritos } from '../hooks/use-favorites'

export function FavoritesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: favoritos, isLoading, isError, error, refetch } = useFavoritos()
  const alternar = useAlternarFavorito()

  const views = useMemo(
    () => (favoritos ?? []).map((f) => paraFavoritoView(f, user?.id)),
    [favoritos, user?.id],
  )

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6" aria-busy="true">
        <h1 className="text-[34px] leading-none font-extrabold tracking-tight">Favoritos</h1>
        <RecipeGridSkeleton />
        <p className="sr-only">Carregando favoritos...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-destructive">{mensagemDeErro(error, 'Erro ao carregar favoritos.')}</p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  return (
    <>
      <FavoritosScreen
        favoritos={views}
        usuarioId={user?.id}
        onRemoverFavorito={(favorito) =>
          alternar.mutate({ receitaId: favorito.receita.id, favoritar: false })
        }
        onDescobrir={() => navigate('/')}
      />
      {alternar.isError && (
        <p
          role="alert"
          className="fixed inset-x-4 bottom-24 z-50 rounded-xl bg-destructive px-4 py-3 text-sm text-white md:bottom-6 dark:text-marrom md:left-72"
        >
          {mensagemDeErro(alternar.error, 'Não foi possível remover o favorito. Tente novamente.')}
        </p>
      )}
    </>
  )
}
