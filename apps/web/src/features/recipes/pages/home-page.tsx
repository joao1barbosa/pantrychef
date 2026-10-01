import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Carrot, Plus, SearchX, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { fetchWithAuth, mensagemDeErro } from '@/lib/api'
import { DIFICULDADES, normalizar, plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import { RecipeCard, RecipeGridSkeleton } from '@/shared/components/recipe-card'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { Dificuldade, Receita } from '@/types'

import { IngredientPicker, type IngredienteSelecionado } from '../components/ingredient-picker'
import { useIngredientes } from '../hooks/use-recipes'

const MINIMO = 3
const POR_PAGINA = 12
const TEMPOS = [15, 30, 60]

type OrdenacaoLocal = '' | 'tempo_asc' | 'nome_asc' | 'recentes'

function MensagemCarregando() {
  const [demorando, setDemorando] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setDemorando(true), 2500)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <div className="flex flex-col gap-4" role="status">
      <p className="flex items-center gap-2 text-[15px] text-foreground/70">
        {demorando ? (
          <>
            <Sparkles className="size-4 animate-pulse text-dourado" aria-hidden />
            Nada no acervo combina exatamente. A IA está criando uma receita para você…
          </>
        ) : (
          'Procurando receitas no acervo…'
        )}
      </p>
      <RecipeGridSkeleton />
    </div>
  )
}

