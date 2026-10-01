import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { ArrowLeft, Check, Minus, Plus, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { DIFICULDADES } from '@/lib/format'

import { ORIGENS } from './dados'
import {
  FILTROS_PADRAO,
  TEMPO_MINIMO,
  TEMPO_SEM_LIMITE,
  contarFiltrosAtivos,
  formatarTempoMaximo,
  normalizar,
  type Filtros,
} from './filtros'

export interface FiltrosAvancadosProps {
  /** Filtros já aplicados. A tela edita uma cópia até tocar em "Aplicar filtros" */
  valorInicial?: Filtros
  onAplicar: (filtros: Filtros) => void
  onVoltar?: () => void
  className?: string
}

export function FiltrosAvancados({
  valorInicial = FILTROS_PADRAO,
  onAplicar,
  onVoltar,
  className,
}: FiltrosAvancadosProps) {
  const [rascunho, setRascunho] = useState<Filtros>(valorInicial)
  const [ingrediente, setIngrediente] = useState('')
  const tituloRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    tituloRef.current?.focus()
  }, [])

  const atualizar = <K extends keyof Filtros>(chave: K, valor: Filtros[K]) =>
    setRascunho((atual) => ({ ...atual, [chave]: valor }))

  const adicionarIngrediente = (destino: 'incluir' | 'evitar') => {
    const nome = ingrediente.trim().toLowerCase()
    if (!nome) return
    const outro = destino === 'incluir' ? 'evitar' : 'incluir'
    setRascunho((atual) => {
      const jaExiste = atual[destino].some((x) => normalizar(x) === normalizar(nome))
      return {
        ...atual,
        [destino]: jaExiste ? atual[destino] : [...atual[destino], nome],
        [outro]: atual[outro].filter((x) => normalizar(x) !== normalizar(nome)),
      }
    })
    setIngrediente('')
  }

  const aoTeclar = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      adicionarIngrediente('incluir')
    }
  }

  const ativos = contarFiltrosAtivos(rascunho)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-filtros"
      className={cn('flex h-full flex-col bg-background text-foreground', className)}
    >
      <header className="flex h-16 shrink-0 items-center gap-1 px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={onVoltar}
          className="size-12 rounded-full [&_svg]:size-6"
        >
          <ArrowLeft />
        </Button>
        <h1
          id="titulo-filtros"
          ref={tituloRef}
          tabIndex={-1}
          className="flex-1 text-[22px] font-bold tracking-tight outline-none"
        >
          Filtros avançados
        </h1>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setRascunho(FILTROS_PADRAO)
            setIngrediente('')
          }}
          className="h-11 rounded-full px-3.5 text-[15px] font-bold text-primary hover:text-primary"
        >
          Limpar
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-4 pt-2 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-bold">Tempo de preparo</h2>
            <span className="text-[15px] font-bold text-primary">
              {formatarTempoMaximo(rascunho.tempoMaximo)}
            </span>
          </div>
          <input
            type="range"
            min={TEMPO_MINIMO}
            max={TEMPO_SEM_LIMITE}
            step={5}
            value={rascunho.tempoMaximo}
            onChange={(e) => atualizar('tempoMaximo', Number(e.target.value))}
            aria-label="Tempo máximo de preparo"
            aria-valuetext={formatarTempoMaximo(rascunho.tempoMaximo)}
            className="h-11 w-full cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-foreground/70">
            <span>{TEMPO_MINIMO} min</span>
            <span>1 h</span>
            <span>Sem limite</span>
          </div>
        </section>

        <Secao titulo="Dificuldade">
          <Segmentado
            rotulo="Dificuldade"
            valor={rascunho.dificuldade}
            opcoes={[{ id: 'qualquer' as const, label: 'Qualquer' }, ...DIFICULDADES]}
            onChange={(v) => atualizar('dificuldade', v)}
          />
        </Secao>

        <Secao titulo="Ingredientes">
          <div className="flex gap-2">
            <label className="flex h-12 min-w-0 flex-1 items-center rounded-[14px] bg-foreground/[0.07] px-3.5 focus-within:ring-2 focus-within:ring-primary">
              <span className="sr-only">Nome do ingrediente</span>
              <input
                type="text"
                value={ingrediente}
                onChange={(e) => setIngrediente(e.target.value)}
                onKeyDown={aoTeclar}
                placeholder="Ex.: cebola"
                enterKeyHint="done"
                autoCapitalize="none"
                className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-foreground/60"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => adicionarIngrediente('incluir')}
              className="h-12 gap-1 rounded-[14px] pr-3.5 pl-2.5 text-sm font-bold [&_svg]:size-[18px]"
            >
              <Plus />
              Incluir
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => adicionarIngrediente('evitar')}
              className="h-12 gap-1 rounded-[14px] border-[1.5px] border-[#C0392B] bg-transparent pr-3.5 pl-2.5 text-sm font-bold text-[#C0392B] shadow-none hover:bg-[#C0392B]/10 hover:text-[#C0392B] dark:text-foreground dark:hover:text-foreground [&_svg]:size-[18px]"
            >
              <Minus />
              Evitar
            </Button>
          </div>

          <ListaIngredientes
            titulo="Com estes ingredientes"
            vazio="Nenhum ingrediente adicionado"
            itens={rascunho.incluir}
            tom="incluir"
            onRemover={(nome) =>
              atualizar(
                'incluir',
                rascunho.incluir.filter((x) => x !== nome),
              )
            }
          />
          <ListaIngredientes
            titulo="Sem estes ingredientes"
            vazio="Nenhum ingrediente a evitar"
            itens={rascunho.evitar}
            tom="evitar"
            onRemover={(nome) =>
              atualizar(
                'evitar',
                rascunho.evitar.filter((x) => x !== nome),
              )
            }
          />
        </Secao>

        <Secao titulo="Origem da receita">
          <Segmentado
            rotulo="Origem da receita"
            valor={rascunho.origem}
            opcoes={[{ id: 'todas', label: 'Todas' }, ...ORIGENS]}
            onChange={(v) => atualizar('origem', v)}
          />
        </Secao>
      </div>

      <footer className="shrink-0 border-t border-foreground/10 bg-background px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          size="lg"
          onClick={() => onAplicar(rascunho)}
          className="h-14 w-full gap-2.5 rounded-[18px] text-base font-bold"
        >
          Aplicar filtros
          {ativos > 0 && (
            <span
              aria-label={`${ativos} ${ativos === 1 ? 'filtro ativo' : 'filtros ativos'}`}
              className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-foreground px-1.5 text-[13px] font-extrabold text-primary"
            >
              {ativos}
            </span>
          )}
        </Button>
      </footer>
    </div>
  )
}

