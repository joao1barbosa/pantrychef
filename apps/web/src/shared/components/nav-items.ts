import { BookOpen, Carrot, Clock, Heart, Home, User } from 'lucide-react'

export const NAV_PRINCIPAL = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/favorites', icon: Heart, label: 'Favoritos', end: false },
  { to: '/history', icon: Clock, label: 'Histórico', end: false },
  { to: '/profile', icon: User, label: 'Perfil', end: false },
]

export const NAV_EXPLORAR = [
  { to: '/recipes', icon: BookOpen, label: 'Todas as receitas', end: true },
  { to: '/ingredients', icon: Carrot, label: 'Ingredientes', end: true },
]
