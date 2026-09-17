import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { BarChart3, Clock, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fetchWithAuth } from '@/lib/api'
import { cn } from '@/lib/utils'

interface HistoricoReceita {
  id: string
  nome: string
  categoria?: string | null
  tempo_preparo?: number | null
  dificuldade?: string | null
}

interface HistoricoItem {
  id: string
  visualizado_em: string
  receita: HistoricoReceita
}

function rotuloDificuldade(dificuldade: string | null | undefined): string | null {
  if (dificuldade === 'medio') return 'Média'
  if (dificuldade === 'dificil') return 'Difícil'
  if (dificuldade === 'facil') return 'Fácil'
  return dificuldade ?? null
}

function formatarData(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryPage() {
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: () => fetchWithAuth('/history') as Promise<HistoricoItem[]>,
  })

  const itens = useMemo(() => {
    const lista = [...(data ?? [])]
    lista.sort(
      (a, b) => new Date(b.visualizado_em).getTime() - new Date(a.visualizado_em).getTime(),
    )
    return lista
  }, [data])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Carregando histórico...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-destructive">Erro ao carregar histórico.</p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[34px] leading-none font-extrabold tracking-tight">Histórico</h1>
        <p className="text-sm text-foreground/70" aria-live="polite">
          {itens.length === 0
            ? 'Receitas visualizadas recentemente'
            : itens.length === 1
              ? '1 receita visualizada'
              : `${itens.length} receitas visualizadas`}
        </p>
      </header>

      {itens.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex size-[72px] items-center justify-center rounded-full bg-primary/15 text-primary">
            <History className="size-8" />
          </span>
          <h2 className="text-xl leading-tight font-bold">Nenhuma receita visualizada</h2>
          <p className="max-w-[280px] text-[15px] leading-relaxed text-foreground/70">
            As receitas que você abrir vão aparecer aqui.
          </p>
          <Button
            type="button"
            onClick={() => navigate('/home')}
            className="mt-2 h-12 rounded-full px-6 text-[15px] font-bold"
          >
            Descobrir receitas
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {itens.map((item) => (
            <li key={item.id}>
              <Card
                size="sm"
                className="relative h-full gap-2.5 rounded-[20px] border-foreground/10 p-1.5 shadow-none"
              >
                <div className="h-[124px] overflow-hidden rounded-[15px] bg-foreground/10" aria-hidden />
                <div className="flex flex-col gap-2 px-2 pb-2.5">
                  {item.receita.categoria && (
                    <Badge
                      variant="dourado"
                      className="h-[22px] self-start rounded-full px-2 text-[11px] font-bold"
                    >
                      {item.receita.categoria}
                    </Badge>
                  )}
                  <h3 className="min-h-[39px] text-base leading-tight font-bold">
                    <button
                      type="button"
                      onClick={() => navigate(`/home/recipes/${item.receita.id}`)}
                      className={cn(
                        'text-left outline-none after:absolute after:inset-0 after:rounded-[20px]',
                        'focus-visible:after:ring-2 focus-visible:after:ring-primary',
                      )}
                    >
                      {item.receita.nome}
                    </button>
                  </h3>
                  <div className="flex flex-wrap gap-3 text-[13px] text-foreground/70">
                    {item.receita.tempo_preparo != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-[15px]" />
                        {item.receita.tempo_preparo} min
                      </span>
                    )}
                    {rotuloDificuldade(item.receita.dificuldade) && (
                      <span className="flex items-center gap-1">
                        <BarChart3 className="size-[15px]" />
                        {rotuloDificuldade(item.receita.dificuldade)}
                      </span>
                    )}
                  </div>
                  <time dateTime={item.visualizado_em} className="text-xs text-foreground/60">
                    Vista em {formatarData(item.visualizado_em)}
                  </time>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
