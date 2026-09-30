import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchWithAuth } from '@/lib/api'
import { RecipeForm, type RecipeFormData } from '../components/recipe-form'

interface IngredientOut {
  id: string
  nome: string
  slug: string
}

interface RecipeCreated {
  id: string
}

function buildPayload(data: RecipeFormData) {
  return {
    nome: data.nome,
    categoria: data.categoria || undefined,
    tempo_preparo: data.tempo_preparo ?? undefined,
    dificuldade: data.dificuldade || undefined,
    modo_preparo: data.modo_preparo,
    ingredientes: data.ingredientes.map((i) => ({
      ingrediente_id: i.ingrediente_id,
      quantidade: i.quantidade || undefined,
    })),
  }
}

export function NewRecipePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => fetchWithAuth('/ingredients') as Promise<IngredientOut[]>,
  })

  const mutation = useMutation({
    mutationFn: (data: RecipeFormData) =>
      fetchWithAuth('/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(data)),
      }) as Promise<RecipeCreated>,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/home/recipes/${created.id}`)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao criar receita.')
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
      <header className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-[28px] leading-none font-extrabold tracking-tight">Criar receita</h1>
          <p className="mt-1 text-sm text-foreground/70">Adicione uma nova receita</p>
        </div>
      </header>

      <Card className="rounded-[20px] border-foreground/10 p-5 shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-extrabold">Nova receita</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <RecipeForm
            ingredientes={ingredients}
            isPending={mutation.isPending}
            error={error}
            submitLabel="Criar receita"
            pendingLabel="Criando..."
            onSubmit={(data) => {
              setError(null)
              mutation.mutate(data)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
