import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Clock, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatarTempo, rotuloDificuldade } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Receita } from '@/types'

const CAPAS = [
  'from-[#2C1810] via-[#5B7553] to-[#D4943A]',
  'from-[#C0392B] via-[#D4943A] to-[#F5F0EB]',
  'from-[#5B7553] via-[#8FA383] to-[#F5F0EB]',
  'from-[#2C1810] via-[#C0392B] to-[#D4943A]',
  'from-[#D4943A] via-[#E8C38A] to-[#5B7553]',
]

function indiceCapa(chave: string) {
  let hash = 0
  for (const c of chave) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  return hash % CAPAS.length
}

export function RecipeCover({
  receita,
  className,
  iconClassName,
  children,
}: {
  receita: Pick<Receita, 'id' | 'nome' | 'categoria'>
  className?: string
  iconClassName?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br dark:brightness-[0.82]',
        CAPAS[indiceCapa(receita.categoria || receita.nome)],
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center text-[#F5F0EB]/45"
      >
        <UtensilsCrossed className={cn('size-10', iconClassName)} strokeWidth={1.25} />
      </div>
      {children}
    </div>
  )
}

export function AiBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn(
        'h-6 gap-1 rounded-full bg-[#2C1810]/85 px-2.5 text-[11px] font-bold text-[#F5F0EB]',
        className,
      )}
      title="Receita criada pela IA a partir dos ingredientes buscados"
    >
      <Sparkles className="size-3!" aria-hidden />
      Criada pela IA
    </Badge>
  )
}

interface RecipeCardProps {
  receita: Pick<
    Receita,
    'id' | 'nome' | 'categoria' | 'tempo_preparo' | 'dificuldade' | 'gerada_por_ia' | 'usuario_id'
  >
  usuarioId?: string
  /** Linha extra abaixo dos metadados (ex.: data de visualização). */
  rodape?: ReactNode
  /** Ação no canto superior direito (ex.: botão de remover favorito). */
  acao?: ReactNode
}

export function RecipeCard({ receita, usuarioId, rodape, acao }: RecipeCardProps) {
  const dificuldade = rotuloDificuldade(receita.dificuldade)
  const ehMinha = Boolean(usuarioId && receita.usuario_id === usuarioId)

  return (
    <Card
      size="sm"
      className="relative h-full gap-2.5 rounded-[20px] border-foreground/10 p-1.5 shadow-none transition-shadow hover:shadow-md"
    >
      <RecipeCover receita={receita} className="h-[124px] rounded-[15px]">
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {receita.gerada_por_ia && <AiBadge />}
          {ehMinha && (
            <Badge className="h-6 rounded-full bg-[#FFFBF7]/95 px-2.5 text-[11px] font-bold text-[#5B7553]">
              Sua receita
            </Badge>
          )}
        </div>
      </RecipeCover>
      <div className="flex flex-1 flex-col gap-2 px-2 pb-2.5">
        {receita.categoria && (
          <Badge
            variant="dourado"
            className="h-[22px] max-w-full self-start truncate rounded-full px-2 text-[11px] font-bold"
          >
            {receita.categoria}
          </Badge>
        )}
        <h3 className="min-h-[39px] text-base leading-tight font-bold">
          <Link
            to={`/recipes/${receita.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[20px] focus-visible:after:ring-2 focus-visible:after:ring-primary"
          >
            {receita.nome}
          </Link>
        </h3>
        {(receita.tempo_preparo != null || dificuldade) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-foreground/70">
            {receita.tempo_preparo != null && (
              <span className="flex items-center gap-1">
                <Clock className="size-[15px]" aria-hidden />
                {formatarTempo(receita.tempo_preparo)}
              </span>
            )}
            {dificuldade && (
              <span className="flex items-center gap-1">
                <BarChart3 className="size-[15px]" aria-hidden />
                {dificuldade}
              </span>
            )}
          </div>
        )}
        {rodape}
      </div>
      {acao && <div className="absolute top-2 right-2 z-10">{acao}</div>}
    </Card>
  )
}

export function RecipeGridSkeleton({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3" aria-hidden>
      {Array.from({ length: quantidade }, (_, i) => (
        <li key={i} className="h-[230px] animate-pulse rounded-[20px] bg-foreground/[0.07]" />
      ))}
    </ul>
  )
}
