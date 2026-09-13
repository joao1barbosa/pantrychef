import { NavLink } from 'react-router-dom'
import { Home, Heart, Clock, User, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/history', icon: Clock, label: 'Histórico' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export function Sidebar() {
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
    </aside>
  )
}
