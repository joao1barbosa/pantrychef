import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from './components/protected-route'

type Carregador = () => Promise<ComponentType>

/**
 * Rota protegida com code splitting pelo `lazy` do React Router: o chunk é baixado
 * antes da navegação, então a página atual continua na tela (sem fallback de
 * Suspense, que no React 19 ficaria visível por ~300 ms).
 */
function rotaProtegida(carregar: Carregador): RouteObject['lazy'] {
  return async () => {
    const Pagina = await carregar()
    return {
      element: (
        <ProtectedRoute>
          <Pagina />
        </ProtectedRoute>
      ),
    }
  }
}

const carregadores = {
  favoritos: () => import('@/features/favorites/pages/favorites-page').then((m) => m.FavoritesPage),
  historico: () => import('@/features/history/pages/history-page').then((m) => m.HistoryPage),
  perfil: () => import('@/features/profile/pages/profile-page').then((m) => m.ProfilePage),
  novaReceita: () =>
    import('@/features/recipes/pages/new-recipe-page').then((m) => m.NewRecipePage),
  editarReceita: () =>
    import('@/features/recipes/pages/edit-recipe-page').then((m) => m.EditRecipePage),
}

export const rotasLazy = {
  favoritos: rotaProtegida(carregadores.favoritos),
  historico: rotaProtegida(carregadores.historico),
  perfil: rotaProtegida(carregadores.perfil),
  novaReceita: rotaProtegida(carregadores.novaReceita),
  editarReceita: rotaProtegida(carregadores.editarReceita),
}

/** Baixa os chunks em segundo plano quando o navegador estiver ocioso. */
export function precarregarRotas() {
  const agendar = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500))
  agendar(() => Object.values(carregadores).forEach((carregar) => carregar().catch(() => {})))
}
