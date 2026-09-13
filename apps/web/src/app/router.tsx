import { Suspense, lazy } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MainLayout } from './layouts/main-layout'
import { AuthLayout } from './layouts/auth-layout'
import { ProtectedRoute } from './components/protected-route'
import { HomePage } from '@/features/recipes/pages/home-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { RecipesPage } from '@/features/recipes/pages/recipes-page'
import { RecipeDetailPage } from '@/features/recipes/pages/recipe-detail-page'
import { IngredientsPage } from '@/features/recipes/pages/ingredients-page'

const FavoritesPage = lazy(() =>
  import('@/features/favorites/pages/favorites-page').then((m) => ({
    default: m.FavoritesPage,
  })),
)
const HistoryPage = lazy(() =>
  import('@/features/history/pages/history-page').then((m) => ({
    default: m.HistoryPage,
  })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/profile-page').then((m) => ({
    default: m.ProfilePage,
  })),
)
const NewRecipePage = lazy(() =>
  import('@/features/recipes/pages/new-recipe-page').then((m) => ({
    default: m.NewRecipePage,
  })),
)
const EditRecipePage = lazy(() =>
  import('@/features/recipes/pages/edit-recipe-page').then((m) => ({
    default: m.EditRecipePage,
  })),
)

function LazyProtected({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando...</div>}>
        {children}
      </Suspense>
    </ProtectedRoute>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'recipes/new', element: <LazyProtected><NewRecipePage /></LazyProtected> },
      { path: 'recipes/:id', element: <RecipeDetailPage /> },
      { path: 'recipes/:id/edit', element: <LazyProtected><EditRecipePage /></LazyProtected> },
      { path: 'ingredients', element: <IngredientsPage /> },
      {
        path: 'favorites',
        element: <LazyProtected><FavoritesPage /></LazyProtected>,
      },
      {
        path: 'history',
        element: <LazyProtected><HistoryPage /></LazyProtected>,
      },
      {
        path: 'profile',
        element: <LazyProtected><ProfilePage /></LazyProtected>,
      },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
