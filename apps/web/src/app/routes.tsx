import type { RouteObject } from 'react-router-dom'
import { MainLayout } from './layouts/main-layout'
import { AuthLayout } from './layouts/auth-layout'
import { GuestRoute } from './components/protected-route'
import {
  EditRecipePage,
  FavoritesPage,
  HistoryPage,
  LazyProtected,
  LegacyHomeRedirect,
  NewRecipePage,
  ProfilePage,
} from './components/lazy-pages'
import { ErrorPage, NotFoundPage } from './components/status-pages'
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
    children: [
      { index: true, element: <HomePage /> },
      { path: 'recipes', element: <RecipesPage /> },
      {
        path: 'recipes/new',
        element: (
          <LazyProtected>
            <NewRecipePage />
          </LazyProtected>
        ),
      },
      { path: 'recipes/:id', element: <RecipeDetailPage /> },
      {
        path: 'recipes/:id/edit',
        element: (
          <LazyProtected>
            <EditRecipePage />
          </LazyProtected>
        ),
      },
      { path: 'ingredients', element: <IngredientsPage /> },
      {
        path: 'favorites',
        element: (
          <LazyProtected>
            <FavoritesPage />
          </LazyProtected>
        ),
      },
      {
        path: 'history',
        element: (
          <LazyProtected>
            <HistoryPage />
          </LazyProtected>
        ),
      },
      {
        path: 'profile',
        element: (
          <LazyProtected>
            <ProfilePage />
          </LazyProtected>
        ),
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
