import { useEffect, useState } from 'react'
import { Plus, Search, SearchX } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { mensagemDeErro } from '@/lib/api'
import { DIFICULDADES } from '@/lib/format'
import { cn } from '@/lib/utils'
import { RecipeCard, RecipeGridSkeleton } from '@/shared/components/recipe-card'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { Dificuldade, Ordenacao } from '@/types'
import { useRecipes, type FiltrosReceitas } from '../hooks/use-recipes'

const ORDENACOES: { id: Ordenacao; label: string }[] = [
  { id: 'recentes', label: 'Mais recentes' },
  { id: 'populares', label: 'Mais favoritadas' },
  { id: 'tempo_asc', label: 'Mais rápidas' },
  { id: 'nome_asc', label: 'Nome (A–Z)' },
]

const TEMPOS = [15, 30, 60]
const selectClasse =
  'h-10 rounded-full border border-foreground/15 bg-background px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary'

function lerFiltros(params: URLSearchParams): FiltrosReceitas {
  return {
    nome: params.get('nome') ?? '',
    dificuldade: (params.get('dificuldade') as Dificuldade | null) ?? '',
    tempoMax: Number(params.get('tempo_max')) || null,
    ordenacao: (params.get('ordenacao') as Ordenacao | null) ?? 'recentes',
  }
}

export function RecipesPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const filtros = lerFiltros(params)
  const [termo, setTermo] = useState(filtros.nome ?? '')

  const atualizar = (chave: string, valor: string | number | null | undefined) => {
    setParams(
      (atual) => {
        const novo = new URLSearchParams(atual)
        if (valor === '' || valor == null) novo.delete(chave)
        else novo.set(chave, String(valor))
        return novo
      },
      { replace: true },
    )
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      if ((params.get('nome') ?? '') !== termo.trim()) atualizar('nome', termo.trim())
    }, 350)
    return () => window.clearTimeout(t)
  }, [termo]) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: receitas = [],
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRecipes(filtros)

  const temFiltro = Boolean(filtros.nome || filtros.dificuldade || filtros.tempoMax)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6 pb-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] leading-none font-extrabold tracking-tight md:text-[34px]">
            Receitas
          </h1>
          <p className="text-sm text-foreground/70">Todo o acervo da comunidade e da IA.</p>
        </div>
        <Link
          to="/recipes/new"
          className={cn(
            buttonVariants({ variant: 'terracota' }),
            'h-11 shrink-0 gap-1.5 rounded-full px-4 font-bold',
          )}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova receita</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </header>

      <label className="flex h-[52px] items-center gap-2.5 rounded-full bg-foreground/[0.07] px-4 text-foreground/70 focus-within:ring-2 focus-within:ring-primary">
        <Search className="size-[22px] shrink-0" aria-hidden />
        <span className="sr-only">Buscar receitas pelo nome</span>
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar pelo nome da receita"
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground/60"
        />
      </label>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
        <label>
          <span className="sr-only">Ordenar por</span>
          <select
            value={filtros.ordenacao}
            onChange={(e) =>
              atualizar('ordenacao', e.target.value === 'recentes' ? null : e.target.value)
            }
            className={selectClasse}
          >
            {ORDENACOES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Dificuldade</span>
          <select
            value={filtros.dificuldade}
            onChange={(e) => atualizar('dificuldade', e.target.value)}
            className={selectClasse}
          >
            <option value="">Qualquer dificuldade</option>
            {DIFICULDADES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Tempo máximo</span>
          <select
            value={filtros.tempoMax ?? ''}
            onChange={(e) => atualizar('tempo_max', e.target.value)}
            className={selectClasse}
          >
            <option value="">Qualquer tempo</option>
            {TEMPOS.map((t) => (
              <option key={t} value={t}>
                Até {t} min
              </option>
            ))}
          </select>
        </label>
        {temFiltro && (
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-full"
            onClick={() => {
              setTermo('')
              setParams(new URLSearchParams(), { replace: true })
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      <section aria-live="polite" aria-busy={isLoading}>
        {isLoading ? (
          <RecipeGridSkeleton quantidade={6} />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-destructive">
              {mensagemDeErro(error, 'Erro ao carregar receitas.')}
            </p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : receitas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <SearchX className="size-6" />
            </span>
            <h2 className="text-xl font-bold">
              {temFiltro ? 'Nada encontrado' : 'Nenhuma receita ainda'}
            </h2>
            <p className="max-w-[320px] text-[15px] text-foreground/70">
              {temFiltro ? 'Tente outros filtros ou outro nome.' : 'Que tal cadastrar a primeira?'}
            </p>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {receitas.map((receita) => (
                <li key={receita.id}>
                  <RecipeCard receita={receita} usuarioId={user?.id} />
                </li>
              ))}
            </ul>
            {hasNextPage && (
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mx-auto mt-4 flex h-11 rounded-full px-6 font-semibold"
              >
                {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
