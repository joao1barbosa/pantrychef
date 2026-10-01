import { Navigate, useLocation } from 'react-router-dom'

/** Links antigos (/home, /home/recipes/:id...) continuam funcionando. */
export function LegacyHomeRedirect() {
  const { pathname, search } = useLocation()
  const destino = pathname.replace(/^\/home/, '') || '/'
  return <Navigate to={destino + search} replace />
}
