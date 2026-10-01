import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { NAV_PRINCIPAL } from './nav-items'

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-16 items-center justify-around">
        {NAV_PRINCIPAL.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-w-16 flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'font-semibold text-terracota'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
