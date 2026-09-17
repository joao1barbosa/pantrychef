import { useEffect, useMemo, useRef, useState } from 'react'

import { BarChart3, ChevronDown, Clock, Heart, Search, SlidersHorizontal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import {
  RECEITAS_EXEMPLO,
  REFEICOES,
  rotuloDificuldade,
  rotuloRefeicao,
  type Receita,
  type Refeicao,
} from './dados'
import { FILTROS_PADRAO, aplicarFiltros, contarFiltrosAtivos, normalizar, type Filtros } from './filtros'
import { ChipOpcao, FiltrosAvancados } from './filtros-avancados'

type Ordenacao = 'recentes' | 'rapidas' | 'nome'

export interface FavoritosScreenProps {
  /** Receitas favoritadas pelo usuário (normalmente vindas da API) */
  receitas?: Receita[]
  /** Chamado quando o usuário toca em um card */
  onAbrirReceita?: (receita: Receita) => void
  /** Chamado quando a remoção é confirmada (o aviso "Desfazer" some sem ser tocado) */
  onRemoverFavorito?: (receita: Receita) => void
  /** Chamado ao aplicar filtros, útil para enviar à busca com IA */
  onFiltrosAplicados?: (filtros: Filtros) => void
  onDescobrir?: () => void
  className?: string
}

const DURACAO_AVISO_MS = 5000

const BADGE_REFEICAO: Record<Refeicao, { variant: 'dourado' | 'terracota' | 'verde' | 'default'; className?: string }> = {
  cafe: { variant: 'dourado' },
  almoco: { variant: 'terracota' },
  lanche: { variant: 'verde' },
  jantar: { variant: 'default', className: 'bg-foreground text-background' },
}

export function FavoritosScreen({
  receitas = RECEITAS_EXEMPLO,
  onAbrirReceita,
  onRemoverFavorito,
  onFiltrosAplicados,
  onDescobrir,
  className,
}: FavoritosScreenProps) {
  const [lista, setLista] = useState<Receita[]>(receitas)
  // Sincroniza a cópia local (editável por remoção otimista/desfazer)
  // quando a lista vinda da API muda.
  const [receitasAnteriores, setReceitasAnteriores] = useState(receitas)
  if (receitasAnteriores !== receitas) {
    setReceitasAnteriores(receitas)
    setLista(receitas)
  }
  const [busca, setBusca] = useState('')
  const [refeicao, setRefeicao] = useState<Refeicao | 'todas'>('todas')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recentes')
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [removida, setRemovida] = useState<{ receita: Receita; indice: number } | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendente = useRef<Receita | null>(null)
  const onRemoverRef = useRef(onRemoverFavorito)

  useEffect(() => {
    onRemoverRef.current = onRemoverFavorito
  }, [onRemoverFavorito])

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current)
      if (pendente.current) onRemoverRef.current?.(pendente.current)
    },
    [],
  )

  const confirmarRemocaoPendente = () => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = null
    if (pendente.current) onRemoverRef.current?.(pendente.current)
    pendente.current = null
  }

  const removerFavorito = (receita: Receita) => {
    confirmarRemocaoPendente()
    const indice = lista.findIndex((r) => r.id === receita.id)
    setLista((atual) => atual.filter((r) => r.id !== receita.id))
    setRemovida({ receita, indice })
    pendente.current = receita
    temporizador.current = setTimeout(() => {
      confirmarRemocaoPendente()
      setRemovida(null)
    }, DURACAO_AVISO_MS)
  }

  const desfazerRemocao = () => {
    if (!removida) return
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = null
    pendente.current = null
    setLista((atual) => {
      if (atual.some((r) => r.id === removida.receita.id)) return atual
      const nova = [...atual]
      nova.splice(Math.min(removida.indice, nova.length), 0, removida.receita)
      return nova
    })
    setRemovida(null)
  }

  const totalFiltros = contarFiltrosAtivos(filtros)
  const termo = normalizar(busca)

  const base = useMemo(() => {
    const porBusca = termo ? lista.filter((r) => normalizar(r.nome).includes(termo)) : lista
    return aplicarFiltros(porBusca, filtros)
  }, [lista, termo, filtros])

  const visiveis = useMemo(() => {
    const filtradas = refeicao === 'todas' ? base : base.filter((r) => r.refeicao === refeicao)
    return [...filtradas].sort((a, b) => {
      if (ordenacao === 'rapidas') return a.tempoMinutos - b.tempoMinutos
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR')
      return b.salvaEm.localeCompare(a.salvaEm)
    })
  }, [base, refeicao, ordenacao])

  const chips = [{ id: 'todas' as const, label: 'Todos' }, ...REFEICOES].map((c) => ({
    ...c,
    total: c.id === 'todas' ? base.length : base.filter((r) => r.refeicao === c.id).length,
  }))

  const vazio = (() => {
    if (lista.length === 0)
      return {
        titulo: 'Nenhuma receita salva ainda',
        texto: 'Toque no coração de uma receita para guardá-la aqui.',
        acao: { label: 'Descobrir receitas', onClick: () => onDescobrir?.() },
      }
    if (termo)
      return {
        titulo: `Nada encontrado para “${busca.trim()}”`,
        texto: 'Confira a grafia ou busque por outro nome.',
        acao: { label: 'Limpar busca', onClick: () => setBusca('') },
      }
    if (totalFiltros > 0)
      return {
        titulo: 'Nenhum favorito com esses filtros',
        texto: 'Tente remover alguns filtros para ver mais receitas.',
        acao: { label: 'Limpar filtros', onClick: () => setFiltros(FILTROS_PADRAO) },
      }
    const nome = refeicao === 'todas' ? '' : rotuloRefeicao(refeicao)
    return {
      titulo: `Nenhum favorito em ${nome}`,
      texto: `Descubra receitas de ${nome.toLowerCase()} e salve as que você gostar.`,
      acao: { label: 'Descobrir receitas', onClick: () => onDescobrir?.() },
    }
  })()

  const totalSalvas = lista.length

  return (
    <div
      className={cn(
        // Altura compensa o BottomNav fixo do MainLayout (h-16 + pb-20);
        // no desktop (sidebar, sem bottom nav) ocupa a viewport cheia.
        'relative mx-auto flex h-[calc(100dvh-5rem)] w-full max-w-md flex-col overflow-hidden bg-background text-foreground md:h-dvh',
        className,
      )}
    >
      <div aria-hidden={filtrosAbertos} className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-col gap-4 px-4 pt-6 pb-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[34px] leading-none font-extrabold tracking-tight">Favoritos</h1>
            <p className="text-sm text-foreground/70">
              {totalSalvas === 1 ? '1 receita salva' : `${totalSalvas} receitas salvas`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-full bg-foreground/[0.07] px-4 text-foreground/70 focus-within:ring-2 focus-within:ring-primary">
              <Search className="size-[22px] shrink-0" />
              <span className="sr-only">Buscar nos favoritos</span>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar nos favoritos"
                enterKeyHint="search"
                className="w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-foreground/60 [&::-webkit-search-cancel-button]:hidden"
              />
            </label>
            <Button
              type="button"
              aria-label={
                totalFiltros > 0 ? `Filtros avançados, ${totalFiltros} ativos` : 'Filtros avançados'
              }
              onClick={() => setFiltrosAbertos(true)}
              className="relative size-[52px] shrink-0 rounded-[18px] bg-foreground text-background hover:bg-foreground/90 [&_svg]:size-[22px]"
            >
              <SlidersHorizontal />
              {totalFiltros > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground ring-2 ring-background">
                  {totalFiltros}
                </span>
              )}
            </Button>
          </div>
        </header>

        <div
          role="group"
          aria-label="Filtrar por refeição"
          className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((c) => (
            <ChipOpcao
              key={c.id}
              selecionado={refeicao === c.id}
              onClick={() => setRefeicao(c.id)}
              className="[&>svg]:hidden"
            >
              {c.label}
              <span className="text-xs font-bold opacity-80">{c.total}</span>
            </ChipOpcao>
          ))}
        </div>

        <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" aria-live="polite">
              {visiveis.length === 1 ? '1 receita' : `${visiveis.length} receitas`}
            </p>
            <label className="relative flex h-11 items-center text-sm font-semibold">
              <span className="sr-only">Ordenar por</span>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                className="h-11 cursor-pointer appearance-none rounded-lg bg-transparent pr-6 pl-2 text-right font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="recentes" className="bg-background text-foreground">Mais recentes</option>
                <option value="rapidas" className="bg-background text-foreground">Mais rápidas</option>
                <option value="nome" className="bg-background text-foreground">Nome (A–Z)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 size-[18px]" />
            </label>
          </div>

          {visiveis.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3">
              {visiveis.map((receita) => (
                <li key={receita.id}>
                  <CardReceita
                    receita={receita}
                    onAbrir={() => onAbrirReceita?.(receita)}
                    onRemover={() => removerFavorito(receita)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex size-[72px] items-center justify-center rounded-full bg-primary/15 text-primary">
                <Heart className="size-8" />
              </span>
              <h2 className="text-xl leading-tight font-bold">{vazio.titulo}</h2>
              <p className="max-w-[280px] text-[15px] leading-relaxed text-foreground/70">{vazio.texto}</p>
              <Button
                type="button"
                onClick={vazio.acao.onClick}
                className="mt-2 h-12 rounded-full px-6 text-[15px] font-bold"
              >
                {vazio.acao.label}
              </Button>
            </div>
          )}
        </main>
      </div>

      {removida && (
        <div
          role="status"
          className="absolute inset-x-4 bottom-24 z-30 flex min-h-[52px] items-center justify-between gap-3 rounded-[14px] bg-foreground py-1 pr-1.5 pl-4 text-background shadow-[0_10px_28px_rgba(0,0,0,0.3)]"
        >
          <span className="text-sm">Receita removida dos favoritos</span>
          <button
            type="button"
            onClick={desfazerRemocao}
            className="h-11 rounded-[10px] px-3 text-sm font-bold text-[#D4943A] outline-none focus-visible:ring-2 focus-visible:ring-current dark:text-[#C0392B]"
          >
            Desfazer
          </button>
        </div>
      )}

      {filtrosAbertos && (
        <FiltrosAvancados
          className="absolute inset-0 z-40"
          valorInicial={filtros}
          onVoltar={() => setFiltrosAbertos(false)}
          onAplicar={(novos) => {
            setFiltros(novos)
            setFiltrosAbertos(false)
            onFiltrosAplicados?.(novos)
          }}
        />
      )}
    </div>
  )
}

function CardReceita({
  receita,
  onAbrir,
  onRemover,
}: {
  receita: Receita
  onAbrir: () => void
  onRemover: () => void
}) {
  const [imagemFalhou, setImagemFalhou] = useState(false)
  const badge = BADGE_REFEICAO[receita.refeicao]

  return (
    <Card
      size="sm"
      className="relative h-full gap-2.5 rounded-[20px] border-foreground/10 p-1.5 shadow-none"
    >
      <div className="relative h-[124px] overflow-hidden rounded-[15px] bg-foreground/10">
        {!imagemFalhou && (
          <img
            src={receita.imagem}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImagemFalhou(true)}
            className="size-full object-cover"
          />
        )}
        {receita.origem === 'minha' && (
          <Badge variant="verde" className="absolute top-2.5 left-2.5 h-6 rounded-full px-2.5 text-[11px] font-bold">
            Sua receita
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 px-2 pb-2.5">
        <Badge
          variant={badge.variant}
          className={cn('h-[22px] rounded-full px-2 text-[11px] font-bold', badge.className)}
        >
          {rotuloRefeicao(receita.refeicao)}
        </Badge>
        <h3 className="min-h-[39px] text-base leading-tight font-bold">
          {/* O botão cobre o card inteiro para abrir a receita */}
          <button
            type="button"
            onClick={onAbrir}
            className="text-left outline-none after:absolute after:inset-0 after:rounded-[20px] focus-visible:after:ring-2 focus-visible:after:ring-primary"
          >
            {receita.nome}
          </button>
        </h3>
        <div className="flex gap-3 text-[13px] text-foreground/70">
          <span className="flex items-center gap-1">
            <Clock className="size-[15px]" />
            {receita.tempoMinutos} min
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="size-[15px]" />
            {rotuloDificuldade(receita.dificuldade)}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Remover ${receita.nome} dos favoritos`}
        onClick={onRemover}
        className="group absolute top-2 right-2 z-10 flex size-11 items-center justify-center rounded-full outline-none"
      >
        <span className="flex size-[34px] items-center justify-center rounded-full bg-[#FFFBF7]/95 text-[#C0392B] shadow-sm transition-transform group-active:scale-90 group-focus-visible:ring-2 group-focus-visible:ring-primary dark:bg-[#F5F0EB]/95">
          <Heart fill="currentColor" className="size-[19px]" />
        </span>
      </button>
    </Card>
  )
}
