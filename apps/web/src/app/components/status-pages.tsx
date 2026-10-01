import type { ReactNode } from 'react'
import { CircleAlert, CookingPot } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StatusMessageProps {
  icon: ReactNode
  titulo: string
  texto: string
  acao?: ReactNode
}

export function StatusMessage({ icon, titulo, texto, acao }: StatusMessageProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex size-[72px] items-center justify-center rounded-full bg-primary/15 text-primary [&_svg]:size-8">
        {icon}
      </span>
      <h1 className="text-2xl font-extrabold tracking-tight">{titulo}</h1>
      <p className="text-[15px] leading-relaxed text-foreground/70">{texto}</p>
      {acao}
    </div>
  )
}

const botaoInicio = cn(buttonVariants(), 'mt-2 h-12 rounded-full px-6 text-[15px] font-bold')

export function NotFoundPage() {
  return (
    <StatusMessage
      icon={<CookingPot />}
      titulo="Página não encontrada"
      texto="O endereço pode estar incorreto ou a página foi removida."
      acao={
        <Link to="/" className={botaoInicio}>
          Voltar para o início
        </Link>
      }
    />
  )
}

export function ErrorPage() {
  return (
    <div className="flex min-h-screen items-center bg-background">
      <StatusMessage
        icon={<CircleAlert />}
        titulo="Algo deu errado"
        texto="Ocorreu um erro inesperado. Recarregue a página ou volte para o início."
        acao={
          <a href="/" className={botaoInicio}>
            Voltar para o início
          </a>
        }
      />
    </div>
  )
}

export function CarregandoApp() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
      <span className="size-8 animate-spin rounded-full border-4 border-terracota/20 border-t-terracota" />
      <span className="sr-only">Carregando...</span>
    </div>
  )
}
