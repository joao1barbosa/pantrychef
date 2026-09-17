import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Heart,
  Pencil,
  Share2,
  ShoppingBasket,
  UtensilsCrossed,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fetchWithAuth } from '@/lib/api'
import { cn } from '@/lib/utils'

interface RecipeIngredient {
  ingrediente_id: string
  nome: string
  quantidade?: string | null
}

interface RecipeDetail {
  id: string
  slug: string
  nome: string
  modo_preparo: string
  categoria?: string | null
  tempo_preparo?: number | null
  dificuldade?: string | null
  porcoes?: number | null
  usuario_id?: string | null
  criado_em: string
  ingredientes: RecipeIngredient[]
}

interface Favorite {
  id: string
  receita_id: string
  salvo_em: string
}

interface CurrentUser {
  id: string
  nome: string
  email: string
}

function rotuloDificuldade(dificuldade: string | null | undefined): string {
  if (dificuldade === 'facil') return 'Fácil'
  if (dificuldade === 'medio') return 'Médio'
  if (dificuldade === 'dificil') return 'Difícil'
  return '—'
}

function isNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return (
    message.includes('não encontr') ||
    message.includes('nao encontr') ||
    message.includes('not found') ||
    message.includes('404')
  )
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [linkCopiado, setLinkCopiado] = useState(false)
  const hasToken =
    typeof window !== 'undefined' && Boolean(localStorage.getItem('token'))

  const {
    data: receita,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchWithAuth(`/recipes/${id}`) as Promise<RecipeDetail>,
    enabled: Boolean(id),
  })

  const { data: favoritos } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => fetchWithAuth('/favorites') as Promise<Favorite[]>,
    enabled: hasToken,
  })

  const { data: usuario } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => fetchWithAuth('/users/me') as Promise<CurrentUser>,
    enabled: hasToken,
    retry: false,
  })

  const isFavorito = Boolean(
    receita && (favoritos ?? []).some((f) => f.receita_id === receita.id),
  )
  const isAutor = Boolean(
    receita?.usuario_id && usuario && receita.usuario_id === usuario.id,
  )

  const favoritoMutation = useMutation({
    mutationFn: async () => {
      if (!receita) return
      if (isFavorito) {
        await fetchWithAuth(`/favorites/${receita.id}`, { method: 'DELETE' })
      } else {
        await fetchWithAuth('/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receita_id: receita.id }),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const compartilhar = async () => {
    const url = window.location.href
    const titulo = receita?.nome ?? 'Receita PantryChef'
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url })
      } catch {
        // Usuário cancelou o compartilhamento — nada a fazer.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const campo = document.createElement('textarea')
      campo.value = url
      document.body.appendChild(campo)
      campo.select()
      document.execCommand('copy')
      document.body.removeChild(campo)
    }
    setLinkCopiado(true)
    window.setTimeout(() => setLinkCopiado(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-10" aria-busy="true">
        <div className="h-10 w-24 animate-pulse rounded-full bg-foreground/10" />
        <div className="mt-4 h-[220px] animate-pulse rounded-[20px] bg-foreground/10 md:h-[320px]" />
        <div className="mt-5 h-8 w-3/4 animate-pulse rounded-lg bg-foreground/10" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-foreground/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
        </div>
        <p className="sr-only">Carregando receita...</p>
      </div>
    )
  }

  if (error || !receita) {
    const naoEncontrada = error ? isNotFoundError(error) : true
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex size-[72px] items-center justify-center rounded-full bg-primary/15 text-primary">
          <UtensilsCrossed className="size-8" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {naoEncontrada ? 'Receita não encontrada' : 'Erro ao carregar receita'}
        </h1>
        <p className="text-[15px] leading-relaxed text-foreground/70">
          {naoEncontrada
            ? 'Essa receita pode ter sido removida ou o link está incorreto.'
            : 'Tente novamente em instantes.'}
        </p>
        <Button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-2 h-12 rounded-full px-6 text-[15px] font-bold"
        >
          Voltar para o início
        </Button>
      </div>
    )
  }

  const passos = receita.modo_preparo
    .split(/\n+/)
    .map((p) => p.replace(/^\s*\d+[.)-]\s*/, '').trim())
    .filter(Boolean)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:pb-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex h-11 items-center gap-1.5 rounded-full pr-4 pl-1 text-sm font-semibold text-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ArrowLeft className="size-5" />
        Voltar
      </button>

      {/* Capa — mesmo raio e estilo dos cards de favoritos */}
      <div className="relative mt-3 h-[220px] overflow-hidden rounded-[20px] bg-gradient-to-br from-[#2C1810] via-[#5B7553] to-[#D4943A] md:h-[320px]">
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-[#F5F0EB]/40"
        >
          <UtensilsCrossed className="size-20 md:size-28" strokeWidth={1.25} />
        </div>
        {receita.categoria && (
          <Badge
            variant="dourado"
            className="absolute top-4 left-4 h-7 rounded-full bg-[#FFFBF7]/95 px-3 text-xs font-bold text-[#D4943A]"
          >
            {receita.categoria}
          </Badge>
        )}
        {isAutor && (
          <Badge
            variant="verde"
            className="absolute top-4 right-4 h-7 rounded-full bg-[#FFFBF7]/95 px-3 text-xs font-bold"
          >
            Sua receita
          </Badge>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight md:text-[34px]">
            {receita.nome}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/70">
            {receita.tempo_preparo != null && (
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock className="size-4" />
                {receita.tempo_preparo} min
              </span>
            )}
            {receita.dificuldade && (
              <span className="flex items-center gap-1.5 font-semibold">
                <BarChart3 className="size-4" />
                {rotuloDificuldade(receita.dificuldade)}
              </span>
            )}
            {receita.porcoes != null && (
              <span className="flex items-center gap-1.5 font-semibold">
                <ShoppingBasket className="size-4" />
                {receita.porcoes} {receita.porcoes === 1 ? 'porção' : 'porções'}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => favoritoMutation.mutate()}
            disabled={favoritoMutation.isPending}
            aria-pressed={isFavorito}
            className={cn(
              'h-12 rounded-full px-5 text-[15px] font-bold',
              !isFavorito &&
                'bg-foreground text-background hover:bg-foreground/90',
            )}
          >
            <Heart
              className="size-5"
              fill={isFavorito ? 'currentColor' : 'none'}
            />
            {favoritoMutation.isPending
              ? 'Salvando...'
              : isFavorito
                ? 'Favoritada'
                : 'Favoritar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={compartilhar}
            className="h-12 rounded-full px-5 text-[15px] font-bold"
          >
            {linkCopiado ? <Check className="size-5" /> : <Share2 className="size-5" />}
            {linkCopiado ? 'Link copiado!' : 'Compartilhar'}
          </Button>
          {isAutor && (
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/home/recipes/${receita.id}/edit`)}
              className="h-12 rounded-full px-5 text-[15px] font-bold"
            >
              <Pencil className="size-5" />
              Editar
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {/* Ingredientes */}
          <Card className="gap-0 rounded-[20px] border-foreground/10 p-5 shadow-none md:col-span-2">
            <h2 className="text-lg font-extrabold tracking-tight">Ingredientes</h2>
            {receita.ingredientes.length > 0 ? (
              <ul className="mt-3 divide-y divide-foreground/10">
                {receita.ingredientes.map((ing) => (
                  <li key={ing.ingrediente_id} className="flex items-baseline justify-between gap-3 py-2.5 text-[15px]">
                    <span className="font-medium">{ing.nome}</span>
                    {ing.quantidade && (
                      <span className="shrink-0 rounded-full bg-foreground/[0.07] px-2.5 py-1 text-[13px] font-bold text-foreground/70">
                        {ing.quantidade}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[15px] text-foreground/70">
                Nenhum ingrediente cadastrado para esta receita.
              </p>
            )}
          </Card>

          {/* Modo de preparo */}
          <Card className="gap-0 rounded-[20px] border-foreground/10 p-5 shadow-none md:col-span-3">
            <h2 className="text-lg font-extrabold tracking-tight">Modo de preparo</h2>
            {passos.length > 0 ? (
              <ol className="mt-3 space-y-3">
                {passos.map((passo, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C0392B]/10 text-[13px] font-extrabold text-[#C0392B]"
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
    </div>
  )
}