function Secao({
  titulo,
  ajuda,
  children,
}: {
  titulo: string
  ajuda?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold">{titulo}</h2>
        {ajuda && <span className="text-[13px] text-foreground/70">{ajuda}</span>}
      </div>
      {children}
    </section>
  )
}

export function ChipOpcao({
  selecionado,
  onClick,
  children,
  className,
}: {
  selecionado: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <Button
      type="button"
      variant={selecionado ? 'default' : 'outline'}
      aria-pressed={selecionado}
      onClick={onClick}
      className={cn(
        'h-11 shrink-0 gap-1.5 rounded-full px-4 text-sm font-semibold shadow-none',
        !selecionado &&
          'border-foreground/20 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground',
        className,
      )}
    >
      {selecionado && <Check />}
      {children}
    </Button>
  )
}

function Segmentado<T extends string>({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string
  valor: T
  opcoes: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className="grid gap-1 rounded-2xl bg-foreground/[0.07] p-1"
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
    >
      {opcoes.map((o) => {
        const ativo = o.id === valor
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(o.id)}
            className={cn(
              'h-11 rounded-xl text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
              ativo ? 'bg-foreground text-background' : 'text-foreground hover:bg-foreground/5',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function ListaIngredientes({
  titulo,
  vazio,
  itens,
  tom,
  onRemover,
}: {
  titulo: string
  vazio: string
  itens: string[]
  tom: 'incluir' | 'evitar'
  onRemover: (nome: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-foreground/70">{titulo}</span>
      <div className="flex flex-wrap gap-2">
        {itens.length === 0 && <span className="text-sm text-foreground/70">{vazio}</span>}
        {itens.map((nome) => (
          <Badge
            key={nome}
            variant={tom === 'incluir' ? 'verde' : 'terracota'}
            className={cn(
              'h-9 rounded-full py-0 pr-0 pl-3.5 text-sm font-semibold',
              tom === 'incluir'
                ? 'bg-[#5B7553]/15 text-[#3F5539] dark:bg-[#5B7553] dark:text-white'
                : 'bg-[#C0392B]/[0.12] text-[#A93226] dark:bg-[#C0392B] dark:text-white',
            )}
          >
            <span>{nome.charAt(0).toUpperCase() + nome.slice(1)}</span>
            <button
              type="button"
              aria-label={`Remover ${nome}`}
              onClick={() => onRemover(nome)}
              className="-my-1 flex h-11 w-10 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-current [&_svg]:size-4"
            >
              <X />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
