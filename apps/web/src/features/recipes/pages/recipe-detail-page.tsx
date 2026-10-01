import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Heart,
  Pencil,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ApiError, fetchWithAuth, getToken, mensagemDeErro } from '@/lib/api'
import { dividirPassos, formatarTempo, rotuloDificuldade } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StatusMessage } from '@/app/components/status-pages'
import { AiBadge, RecipeCover } from '@/shared/components/recipe-card'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useAlternarFavorito, useFavoritos } from '@/features/favorites/hooks/use-favorites'

import { ShareMenu } from '../components/share-menu'
import { useRecipe } from '../hooks/use-recipes'

function useVoltar() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key === 'default' ? navigate('/') : navigate(-1))
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const voltar = useVoltar()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [marcados, setMarcados] = useState<Set<string>>(new Set())

  const { data: receita, isLoading, error } = useRecipe(id)
  const { data: favoritos } = useFavoritos()
  const alternarFavorito = useAlternarFavorito()

  useEffect(() => {
    if (receita && getToken()) queryClient.invalidateQueries({ queryKey: ['history'] })
  }, [receita?.id, queryClient]) // eslint-disable-line react-hooks/exhaustive-deps

  const excluir = useMutation({
    mutationFn: () => fetchWithAuth(`/recipes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['recipe', id] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      navigate('/recipes', { replace: true })
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-10" aria-busy="true">
        <div className="h-10 w-24 animate-pulse rounded-full bg-foreground/10" />
        <div className="mt-4 h-[220px] animate-pulse rounded-[20px] bg-foreground/10 md:h-[320px]" />
        <div className="mt-5 h-8 w-3/4 animate-pulse rounded-lg bg-foreground/10" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
        <p className="sr-only">Carregando receita...</p>
      </div>
    )
  }

  if (error || !receita) {
    const status = error instanceof ApiError ? error.status : 404
    const naoEncontrada = status === 404 || status === 422
    return (
      <StatusMessage
        icon={<UtensilsCrossed />}
        titulo={naoEncontrada ? 'Receita não encontrada' : 'Erro ao carregar receita'}
        texto={
          naoEncontrada
            ? 'Essa receita pode ter sido removida ou o link está incorreto.'
            : mensagemDeErro(error, 'Tente novamente em instantes.')
        }
        acao={
          <Link
            to="/"
            className={cn(buttonVariants(), 'mt-2 h-12 rounded-full px-6 text-[15px] font-bold')}
          >
            Voltar para o início
          </Link>
        }
      />
    )
  }

  const isFavorito = (favoritos ?? []).some((f) => f.receita_id === receita.id)
  const isAutor = Boolean(receita.usuario_id && user && receita.usuario_id === user.id)
  const dificuldade = rotuloDificuldade(receita.dificuldade)
  const passos = dividirPassos(receita.modo_preparo)

  const favoritar = () => {
    if (!getToken()) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`)
      return
    }
    alternarFavorito.mutate({ receitaId: receita.id, favoritar: !isFavorito })
  }

  const alternarMarcado = (ingredienteId: string) =>
    setMarcados((atual) => {
      const novo = new Set(atual)
      if (novo.has(ingredienteId)) novo.delete(ingredienteId)
      else novo.add(ingredienteId)
      return novo
    })

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:pb-10">
      <button
        type="button"
        onClick={voltar}
        className="flex h-11 items-center gap-1.5 rounded-full pr-4 pl-1 text-sm font-semibold text-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ArrowLeft className="size-5" />
        Voltar
      </button>

      <RecipeCover
        receita={receita}
        className="mt-3 h-[200px] rounded-[20px] md:h-[300px]"
        iconClassName="size-20 md:size-28"
      >
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {receita.categoria && (
            <Badge className="h-7 rounded-full bg-[#FFFBF7]/95 px-3 text-xs font-bold text-[#B07A2A]">
              {receita.categoria}
            </Badge>
          )}
          {receita.gerada_por_ia && <AiBadge className="h-7" />}
        </div>
        {isAutor && (
          <Badge className="absolute top-4 right-4 h-7 rounded-full bg-[#FFFBF7]/95 px-3 text-xs font-bold text-[#5B7553]">
            Sua receita
          </Badge>
        )}
      </RecipeCover>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight md:text-[34px]">
            {receita.nome}
          </h1>
          {(receita.tempo_preparo != null || dificuldade) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/70">
              {receita.tempo_preparo != null && (
                <span className="flex items-center gap-1.5 font-semibold">
                  <Clock className="size-4" aria-hidden />
                  {formatarTempo(receita.tempo_preparo)}
                </span>
              )}
              {dificuldade && (
                <span className="flex items-center gap-1.5 font-semibold">
                  <BarChart3 className="size-4" aria-hidden />
                  {dificuldade}
                </span>
              )}
            </div>
          )}
          {receita.gerada_por_ia && (
            <p className="mt-3 flex items-start gap-2 text-sm text-foreground/70">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-dourado" aria-hidden />
              Receita criada pela IA. Confira quantidades e tempos antes de preparar.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={favoritar}
            disabled={alternarFavorito.isPending}
            aria-pressed={isFavorito}
            className={cn(
              'h-12 rounded-full px-5 text-[15px] font-bold',
              !isFavorito && 'bg-foreground text-background hover:bg-foreground/90',
            )}
          >
            <Heart className="size-5" fill={isFavorito ? 'currentColor' : 'none'} />
            {isFavorito ? 'Favoritada' : 'Favoritar'}
          </Button>
          <ShareMenu
            titulo={receita.nome}
            url={`${window.location.origin}/recipes/${receita.id}`}
          />
          {isAutor && (
            <>
              <Link
                to={`/recipes/${receita.id}/edit`}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-12 rounded-full px-5 text-[15px] font-bold',
                )}
              >
                <Pencil className="size-5" />
                Editar
              </Link>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmandoExclusao(true)}
                className="h-12 rounded-full px-4 text-[15px] font-bold text-destructive hover:text-destructive"
              >
                <Trash2 className="size-5" />
                Excluir
              </Button>
            </>
          )}
        </div>
        {alternarFavorito.isError && (
          <p role="alert" className="text-sm text-destructive">
            {mensagemDeErro(alternarFavorito.error, 'Não foi possível atualizar o favorito.')}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="gap-0 rounded-[20px] border-foreground/10 p-5 shadow-none md:col-span-2">
            <h2 className="text-lg font-extrabold tracking-tight">Ingredientes</h2>
            {receita.ingredientes.length > 0 ? (
              <>
                <p className="mt-1 text-xs text-foreground/60">
                  Toque para marcar o que já separou.
                </p>
                <ul className="mt-2 divide-y divide-foreground/10">
                  {receita.ingredientes.map((ing) => {
                    const marcado = marcados.has(ing.ingrediente_id)
                    return (
                      <li key={ing.ingrediente_id}>
                        <label className="flex cursor-pointer items-baseline gap-3 py-2.5 text-[15px]">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => alternarMarcado(ing.ingrediente_id)}
                            className="size-4 translate-y-0.5 accent-[#5B7553]"
                          />
                          <span
                            className={cn(
                              'flex-1 font-medium',
                              marcado && 'text-foreground/50 line-through',
                            )}
                          >
                            {ing.nome}
                          </span>
                          {ing.quantidade && (
                            <span className="shrink-0 rounded-full bg-foreground/[0.07] px-2.5 py-1 text-[13px] font-bold text-foreground/70">
                              {ing.quantidade}
                            </span>
                          )}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-[15px] text-foreground/70">
                Nenhum ingrediente cadastrado para esta receita.
              </p>
            )}
          </Card>

          <Card className="gap-0 rounded-[20px] border-foreground/10 p-5 shadow-none md:col-span-3">
            <h2 className="text-lg font-extrabold tracking-tight">Modo de preparo</h2>
            {passos.length > 1 ? (
              <ol className="mt-3 space-y-3">
                {passos.map((passo, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-terracota/10 text-[13px] font-extrabold text-terracota"
                    >
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-foreground/90">{passo}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-foreground/90">
                {receita.modo_preparo}
              </p>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        aberto={confirmandoExclusao}
        titulo="Excluir receita?"
        descricao={
          excluir.isError
            ? mensagemDeErro(excluir.error, 'Não foi possível excluir. Tente novamente.')
            : `“${receita.nome}” será removida para todos. Essa ação não pode ser desfeita.`
        }
        confirmar="Excluir"
        carregando={excluir.isPending}
        onConfirmar={() => excluir.mutate()}
        onCancelar={() => setConfirmandoExclusao(false)}
      />
    </div>
  )
}
