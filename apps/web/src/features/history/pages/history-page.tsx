import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { fetchWithAuth, mensagemDeErro } from '@/lib/api'
import { plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import { RecipeCard, RecipeGridSkeleton } from '@/shared/components/recipe-card'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { HistoricoItem } from '@/types'

function rotuloDia(data: Date, hoje = new Date()): string {
  const inicio = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dias = Math.round((inicio(hoje) - inicio(data)) / 86_400_000)
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function horario(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function HistoryPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: () => fetchWithAuth<HistoricoItem[]>('/history'),
  })

  const grupos = useMemo(() => {
    const ordenados = [...(data ?? [])].sort(
      (a, b) => new Date(b.visualizado_em).getTime() - new Date(a.visualizado_em).getTime(),
    )
    const mapa = new Map<string, HistoricoItem[]>()
    for (const item of ordenados) {
      const dia = rotuloDia(new Date(item.visualizado_em))
      mapa.set(dia, [...(mapa.get(dia) ?? []), item])
    }
    return [...mapa.entries()]
  }, [data])

  const total = data?.length ?? 0

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6 pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[34px] leading-none font-extrabold tracking-tight">Histórico</h1>
        <p className="text-sm text-foreground/70" aria-live="polite">
          {total === 0
            ? 'Receitas visualizadas recentemente'
            : plural(total, 'receita visualizada', 'receitas visualizadas')}
        </p>
      </header>

      {isLoading ? (
        <RecipeGridSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-destructive">{mensagemDeErro(error, 'Erro ao carregar histórico.')}</p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex size-[72px] items-center justify-center rounded-full bg-primary/15 text-primary">
            <History className="size-8" />
          </span>
          <h2 className="text-xl leading-tight font-bold">Nenhuma receita visualizada</h2>
          <p className="max-w-[280px] text-[15px] leading-relaxed text-foreground/70">
            As receitas que você abrir vão aparecer aqui.
          </p>
          <Link
            to="/"
            className={cn(buttonVariants(), 'mt-2 h-12 rounded-full px-6 text-[15px] font-bold')}
          >
            Descobrir receitas
          </Link>
        </div>
      ) : (
        grupos.map(([dia, itens]) => (
          <section key={dia} aria-label={dia} className="flex flex-col gap-3">
            <h2 className="text-sm font-extrabold text-foreground/60">{dia}</h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {itens.map((item) => (
                <li key={item.id}>
                  <RecipeCard
                    receita={item.receita}
                    usuarioId={user?.id}
                    rodape={
                      <time dateTime={item.visualizado_em} className="text-xs text-foreground/60">
                        Vista às {horario(item.visualizado_em)}
                      </time>
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