export function HomePage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const buscados = useMemo(() => params.getAll('i'), [params])

  const [selecionados, setSelecionados] = useState<IngredienteSelecionado[]>(() =>
    buscados.map((nome) => ({ nome, conhecido: true })),
  )
  const chaveBusca = buscados.join('\u0000')
  const [chaveAnterior, setChaveAnterior] = useState(chaveBusca)
  if (chaveAnterior !== chaveBusca) {
    setChaveAnterior(chaveBusca)
    setSelecionados((atuais) =>
      buscados.map(
        (nome) =>
          atuais.find((s) => normalizar(s.nome) === normalizar(nome)) ?? { nome, conhecido: true },
      ),
    )
  }
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [categoria, setCategoria] = useState('')
  const [tempoMax, setTempoMax] = useState<number | null>(null)
  const [dificuldade, setDificuldade] = useState<Dificuldade | ''>('')
  const [ordenacao, setOrdenacao] = useState<OrdenacaoLocal>('')
  const [visiveis, setVisiveis] = useState(POR_PAGINA)

  const { data: ingredientes = [] } = useIngredientes()

  const busca = useQuery({
    queryKey: ['search', buscados],
    enabled: buscados.length >= MINIMO,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const receitas = await fetchWithAuth<Receita[]>('/recipes/search-by-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientes: buscados }),
      })
      if (receitas.some((r) => r.gerada_por_ia)) {
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
        queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      }
      return receitas
    },
  })

  const podeBuscar = selecionados.length >= MINIMO
  const selecaoMudou =
    selecionados.length !== buscados.length ||
    selecionados.some((s, i) => normalizar(s.nome) !== normalizar(buscados[i] ?? ''))

  const buscar = () => {
    if (!podeBuscar) return
    setVisiveis(POR_PAGINA)
    if (!selecaoMudou && busca.isError) {
      busca.refetch()
      return
    }
    setParams(new URLSearchParams(selecionados.map((s) => ['i', s.nome])))
  }

  const limparBusca = () => {
    setSelecionados([])
    setParams(new URLSearchParams())
  }

  const resultados = useMemo(() => busca.data ?? [], [busca.data])
  const categorias = useMemo(
    () => [...new Set(resultados.map((r) => r.categoria).filter((c): c is string => !!c))].sort(),
    [resultados],
  )

  const filtrados = useMemo(() => {
    let lista = resultados
    if (categoria) lista = lista.filter((r) => r.categoria === categoria)
    if (tempoMax)
      lista = lista.filter((r) => r.tempo_preparo != null && r.tempo_preparo <= tempoMax)
    if (dificuldade) lista = lista.filter((r) => r.dificuldade === dificuldade)
    const ordenada = [...lista]
    if (ordenacao === 'tempo_asc')
      ordenada.sort((a, b) => (a.tempo_preparo ?? Infinity) - (b.tempo_preparo ?? Infinity))
    else if (ordenacao === 'nome_asc')
      ordenada.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    else if (ordenacao === 'recentes')
      ordenada.sort((a, b) => b.criado_em.localeCompare(a.criado_em))
    return ordenada
  }, [resultados, categoria, tempoMax, dificuldade, ordenacao])

  const filtrosAtivos = [categoria, tempoMax, dificuldade, ordenacao].filter(Boolean).length
  const limparFiltros = () => {
    setCategoria('')
    setTempoMax(null)
    setDificuldade('')
    setOrdenacao('')
  }

  const criadaPelaIa = resultados.length === 1 && resultados[0].gerada_por_ia

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-6 pb-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] leading-none font-extrabold tracking-tight md:text-[34px]">
            O que tem na cozinha?
          </h1>
          <p className="text-sm text-foreground/70">
            Escolha pelo menos {MINIMO} ingredientes e descubra o que preparar.
          </p>
        </div>
        <Link
          to="/recipes/new"
          aria-label="Nova receita"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-11 shrink-0 gap-1.5 rounded-full px-3 font-bold md:hidden',
          )}
        >
          <Plus className="size-5" />
        </Link>
      </header>

      <IngredientPicker
        ingredientes={ingredientes}
        selecionados={selecionados}
        onChange={setSelecionados}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="lg"
          disabled={!podeBuscar || busca.isFetching}
          onClick={buscar}
          className="h-14 flex-1 rounded-[18px] text-base font-bold"
        >
          {busca.isFetching ? 'Buscando...' : 'Buscar receitas'}
        </Button>
        <Button
          type="button"
          aria-label={filtrosAtivos > 0 ? `Filtros, ${filtrosAtivos} ativos` : 'Filtros'}
          aria-expanded={filtrosAbertos}
          variant="outline"
          onClick={() => setFiltrosAbertos((v) => !v)}
          className="relative size-14 shrink-0 rounded-[18px]"
        >
          <SlidersHorizontal />
          {filtrosAtivos > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground ring-2 ring-background">
              {filtrosAtivos}
            </span>
          )}
        </Button>
      </div>
      {!podeBuscar && (
        <p className="-mt-2 text-sm text-foreground/60">
          {selecionados.length === 0
            ? `Adicione pelo menos ${MINIMO} ingredientes para buscar.`
            : `Falta ${plural(MINIMO - selecionados.length, 'ingrediente')} para buscar.`}
        </p>
      )}

      {filtrosAbertos && (
        <section
          aria-label="Filtros dos resultados"
          className="flex flex-col gap-4 rounded-2xl border border-foreground/10 p-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Categoria
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={categorias.length === 0}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              >
                <option value="">
                  {categorias.length === 0 ? 'Busque para filtrar' : 'Todas'}
                </option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Ordenação
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as OrdenacaoLocal)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Mais compatíveis</option>
                <option value="tempo_asc">Mais rápidas</option>
                <option value="nome_asc">Nome (A–Z)</option>
                <option value="recentes">Mais recentes</option>
              </select>
            </label>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-semibold">Tempo máximo</legend>
            <div className="flex flex-wrap gap-2">
              {[null, ...TEMPOS].map((t) => (
                <Chip key={t ?? 'qualquer'} ativo={tempoMax === t} onClick={() => setTempoMax(t)}>
                  {t ? `Até ${t} min` : 'Qualquer'}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-semibold">Dificuldade</legend>
            <div className="flex flex-wrap gap-2">
              {[{ id: '' as const, label: 'Qualquer' }, ...DIFICULDADES].map((d) => (
                <Chip
                  key={d.id || 'qualquer'}
                  ativo={dificuldade === d.id}
                  onClick={() => setDificuldade(d.id)}
                >
                  {d.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          {filtrosAtivos > 0 && (
            <Button type="button" variant="ghost" onClick={limparFiltros} className="self-start">
              Limpar filtros
            </Button>
          )}
        </section>
      )}

      <section aria-live="polite" aria-busy={busca.isFetching}>
        {buscados.length < MINIMO ? (
          <EstadoInicial />
        ) : busca.isFetching ? (
          <MensagemCarregando />
        ) : busca.isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="max-w-md text-[15px] text-destructive">
              {mensagemDeErro(busca.error, 'Erro ao buscar receitas. Tente novamente.')}
            </p>
            <Button type="button" onClick={() => busca.refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <SearchX className="size-6" />
            </span>
            <h2 className="text-xl font-bold">Nenhuma receita encontrada</h2>
            <p className="max-w-[320px] text-[15px] text-foreground/70">
              {filtrosAtivos > 0
                ? 'Nenhum resultado com esses filtros. Tente removê-los.'
                : 'Tente outros ingredientes.'}
            </p>
            {filtrosAtivos > 0 ? (
              <Button type="button" variant="outline" onClick={limparFiltros} className="mt-2">
                Limpar filtros
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={limparBusca} className="mt-2">
                Nova busca
              </Button>
            )}
          </div>
        ) : (
          <>
            {criadaPelaIa && (
              <p className="mb-4 flex items-start gap-2 rounded-2xl bg-dourado/10 px-4 py-3 text-sm">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-dourado" aria-hidden />
                Nenhuma receita do acervo usa só esses ingredientes, então a IA criou esta para
                você.
              </p>
            )}
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{plural(filtrados.length, 'receita')}</p>
              <button
                type="button"
                onClick={limparBusca}
                className="text-sm font-semibold text-foreground/60 hover:text-foreground hover:underline"
              >
                Limpar busca
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {filtrados.slice(0, visiveis).map((receita) => (
                <li key={receita.id}>
                  <RecipeCard receita={receita} usuarioId={user?.id} />
                </li>
              ))}
            </ul>
            {filtrados.length > visiveis && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setVisiveis((v) => v + POR_PAGINA)}
                className="mx-auto mt-4 flex h-11 rounded-full px-6 font-semibold"
              >
                Mostrar mais ({filtrados.length - visiveis})
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        'h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
        ativo
          ? 'border-foreground bg-foreground text-background'
          : 'border-foreground/20 hover:bg-foreground/5',
      )}
    >
      {children}
    </button>
  )
}

function EstadoInicial() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="max-w-sm text-[15px] text-foreground/60">
        Adicione ingredientes para buscar receitas. Se nada do acervo combinar, a IA cria uma
        receita para você.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          to="/recipes"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 gap-2 rounded-full px-4 font-semibold',
          )}
        >
          <BookOpen className="size-4" />
          Explorar receitas
        </Link>
        <Link
          to="/ingredients"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 gap-2 rounded-full px-4 font-semibold',
          )}
        >
          <Carrot className="size-4" />
          Ver ingredientes
        </Link>
      </div>
    </div>
  )
}
