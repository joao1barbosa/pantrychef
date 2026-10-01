import { useState } from 'react'
import { ScrollRestoration, useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BottomNav } from '@/shared/components/bottom-nav'
import { Sidebar } from '@/shared/components/sidebar'

/**
 * Mantém o conteúdo da rota no momento em que a página montou. Sem isso, a página
 * que está saindo na animação renderizaria a rota nova (o Outlet lê a rota atual).
 */
function FrozenOutlet() {
  const outlet = useOutlet()
  const [congelado] = useState(outlet)
  return congelado
}

export function MainLayout() {
  const location = useLocation()
  const reduzirMovimento = useReducedMotion()
  const deslocamento = reduzirMovimento ? 0 : 24

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen pb-20 md:ml-64 md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ x: deslocamento, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{
              x: -deslocamento / 2,
              opacity: 0,
              transition: { duration: 0.1, ease: 'easeIn' },
            }}
            className="min-h-screen w-full"
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <ScrollRestoration />
    </div>
  )
}
