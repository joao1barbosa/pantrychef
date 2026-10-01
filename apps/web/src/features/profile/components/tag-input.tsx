import { useId, useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { normalizar } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TagInputProps {
  id?: string
  rotulo: string
  valores: string[]
  sugestoes: string[]
  onChange: (valores: string[]) => void
  variante?: 'dourado' | 'verde'
  placeholder?: string
  max?: number
}

export function TagInput({
  id,
  rotulo,
  valores,
  sugestoes,
  onChange,
  variante = 'dourado',
  placeholder = 'Adicionar outra...',
  max = 20,
}: TagInputProps) {
  const [texto, setTexto] = useState('')
  const idGerado = useId()
  const inputId = id ?? idGerado
  const tem = (valor: string) => valores.some((v) => normalizar(v) === normalizar(valor))
  const cheio = valores.length >= max

  const adicionar = (valor: string) => {
    const limpo = valor.trim().slice(0, 50)
    if (!limpo || tem(limpo) || cheio) return
    onChange([...valores, limpo])
    setTexto('')
  }

  const aoTeclar = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      adicionar(texto)
    }
  }

  const disponiveis = sugestoes.filter((s) => !tem(s))

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {rotulo}
      </label>
      {valores.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={`${rotulo} selecionadas`}>
          {valores.map((v) => (
            <li key={v}>
              <Badge
                variant={variante}
                className="h-8 gap-1 rounded-full py-0 pr-1 pl-3 text-sm font-semibold"
              >
                {v}
                <button
                  type="button"
                  aria-label={`Remover ${v}`}
                  onClick={() => onChange(valores.filter((x) => x !== v))}
                  className="flex size-6 items-center justify-center rounded-full hover:bg-black/10 [&_svg]:size-3.5"
                >
                  <X />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {disponiveis.length > 0 && !cheio && (
        <div className="flex flex-wrap gap-1.5">
          {disponiveis.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => adicionar(s)}
              className={cn(
                'flex h-8 items-center gap-1 rounded-full border border-dashed border-foreground/25 px-3 text-sm text-foreground/70 hover:border-foreground/50 hover:text-foreground',
              )}
            >
              <Plus className="size-3.5" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          id={inputId}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={aoTeclar}
          disabled={cheio}
          maxLength={50}
          placeholder={cheio ? `Máximo de ${max}` : placeholder}
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary md:text-sm"
        />
        <button
          type="button"
          onClick={() => adicionar(texto)}
          disabled={!texto.trim() || cheio}
          className="h-10 rounded-lg border border-border px-3 text-sm font-semibold disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}
