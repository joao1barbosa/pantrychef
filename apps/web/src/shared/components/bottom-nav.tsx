import { NavLink } from 'react-router-dom'
import { Home, Heart, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/home/favorites', icon: Heart, label: 'Favoritos' },
  { to: '/home/history', icon: Clock, label: 'Histórico' },
  { to: '/home/profile', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-border bg-card md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-terracota'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
