import type { RouteObject } from 'react-router-dom'
import { MainLayout } from './layouts/main-layout'
import { AuthLayout } from './layouts/auth-layout'
import { GuestRoute } from './components/protected-route'
import { LegacyHomeRedirect } from './components/legacy-redirect'
import { rotasLazy } from './lazy-routes'
import { CarregandoApp, ErrorPage, NotFoundPage } from './components/status-pages'
import { HomePage } from '@/features/recipes/pages/home-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { RecipesPage } from '@/features/recipes/pages/recipes-page'
import { RecipeDetailPage } from '@/features/recipes/pages/recipe-detail-page'
import { IngredientsPage } from '@/features/recipes/pages/ingredients-page'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <CarregandoApp />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'recipes', element: <RecipesPage /> },
      {
        path: 'recipes/new',
        lazy: rotasLazy.novaReceita,
      },
      { path: 'recipes/:id', element: <RecipeDetailPage /> },
      {
        path: 'recipes/:id/edit',
        lazy: rotasLazy.editarReceita,
      },
      { path: 'ingredients', element: <IngredientsPage /> },
      {
        path: 'favorites',
        lazy: rotasLazy.favoritos,
      },
      {
        path: 'history',
        lazy: rotasLazy.historico,
      },
      {
        path: 'profile',
        lazy: rotasLazy.perfil,
      },
      { path: 'home/*', element: <LegacyHomeRedirect /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
]
