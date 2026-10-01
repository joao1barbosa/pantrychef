import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '@/lib/api'

interface RouteGuardProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: RouteGuardProps) {
  const location = useLocation()

  if (!getToken()) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <>{children}</>
}

/** Login e cadastro não fazem sentido para quem já está autenticado. */
export function GuestRoute({ children }: RouteGuardProps) {
  if (getToken()) return <Navigate to="/" replace />
  return <>{children}</>
}
