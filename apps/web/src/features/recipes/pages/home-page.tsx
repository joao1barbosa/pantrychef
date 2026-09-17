import { useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { BarChart3, Clock, Search, SlidersHorizontal, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchWithAuth } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Ingrediente {
  id: string
  nome: string
  slug: string
}

interface ReceitaIngrediente {
  nome: string
}

interface Receita {
  id: string
  nome: string
  categoria?: string | null
  tempo_preparo?: number | null
  dificuldade?: string | null
  ingredientes?: ReceitaIngrediente[] | null
}

type DificuldadeFiltro = '' | 'facil' | 'medio' | 'dificil'
type Ordenacao = '' | 'tempo_asc' | 'tempo_desc' | 'nome_asc' | 'nome_desc' | 'recentes'

const DIFICULDADES: { id: Exclude<DificuldadeFiltro, ''>; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'medio', label: 'Média' },
  { id: 'dificil', label: 'Difícil' },
]

function rotuloDificuldade(dificuldade: string | null | undefined): string {
  if (dificuldade === 'medio') return 'Média'
  if (dificuldade === 'dificil') return 'Difícil'
  if (dificuldade === 'facil') return 'Fácil'
  return dificuldade ?? '—'
}

export function HomePage() {
  const navigate = useNavigate()
  const [termo, setTermo] = useState('')
  const [selecionados, setSelecionados] = useState<Ingrediente[]>([])
  const [categoria, setCategoria] = useState('')
  const [tempoMax, setTempoMax] = useState('')
  const [dificuldade, setDificuldade] = useState<DificuldadeFiltro>('')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [buscou, setBuscou] = useState(false)

  const { data: ingredientes = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => fetchWithAuth('/ingredients') as Promise<Ingrediente[]>,
  })

  const sugestoes = useMemo(() => {
    const t = termo.trim().toLowerCase()
    if (!t) return []
    const idsSelecionados = new Set(selecionados.map((s) => s.id))
    return ingredientes
      .filter((i) => i.nome.toLowerCase().includes(t) && !idsSelecionados.has(i.id))
      .slice(0, 6)
  }, [ingredientes, termo, selecionados])

  const searchMutation = useMutation({
    mutationFn: (ids: string[]) =>
      fetchWithAuth('/recipes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientes: ids }),
      }) as Promise<Receita[]>,
    onSuccess: () => setBuscou(true),
  })

  const podeBuscar = selecionados.length >= 3

  const resultadosFiltrados = useMemo(() => {
    let lista = searchMutation.data ?? []
    const cat = categoria.trim().toLowerCase()
    if (cat) lista = lista.filter((r) => r.categoria?.toLowerCase().includes(cat))
    if (tempoMax) {
      const max = Number(tempoMax)
      if (!Number.isNaN(max)) lista = lista.filter((r) => (r.tempo_preparo ?? Infinity) <= max)
    }
    if (dificuldade) lista = lista.filter((r) => r.dificuldade === dificuldade)
    const ordenada = [...lista]
    if (ordenacao === 'tempo_asc')
      ordenada.sort((a, b) => (a.tempo_preparo ?? Infinity) - (b.tempo_preparo ?? Infinity))
    else if (ordenacao === 'tempo_desc')
      ordenada.sort((a, b) => (b.tempo_preparo ?? -Infinity) - (a.tempo_preparo ?? -Infinity))
    else if (ordenacao === 'nome_asc') ordenada.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    else if (ordenacao === 'nome_desc') ordenada.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'))
    return ordenada
  }, [searchMutation.data, categoria, tempoMax, dificuldade, ordenacao])

  const filtrosAtivos =
    (categoria.trim() ? 1 : 0) + (tempoMax ? 1 : 0) + (dificuldade ? 1 : 0) + (ordenacao ? 1 : 0)

  const adicionar = (ingrediente: Ingrediente) => {
    setSelecionados((atual) =>
      atual.some((s) => s.id === ingrediente.id) ? atual : [...atual, ingrediente],
    )
    setTermo('')
  }

  const remover = (id: string) => setSelecionados((atual) => atual.filter((s) => s.id !== id))

  const buscar = () => {
    if (!podeBuscar) return
    searchMutation.mutate(selecionados.map((s) => s.id))
  }

  const limparFiltros = () => {
    setCategoria('')
    setTempoMax('')
    setDificuldade('')
    setOrdenacao('')
  }

  const estado: 'idle' | 'loading' | 'success' | 'empty' | 'error' = searchMutation.isPending
    ? 'loading'
    : searchMutation.isError
      ? 'error'
      : buscou
        ? resultadosFiltrados.length > 0
          ? 'success'
          : 'empty'
        : 'idle'

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-6 pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[34px] leading-none font-extrabold tracking-tight">O que tem na cozinha?</h1>
        <p className="text-sm text-foreground/70">
          Escolha pelo menos 3 ingredientes e descubra receitas.
        </p>
      </header>

      <div className="relative">
        <label className="flex h-[52px] items-center gap-2.5 rounded-full bg-foreground/[0.07] px-4 text-foreground/70 focus-within:ring-2 focus-within:ring-primary">
          <Search className="size-[22px] shrink-0" />
          <span className="sr-only">Buscar ingredientes</span>
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && sugestoes.length > 0) {
                e.preventDefault()
                adicionar(sugestoes[0])
              }
            }}
            placeholder="Buscar ingredientes (ex.: ovo, queijo...)"
            enterKeyHint="search"
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground/60 [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
        {sugestoes.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-lg">
            {sugestoes.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => adicionar(s)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] font-medium outline-none hover:bg-foreground/5 focus-visible:bg-foreground/5"
                >
                  {s.nome}
                  <span className="text-sm text-foreground/50">adicionar</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Ingredientes selecionados">
          {selecionados.map((s) => (
            <Badge
              key={s.id}
              variant="verde"
              className="h-9 gap-1 rounded-full py-0 pr-1 pl-3.5 text-sm font-semibold"
            >
              {s.nome}
              <button
                type="button"
                aria-label={`Remover ${s.nome}`}
                onClick={() => remover(s.id)}
                className="flex size-7 items-center justify-center rounded-full outline-none hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-current [&_svg]:size-4"
              >
                <X />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="lg"
          disabled={!podeBuscar || searchMutation.isPending}
          onClick={buscar}
          className="h-14 flex-1 rounded-[18px] text-base font-bold"
        >
          {searchMutation.isPending ? 'Buscando...' : 'Buscar receitas'}
        </Button>
        <Button
          type="button"
          aria-label={filtrosAtivos > 0 ? `Filtros, ${filtrosAtivos} ativos` : 'Filtros'}
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
      {!podeBuscar && !buscou && (
        <p className="text-sm text-foreground/60">
          Selecione {3 - selecionados.length}{' '}
          {3 - selecionados.length === 1 ? 'ingrediente' : 'ingredientes'} para buscar.
        </p>
      )}

      {filtrosAbertos && (
        <section aria-label="Filtros" className="flex flex-col gap-3 rounded-2xl border border-foreground/10 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Categoria
              <Input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex.: almoço"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Tempo máximo (min)
              <Input
                type="number"
                min={1}
                value={tempoMax}
                onChange={(e) => setTempoMax(e.target.value)}
                placeholder="Ex.: 30"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Dificuldade
              <select
                value={dificuldade}
                onChange={(e) => setDificuldade(e.target.value as DificuldadeFiltro)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Qualquer</option>
                {DIFICULDADES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Ordenação
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Padrão</option>
                <option value="tempo_asc">Mais rápidas</option>
                <option value="tempo_desc">Mais demoradas</option>
                <option value="nome_asc">Nome (A–Z)</option>
                <option value="nome_desc">Nome (Z–A)</option>
                <option value="recentes">Mais recentes</option>
              </select>
            </label>
          </div>
          {filtrosAtivos > 0 && (
            <Button type="button" variant="ghost" onClick={limparFiltros} className="self-start">
              Limpar filtros
            </Button>
          )}
        </section>
      )}

      <main aria-live="polite">
        {estado === 'idle' && (
          <p className="py-10 text-center text-[15px] text-foreground/60">
            Busque por ingredientes para ver receitas aqui.
          </p>
        )}
        {estado === 'loading' && (
          <p className="py-10 text-center text-[15px] text-foreground/60">Buscando receitas...</p>
        )}
        {estado === 'error' && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-[15px] text-destructive">Erro ao buscar receitas. Tente novamente.</p>
            <Button type="button" onClick={buscar}>
              Tentar de novo
            </Button>
          </div>
        )}
        {estado === 'empty' && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <h2 className="text-xl font-bold">Nenhuma receita encontrada</h2>
            <p className="max-w-[300px] text-[15px] text-foreground/70">
              Tente outros ingredientes ou remova alguns filtros.
            </p>
          </div>
        )}
        {estado === 'success' && (
          <>
            <p className="mb-3 text-sm font-semibold">
              {resultadosFiltrados.length === 1 ? '1 receita' : `${resultadosFiltrados.length} receitas`}
            </p>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {resultadosFiltrados.map((receita) => (
                <li key={receita.id}>
                  <CardReceita receita={receita} onAbrir={() => navigate(`/home/recipes/${receita.id}`)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}

function CardReceita({ receita, onAbrir }: { receita: Receita; onAbrir: () => void }) {
  return (
    <Card size="sm" className="relative h-full gap-2.5 rounded-[20px] border-foreground/10 p-1.5 shadow-none">
      <div className="h-[124px] overflow-hidden rounded-[15px] bg-foreground/10" aria-hidden />
      <div className="flex flex-col gap-2 px-2 pb-2.5">
        {receita.categoria && (
          <Badge variant="dourado" className="h-[22px] self-start rounded-full px-2 text-[11px] font-bold">
            {receita.categoria}
          </Badge>
        )}
        <h3 className="min-h-[39px] text-base leading-tight font-bold">
          <button
            type="button"
            onClick={onAbrir}
            className={cn(
              'text-left outline-none after:absolute after:inset-0 after:rounded-[20px]',
              'focus-visible:after:ring-2 focus-visible:after:ring-primary',
            )}
          >
            {receita.nome}
          </button>
        </h3>
        <div className="flex gap-3 text-[13px] text-foreground/70">
          {receita.tempo_preparo != null && (
            <span className="flex items-center gap-1">
              <Clock className="size-[15px]" />
              {receita.tempo_preparo} min
            </span>
          )}
          {receita.dificuldade && (
            <span className="flex items-center gap-1">
              <BarChart3 className="size-[15px]" />
              {rotuloDificuldade(receita.dificuldade)}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
