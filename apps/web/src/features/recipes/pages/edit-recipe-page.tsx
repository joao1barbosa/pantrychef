import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Lock, UtensilsCrossed } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ApiError, fetchWithAuth, mensagemDeErro } from '@/lib/api'
import { cn } from '@/lib/utils'
import { StatusMessage } from '@/app/components/status-pages'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { Receita } from '@/types'
import { RecipeForm } from '../components/recipe-form'
import { useIngredientes, useRecipe } from '../hooks/use-recipes'
import { buildRecipePayload, recipeToFormData, type RecipeFormData } from '../utils/recipe-schema'

export function EditRecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isLoading: carregandoUsuario } = useAuth()

  const { data: receita, isLoading, error } = useRecipe(id, { registrar: false })
  const { data: ingredientes = [], isLoading: carregandoIngredientes } = useIngredientes()

  const mutation = useMutation({
    mutationFn: (data: RecipeFormData) =>
      fetchWithAuth<Receita>(`/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRecipePayload(data)),
      }),
    onSuccess: (atualizada) => {
      queryClient.setQueryData(['recipe', id], atualizada)
      queryClient.removeQueries({ queryKey: ['recipe', id, 'sem-registro'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      navigate(`/recipes/${id}`, { replace: true })
    },
  })

  if (isLoading || carregandoUsuario || carregandoIngredientes) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6" aria-busy="true">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-96 animate-pulse rounded-[20px] bg-foreground/10" />
        <p className="sr-only">Carregando receita...</p>
      </div>
    )
  }

  const botao = cn(buttonVariants(), 'mt-2 h-12 rounded-full px-6 text-[15px] font-bold')

  if (error || !receita) {
    const status = error instanceof ApiError ? error.status : 404
    const naoEncontrada = status === 404 || status === 422
    return (
      <StatusMessage
        icon={<UtensilsCrossed />}
        titulo={naoEncontrada ? 'Receita não encontrada' : 'Erro ao carregar receita'}
        texto={
          naoEncontrada
            ? 'Essa receita pode ter sido removida ou o link está incorreto.'
            : mensagemDeErro(error, 'Tente novamente em instantes.')
        }
        acao={
          <Link to="/" className={botao}>
            Voltar para o início
          </Link>
        }
      />
    )
  }

  const ehAutor = Boolean(user && receita.usuario_id === user.id)
  const erroMutacao = mutation.error instanceof ApiError && mutation.error.status === 403

  if (!ehAutor || erroMutacao) {
    return (
      <StatusMessage
        icon={<Lock />}
        titulo="Sem permissão para editar"
        texto="Apenas quem criou a receita pode editá-la."
        acao={
          <Link to={`/recipes/${receita.id}`} className={botao}>
            Ver receita
          </Link>
        }
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
      <header className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          className="size-11"
          onClick={() => navigate(`/recipes/${receita.id}`)}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-[28px] leading-none font-extrabold tracking-tight">Editar receita</h1>
          <p className="mt-1 truncate text-sm text-foreground/70">{receita.nome}</p>
        </div>
      </header>

      <Card className="rounded-[20px] border-foreground/10 p-5 shadow-none">
        <CardContent className="px-0">
          <RecipeForm
            key={receita.id}
            ingredientes={ingredientes}
            defaultValues={recipeToFormData(receita)}
            isPending={mutation.isPending}
            error={
              mutation.isError ? mensagemDeErro(mutation.error, 'Erro ao atualizar receita.') : null
            }
            submitLabel="Salvar alterações"
            pendingLabel="Salvando..."
            onSubmit={(data) => mutation.mutate(data)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
