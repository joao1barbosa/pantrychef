import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTema, type PreferenciaTema } from '@/lib/theme'

/** Botão compacto: alterna entre claro e escuro (a partir do tema efetivo). */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { escuro, definir } = useTema()
  const rotulo = escuro ? 'Usar tema claro' : 'Usar tema escuro'
  return (
    <button
      type="button"
      onClick={() => definir(escuro ? 'claro' : 'escuro')}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-lg text-foreground/60 transition-colors outline-none hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary',
        className,
      )}
    >
      {escuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  )
}

const OPCOES: { id: PreferenciaTema; label: string; icon: typeof Sun }[] = [
  { id: 'sistema', label: 'Sistema', icon: Monitor },
  { id: 'claro', label: 'Claro', icon: Sun },
  { id: 'escuro', label: 'Escuro', icon: Moon },
]

/** Seletor completo, incluindo "seguir o sistema". */
export function ThemeSelector() {
  const { preferencia, definir } = useTema()
  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="grid grid-cols-3 gap-1 rounded-2xl bg-foreground/[0.07] p-1"
    >
      {OPCOES.map(({ id, label, icon: Icon }) => {
        const ativo = preferencia === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => definir(id)}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
              ativo
                ? 'bg-card text-foreground shadow-sm'
                : 'text-foreground/70 hover:bg-foreground/5',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
