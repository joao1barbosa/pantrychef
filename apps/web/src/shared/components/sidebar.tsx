import { NavLink } from 'react-router-dom'
import { Home, Heart, Clock, User, ChefHat, Mail, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/use-auth'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/home/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/home/history', icon: Clock, label: 'Histórico' },
  { to: '/home/profile', icon: User, label: 'Perfil' },
]

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracota">
          <ChefHat className="h-5 w-5 text-bege" />
        </div>
        <span className="text-lg font-bold text-foreground">PantryChef</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-terracota/10 text-terracota'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="mt-auto border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-foreground/[0.04] px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium truncate">
              <User className="size-4 shrink-0 text-foreground/60" />
              <span className="truncate">{user?.nome}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/60 truncate">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/80"
            aria-label="Sair da conta"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
