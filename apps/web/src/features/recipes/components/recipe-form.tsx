import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const recipeSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.string().optional(),
  tempo_preparo: z.coerce.number().int('Deve ser um número inteiro').positive('Tempo deve ser maior que 0').optional(),
  dificuldade: z.enum(['facil', 'medio', 'dificil']).optional(),
  modo_preparo: z.string().min(1, 'Modo de preparo é obrigatório'),
  ingredientes: z
    .array(
      z.object({
        ingrediente_id: z.string().min(1, 'Selecione um ingrediente'),
        quantidade: z.string().optional(),
      }),
    )
    .min(1, 'Adicione pelo menos 1 ingrediente'),
})

export type RecipeFormData = z.input<typeof recipeSchema>

export interface IngredienteOption {
  id: string
  nome: string
}

interface RecipeFormProps {
  ingredientes: IngredienteOption[]
  defaultValues?: Partial<RecipeFormData>
  isPending: boolean
  error: string | null
  submitLabel: string
  pendingLabel: string
  onSubmit: (data: RecipeFormData) => void
}

export function RecipeForm({
  ingredientes,
  defaultValues,
  isPending,
  error,
  submitLabel,
  pendingLabel,
  onSubmit,
}: RecipeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recipeSchema) as any,
    defaultValues: {
      nome: '',
      categoria: '',
      tempo_preparo: undefined,
      dificuldade: undefined,
      modo_preparo: '',
      ingredientes: [{ ingrediente_id: '', quantidade: '' }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredientes',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da receita</Label>
        <Input id="nome" placeholder="Ex.: Bolo de cenoura" {...register('nome')} />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Input id="categoria" placeholder="Ex.: lanche, almoço..." {...register('categoria')} />
          {errors.categoria && (
            <p className="text-sm text-destructive">{errors.categoria.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tempo_preparo">Tempo de preparo (min)</Label>
          <Input
            id="tempo_preparo"
            type="number"
            min={1}
            placeholder="Ex.: 30"
            {...register('tempo_preparo', { setValueAs: (v) => (v === '' ? undefined : v) })}
          />
          {errors.tempo_preparo && (
            <p className="text-sm text-destructive">{errors.tempo_preparo.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dificuldade">Dificuldade</Label>
        <select
          id="dificuldade"
          {...register('dificuldade', { setValueAs: (v) => (v === '' ? undefined : v) })}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">Selecione...</option>
          <option value="facil">Fácil</option>
          <option value="medio">Média</option>
          <option value="dificil">Difícil</option>
        </select>
        {errors.dificuldade && (
          <p className="text-sm text-destructive">{errors.dificuldade.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Ingredientes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ingrediente_id: '', quantidade: '' })}
          >
            <Plus className="size-4" />
            Adicionar ingrediente
          </Button>
        </div>
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <li key={field.id} className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <select
                  aria-label={`Ingrediente ${index + 1}`}
                  {...register(`ingredientes.${index}.ingrediente_id` as const)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Selecione um ingrediente...</option>
                  {ingredientes.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.nome}
                    </option>
                  ))}
                </select>
                {errors.ingredientes?.[index]?.ingrediente_id && (
                  <p className="text-sm text-destructive">
                    {errors.ingredientes[index]?.ingrediente_id?.message}
                  </p>
                )}
              </div>
              <div className="w-28">
                <Input
                  aria-label={`Quantidade ${index + 1}`}
                  placeholder="Qtd."
                  {...register(`ingredientes.${index}.quantidade` as const)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover ingrediente ${index + 1}`}
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
        {errors.ingredientes && typeof errors.ingredientes.message === 'string' && (
          <p className="text-sm text-destructive">{errors.ingredientes.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="modo_preparo">Modo de preparo</Label>
        <textarea
          id="modo_preparo"
          rows={6}
          placeholder={'1. Descreva o passo a passo...'}
          {...register('modo_preparo')}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
        />
        {errors.modo_preparo && (
          <p className="text-sm text-destructive">{errors.modo_preparo.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" variant="terracota" className="h-12 w-full text-base font-bold" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  )
}
