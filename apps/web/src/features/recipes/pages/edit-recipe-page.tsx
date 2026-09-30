import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
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

interface RecipeOut {
  id: string
  nome: string
  categoria?: string | null
  tempo_preparo?: number | null
  dificuldade?: string | null
  modo_preparo: string
  ingredientes: Array<{ ingrediente_id: string; quantidade?: string | null }>
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

export function EditRecipePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const {
    data: recipe,
    isLoading,
    isError,
    error: fetchError,
  } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchWithAuth(`/recipes/${id}`) as Promise<RecipeOut>,
    enabled: Boolean(id),
    retry: false,
  })

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => fetchWithAuth('/ingredients') as Promise<IngredientOut[]>,
  })

  const defaults = useMemo<RecipeFormData | undefined>(() => {
    if (!recipe) return undefined
    return {
      nome: recipe.nome,
      categoria: recipe.categoria ?? '',
      tempo_preparo: recipe.tempo_preparo ?? undefined,
      dificuldade: (recipe.dificuldade ?? undefined) as RecipeFormData['dificuldade'],
      modo_preparo: recipe.modo_preparo,
      ingredientes:
        recipe.ingredientes.length > 0
          ? recipe.ingredientes.map((i) => ({
              ingrediente_id: i.ingrediente_id,
              quantidade: i.quantidade ?? '',
            }))
          : [{ ingrediente_id: '', quantidade: '' }],
    }
  }, [recipe])

  const mutation = useMutation({
    mutationFn: (data: RecipeFormData) =>
      fetchWithAuth(`/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(data)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/home/recipes/${id}`)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar receita.')
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-96 animate-pulse rounded-[20px] bg-foreground/10" />
        <p className="sr-only">Carregando receita...</p>
      </div>
    )
  }

  const fetchMessage = fetchError instanceof Error ? fetchError.message : ''
  const isForbidden =
    isError && (fetchMessage.includes('403') || fetchMessage.toLowerCase().includes('permiss'))
  const isNotFound = isError && fetchMessage.includes('404')

  if (isError || !recipe) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-destructive">
          {isForbidden
            ? 'Você não tem permissão para editar esta receita (apenas o autor pode editar).'
            : isNotFound
              ? 'Receita não encontrada.'
              : 'Erro ao carregar receita. Tente novamente.'}
        </p>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    )
  }

  if (!defaults) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
        <div className="h-96 animate-pulse rounded-[20px] bg-foreground/10" />
        <p className="sr-only">Preparando formulário...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
      <header className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-[28px] leading-none font-extrabold tracking-tight">Editar receita</h1>
          <p className="mt-1 text-sm text-foreground/70">Atualize sua receita</p>
        </div>
      </header>

      <Card className="rounded-[20px] border-foreground/10 p-5 shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-extrabold">{recipe.nome}</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <RecipeForm
            key={recipe.id}
            ingredientes={ingredients}
            defaultValues={defaults}
            isPending={mutation.isPending}
            error={error}
            submitLabel="Salvar alterações"
            pendingLabel="Salvando..."
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
