import { Link, NavLink } from 'react-router-dom'
import { ChefHat, LogIn, LogOut, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { NAV_EXPLORAR, NAV_PRINCIPAL } from './nav-items'

function ItemNav({ to, icon: Icon, label, end }: (typeof NAV_PRINCIPAL)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-terracota/10 text-terracota'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      <Icon size={20} aria-hidden />
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card md:flex">
      <Link to="/" className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracota">
          <ChefHat className="h-5 w-5 text-bege" />
        </div>
        <span className="text-lg font-bold text-foreground">PantryChef</span>
      </Link>

      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {NAV_PRINCIPAL.map((item) => (
            <ItemNav key={item.to} {...item} />
          ))}
        </div>

        <p className="mt-6 mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Explorar
        </p>
        <div className="space-y-1">
          {NAV_EXPLORAR.map((item) => (
            <ItemNav key={item.to} {...item} />
          ))}
        </div>

        <Link
          to="/recipes/new"
          className={cn(
            buttonVariants({ variant: 'terracota' }),
            'mt-6 h-10 w-full gap-2 font-bold',
          )}
        >
          <Plus className="size-4" />
          Nova receita
        </Link>
      </nav>

      <div className="mt-auto border-t border-border p-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3 rounded-xl bg-foreground/[0.04] px-3 py-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-terracota/10 text-terracota">
              <ChefHat className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user?.nome ?? '…'}</div>
              <div className="truncate text-xs text-foreground/60">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/80"
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Entre para salvar favoritos e criar receitas.
            </p>
            <Link
              to="/login"
              className={cn(
                buttonVariants({ variant: 'terracota' }),
                'h-10 w-full gap-2 font-bold',
              )}
            >
              <LogIn className="size-4" />
              Entrar
            </Link>
            <Link
              to="/register"
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 w-full font-semibold')}
            >
              Criar conta
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
