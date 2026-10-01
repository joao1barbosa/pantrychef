import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchWithAuth, mensagemDeErro } from '@/lib/api'
import type { Receita } from '@/types'
import { RecipeForm } from '../components/recipe-form'
import { useIngredientes } from '../hooks/use-recipes'
import { buildRecipePayload, type RecipeFormData } from '../utils/recipe-schema'

export function NewRecipePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: ingredientes = [], isLoading: carregandoIngredientes } = useIngredientes()

  const mutation = useMutation({
    mutationFn: (data: RecipeFormData) =>
      fetchWithAuth<Receita>('/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRecipePayload(data)),
      }),
    onSuccess: (criada) => {
      queryClient.setQueryData(['recipe', criada.id], criada)
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      navigate(`/recipes/${criada.id}`, { replace: true })
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
      <header className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          className="size-11"
          onClick={() => (location.key === 'default' ? navigate('/') : navigate(-1))}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-[28px] leading-none font-extrabold tracking-tight">Nova receita</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Compartilhe uma receita com a comunidade
          </p>
        </div>
      </header>

      <Card className="rounded-[20px] border-foreground/10 p-5 shadow-none">
        <CardContent className="px-0">
          {carregandoIngredientes ? (
            <div className="h-96 animate-pulse rounded-[20px] bg-foreground/10" aria-busy="true" />
          ) : (
            <RecipeForm
              ingredientes={ingredientes}
              isPending={mutation.isPending}
              error={
                mutation.isError ? mensagemDeErro(mutation.error, 'Erro ao criar receita.') : null
              }
              submitLabel="Criar receita"
              pendingLabel="Criando..."
              onSubmit={(data) => mutation.mutate(data)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
