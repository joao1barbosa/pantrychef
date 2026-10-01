import { Suspense, lazy } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './protected-route'

export const FavoritesPage = lazy(() =>
  import('@/features/favorites/pages/favorites-page').then((m) => ({
    default: m.FavoritesPage,
  })),
)
export const HistoryPage = lazy(() =>
  import('@/features/history/pages/history-page').then((m) => ({
    default: m.HistoryPage,
  })),
)
export const ProfilePage = lazy(() =>
  import('@/features/profile/pages/profile-page').then((m) => ({
    default: m.ProfilePage,
  })),
)
export const NewRecipePage = lazy(() =>
  import('@/features/recipes/pages/new-recipe-page').then((m) => ({
    default: m.NewRecipePage,
  })),
)
export const EditRecipePage = lazy(() =>
  import('@/features/recipes/pages/edit-recipe-page').then((m) => ({
    default: m.EditRecipePage,
  })),
)

export function LazyProtected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando...</div>}>
        {children}
      </Suspense>
    </ProtectedRoute>
  )
}

/** Links antigos (/home, /home/recipes/:id...) continuam funcionando. */
export function LegacyHomeRedirect() {
  const { pathname, search } = useLocation()
  const destino = pathname.replace(/^\/home/, '') || '/'
  return <Navigate to={destino + search} replace />
}
