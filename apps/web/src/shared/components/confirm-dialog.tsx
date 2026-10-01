import { useEffect, useId, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  aberto: boolean
  titulo: string
  descricao: string
  confirmar: string
  cancelar?: string
  carregando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  confirmar,
  cancelar = 'Cancelar',
  carregando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const id = useId()
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const onCancelarRef = useRef(onCancelar)

  useEffect(() => {
    onCancelarRef.current = onCancelar
  }, [onCancelar])

  useEffect(() => {
    if (!aberto) return
    const focoAnterior = document.activeElement as HTMLElement | null
    cancelarRef.current?.focus()
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelarRef.current()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      focoAnterior?.focus()
    }
  }, [aberto])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-descricao`}
        className="w-full max-w-sm rounded-[20px] bg-card p-5 shadow-xl"
      >
        <h2 id={`${id}-titulo`} className="text-lg font-extrabold">
          {titulo}
        </h2>
        <p id={`${id}-descricao`} className="mt-2 text-[15px] text-foreground/70">
          {descricao}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            ref={cancelarRef}
            type="button"
            variant="outline"
            onClick={onCancelar}
            className="h-11 rounded-full px-5"
          >
            {cancelar}
          </Button>
          <Button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            className="h-11 rounded-full bg-terracota px-5 font-bold text-bege hover:bg-terracota/90"
          >
            {carregando ? 'Aguarde...' : confirmar}
          </Button>
        </div>
      </div>
    </div>
  )
}
