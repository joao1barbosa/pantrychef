import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { mensagemDeErro } from '@/lib/api'
import { normalizar, plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useIngredientes } from '../hooks/use-recipes'

const MINIMO = 3
const MAXIMO = 10

export function IngredientsPage() {
  const navigate = useNavigate()
  const { data: ingredientes = [], isLoading, isError, error, refetch } = useIngredientes()
  const [termo, setTermo] = useState('')
  const [escolhidos, setEscolhidos] = useState<string[]>([])

  const grupos = useMemo(() => {
    const t = normalizar(termo)
    const filtrados = ingredientes.filter((i) => !t || normalizar(i.nome).includes(t))
    const mapa = new Map<string, typeof filtrados>()
    for (const ingrediente of filtrados) {
      const letra = normalizar(ingrediente.nome).charAt(0).toUpperCase()
      mapa.set(letra, [...(mapa.get(letra) ?? []), ingrediente])
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [ingredientes, termo])

  const alternar = (nome: string) =>
    setEscolhidos((atual) =>
      atual.includes(nome)
        ? atual.filter((n) => n !== nome)
        : atual.length >= MAXIMO
          ? atual
          : [...atual, nome],
    )

  const buscar = () =>
    navigate(`/?${new URLSearchParams(escolhidos.map((n) => ['i', n])).toString()}`)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6 pb-32 md:pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-[30px] leading-none font-extrabold tracking-tight md:text-[34px]">
          Ingredientes
        </h1>
        <p className="text-sm text-foreground/70">
          {ingredientes.length > 0
            ? `${plural(ingredientes.length, 'ingrediente')} no catálogo. `
            : ''}
          Marque os que você tem e busque receitas.
        </p>
      </header>

      <label className="flex h-[52px] items-center gap-2.5 rounded-full bg-foreground/[0.07] px-4 text-foreground/70 focus-within:ring-2 focus-within:ring-primary">
        <Search className="size-[22px] shrink-0" aria-hidden />
        <span className="sr-only">Filtrar ingredientes</span>
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Filtrar ingredientes"
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground/60"
        />
      </label>

      {isLoading ? (
        <div className="flex flex-wrap gap-2" aria-busy="true">
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} className="h-9 w-24 animate-pulse rounded-full bg-foreground/[0.07]" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-destructive">
            {mensagemDeErro(error, 'Erro ao carregar ingredientes.')}
          </p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : grupos.length === 0 ? (
        <p className="py-10 text-center text-foreground/60">
          Nenhum ingrediente encontrado para “{termo}”.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map(([letra, itens]) => (
            <section key={letra} aria-label={`Letra ${letra}`}>
              <h2 className="mb-2 text-sm font-extrabold text-foreground/50">{letra}</h2>
              <ul className="flex flex-wrap gap-2">
                {itens.map((ingrediente) => {
                  const ativo = escolhidos.includes(ingrediente.nome)
                  return (
                    <li key={ingrediente.id}>
                      <button
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => alternar(ingrediente.nome)}
                        className={cn(
                          'flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          ativo
                            ? 'border-verde bg-verde text-white'
                            : 'border-foreground/15 hover:bg-foreground/5',
                        )}
                      >
                        {ativo && <Check className="size-4" aria-hidden />}
                        {ingrediente.nome}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {escolhidos.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-sm">
              <span className="font-semibold">{plural(escolhidos.length, 'selecionado')}:</span>{' '}
              {escolhidos.join(', ')}
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEscolhidos([])}
              className="h-11"
            >
              Limpar
            </Button>
            <Button
              type="button"
              onClick={buscar}
              disabled={escolhidos.length < MINIMO}
              className="h-11 rounded-full px-5 font-bold"
            >
              {escolhidos.length < MINIMO
                ? `Escolha mais ${MINIMO - escolhidos.length}`
                : 'Buscar receitas'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
