import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { BottomNav } from '@/shared/components/bottom-nav'
import { Sidebar } from '@/shared/components/sidebar'

const pageVariants: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
}

export function MainLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pb-20 md:ml-64 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
