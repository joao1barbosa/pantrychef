import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { Plus, Search, Sparkles, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { normalizar } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Ingrediente } from '@/types'
import { sugerirIngredientes, type IngredienteSelecionado } from '../utils/ingredientes'

export type { IngredienteSelecionado }

interface Opcao {
  chave: string
  nome: string
  conhecido: boolean
}

interface IngredientPickerProps {
  ingredientes: Ingrediente[]
  selecionados: IngredienteSelecionado[]
  onChange: (selecionados: IngredienteSelecionado[]) => void
  max?: number
}

export function IngredientPicker({
  ingredientes,
  selecionados,
  onChange,
  max = 10,
}: IngredientPickerProps) {
  const [termo, setTermo] = useState('')
  const [ativo, setAtivo] = useState(-1)
  const listaId = useId()
  const limiteAtingido = selecionados.length >= max

  const opcoes = useMemo<Opcao[]>(() => {
    const sugestoes = sugerirIngredientes(ingredientes, termo, selecionados).map((i) => ({
      chave: i.id,
      nome: i.nome,
      conhecido: true,
    }))
    const texto = termo.trim()
    const exato = ingredientes.some((i) => normalizar(i.nome) === normalizar(texto))
    const repetido = selecionados.some((s) => normalizar(s.nome) === normalizar(texto))
    if (texto && !exato && !repetido) {
      sugestoes.push({ chave: `livre:${texto}`, nome: texto, conhecido: false })
    }
    return sugestoes
  }, [ingredientes, termo, selecionados])

  const adicionar = (opcao: Opcao) => {
    if (limiteAtingido) return
    if (!selecionados.some((s) => normalizar(s.nome) === normalizar(opcao.nome))) {
      onChange([...selecionados, { nome: opcao.nome, conhecido: opcao.conhecido }])
    }
    setTermo('')
    setAtivo(-1)
  }

  const remover = (nome: string) => onChange(selecionados.filter((s) => s.nome !== nome))

  const aoTeclar = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && opcoes.length > 0) {
      e.preventDefault()
      setAtivo((i) => (i + 1) % opcoes.length)
    } else if (e.key === 'ArrowUp' && opcoes.length > 0) {
      e.preventDefault()
      setAtivo((i) => (i <= 0 ? opcoes.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setTermo('')
      setAtivo(-1)
    } else if (e.key === 'Backspace' && !termo && selecionados.length > 0) {
      remover(selecionados[selecionados.length - 1].nome)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (ativo >= 0 && opcoes[ativo]) return adicionar(opcoes[ativo])
      const texto = termo.trim()
      if (!texto) return
      const exato = ingredientes.find((i) => normalizar(i.nome) === normalizar(texto))
      adicionar(
        exato
          ? { chave: exato.id, nome: exato.nome, conhecido: true }
          : { chave: `livre:${texto}`, nome: texto, conhecido: false },
      )
    }
  }

  const aberto = opcoes.length > 0 && !limiteAtingido

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label className="flex h-[52px] items-center gap-2.5 rounded-full bg-foreground/[0.07] px-4 text-foreground/70 focus-within:ring-2 focus-within:ring-primary">
          <Search className="size-[22px] shrink-0" aria-hidden />
          <span className="sr-only">Buscar ingredientes</span>
          <input
            type="text"
            role="combobox"
            aria-expanded={aberto}
            aria-controls={listaId}
            aria-autocomplete="list"
            aria-activedescendant={ativo >= 0 ? `${listaId}-${ativo}` : undefined}
            value={termo}
            disabled={limiteAtingido}
            onChange={(e) => {
              setTermo(e.target.value)
              setAtivo(-1)
            }}
            onKeyDown={aoTeclar}
            placeholder={
              limiteAtingido
                ? `Máximo de ${max} ingredientes`
                : 'Digite um ingrediente (ex.: ovo, queijo...)'
            }
            enterKeyHint="enter"
            autoComplete="off"
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground/60 disabled:cursor-not-allowed"
          />
          {termo && (
            <button
              type="button"
              aria-label="Limpar texto"
              onClick={() => setTermo('')}
              className="flex size-8 items-center justify-center rounded-full hover:bg-foreground/10"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        {aberto && (
          <ul
            id={listaId}
            role="listbox"
            aria-label="Sugestões de ingredientes"
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-lg"
          >
            {opcoes.map((opcao, i) => (
              <li
                key={opcao.chave}
                id={`${listaId}-${i}`}
                role="option"
                aria-selected={i === ativo}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adicionar(opcao)}
                onMouseEnter={() => setAtivo(i)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-[15px] font-medium',
                  i === ativo && 'bg-foreground/5',
                )}
              >
                {opcao.conhecido ? (
                  opcao.nome
                ) : (
                  <span className="flex min-w-0 items-center gap-2">
                    <Sparkles className="size-4 shrink-0 text-dourado" aria-hidden />
                    <span className="truncate">Adicionar “{opcao.nome}”</span>
                  </span>
                )}
                <Plus className="size-4 shrink-0 text-foreground/50" aria-hidden />
              </li>
            ))}
          </ul>
        )}
      </div>

      {selecionados.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Ingredientes selecionados">
          {selecionados.map((s) => (
            <li key={s.nome}>
              <Badge
                variant="verde"
                className={cn(
                  'h-9 gap-1 rounded-full py-0 pr-1 pl-3.5 text-sm font-semibold',
                  !s.conhecido && 'border-dashed border-dourado/60 bg-dourado/10 text-foreground',
                )}
                title={s.conhecido ? undefined : 'Fora do catálogo: será conferido pela IA'}
              >
                {!s.conhecido && <Sparkles className="size-3.5! text-dourado" aria-hidden />}
                {s.nome}
                <button
                  type="button"
                  aria-label={`Remover ${s.nome}`}
                  onClick={() => remover(s.nome)}
                  className="flex size-7 items-center justify-center rounded-full outline-none hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-current [&_svg]:size-4"
                >
                  <X />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
