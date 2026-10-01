import { useEffect, useRef, useState } from 'react'
import { Check, Link2, MessageCircle, Share2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const campo = document.createElement('textarea')
    campo.value = texto
    document.body.appendChild(campo)
    campo.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(campo)
    return ok
  }
}

export function ShareMenu({ titulo, url }: { titulo: string; url: string }) {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const temShareNativo = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!aberto) return
    const fechar = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent ? e.key === 'Escape' : !raiz.current?.contains(e.target as Node)
      ) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    document.addEventListener('keydown', fechar)
    return () => {
      document.removeEventListener('mousedown', fechar)
      document.removeEventListener('keydown', fechar)
    }
  }, [aberto])

  const copiar = async () => {
    if (await copiarTexto(url)) {
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    }
    setAberto(false)
  }

  const compartilharNativo = async () => {
    setAberto(false)
    try {
      await navigator.share({ title: titulo, text: `Olha essa receita: ${titulo}`, url })
    } catch {
      // Usuário cancelou o compartilhamento — nada a fazer.
    }
  }

  const linkWhatsApp = `https://wa.me/?text=${encodeURIComponent(`${titulo} — ${url}`)}`
  const item =
    'flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-medium outline-none hover:bg-foreground/5 focus-visible:bg-foreground/5'

  return (
    <div ref={raiz} className="relative">
      <Button
        type="button"
        variant="outline"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="h-12 rounded-full px-5 text-[15px] font-bold"
      >
        {copiado ? <Check className="size-5" /> : <Share2 className="size-5" />}
        {copiado ? 'Link copiado!' : 'Compartilhar'}
      </Button>
      {aberto && (
        <div
          role="menu"
          className="absolute top-full left-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-foreground/10 bg-card py-1 shadow-lg"
        >
          <a
            role="menuitem"
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAberto(false)}
            className={item}
          >
            <MessageCircle className="size-5 text-[#25D366]" aria-hidden />
            WhatsApp
          </a>
          <button role="menuitem" type="button" onClick={copiar} className={item}>
            <Link2 className="size-5" aria-hidden />
            Copiar link
          </button>
          {temShareNativo && (
            <button role="menuitem" type="button" onClick={compartilharNativo} className={item}>
              <Smartphone className="size-5" aria-hidden />
              Mais opções…
            </button>
          )}
        </div>
      )}
    </div>
  )
}
