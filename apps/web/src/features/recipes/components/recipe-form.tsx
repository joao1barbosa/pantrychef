import { useId } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Ingrediente } from '@/types'
import { CATEGORIAS_SUGERIDAS, recipeSchema, type RecipeFormData } from '../utils/recipe-schema'

export type { RecipeFormData }

interface RecipeFormProps {
  ingredientes: Pick<Ingrediente, 'id' | 'nome'>[]
  defaultValues?: Partial<RecipeFormData>
  isPending: boolean
  error: string | null
  submitLabel: string
  pendingLabel: string
  onSubmit: (data: RecipeFormData) => void
}

const campoSelect =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary aria-invalid:border-destructive'

function Erro({ mensagem }: { mensagem?: string }) {
  return mensagem ? <p className="text-sm text-destructive">{mensagem}</p> : null
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
  const listaCategorias = useId()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
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

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredientes' })
  const escolhidos = useWatch({ control, name: 'ingredientes' }) ?? []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da receita</Label>
        <Input
          id="nome"
          className="h-11"
          placeholder="Ex.: Bolo de cenoura"
          aria-invalid={!!errors.nome}
          {...register('nome')}
        />
        <Erro mensagem={errors.nome?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Input
            id="categoria"
            className="h-11"
            list={listaCategorias}
            placeholder="Ex.: Almoço"
            aria-invalid={!!errors.categoria}
            {...register('categoria')}
          />
          <datalist id={listaCategorias}>
            {CATEGORIAS_SUGERIDAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Erro mensagem={errors.categoria?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tempo_preparo">Tempo (min)</Label>
          <Input
            id="tempo_preparo"
            className="h-11"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            placeholder="Ex.: 30"
            aria-invalid={!!errors.tempo_preparo}
            {...register('tempo_preparo', {
              setValueAs: (v) => (v === '' || v == null ? undefined : v),
            })}
          />
          <Erro mensagem={errors.tempo_preparo?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dificuldade">Dificuldade</Label>
          <select
            id="dificuldade"
            {...register('dificuldade', { setValueAs: (v) => (v === '' ? undefined : v) })}
            className={campoSelect}
          >
            <option value="">Selecione...</option>
            <option value="facil">Fácil</option>
            <option value="medio">Média</option>
            <option value="dificil">Difícil</option>
          </select>
          <Erro mensagem={errors.dificuldade?.message} />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm leading-none font-medium">Ingredientes</legend>
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const usadosEmOutras = new Set(
              escolhidos.filter((_, i) => i !== index).map((item) => item?.ingrediente_id),
            )
            const erroLinha = errors.ingredientes?.[index]
            return (
              <li key={field.id} className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <select
                    aria-label={`Ingrediente ${index + 1}`}
                    aria-invalid={!!erroLinha?.ingrediente_id}
                    {...register(`ingredientes.${index}.ingrediente_id` as const)}
                    className={campoSelect}
                  >
                    <option value="">Selecione um ingrediente...</option>
                    {ingredientes
                      .filter((ing) => !usadosEmOutras.has(ing.id))
                      .map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.nome}
                        </option>
                      ))}
                  </select>
                  <Erro mensagem={erroLinha?.ingrediente_id?.message} />
                </div>
                <div className="w-28 space-y-1 sm:w-36">
                  <Input
                    className="h-11"
                    aria-label={`Quantidade ${index + 1}`}
                    placeholder="Qtd. (ex.: 2 xíc.)"
                    aria-invalid={!!erroLinha?.quantidade}
                    {...register(`ingredientes.${index}.quantidade` as const)}
                  />
                  <Erro mensagem={erroLinha?.quantidade?.message} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ingrediente ${index + 1}`}
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                  className="size-11"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            )
          })}
        </ul>
        <Erro
          mensagem={
            typeof errors.ingredientes?.message === 'string'
              ? errors.ingredientes.message
              : errors.ingredientes?.root?.message
          }
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ ingrediente_id: '', quantidade: '' })}
          className="h-10 gap-1.5 rounded-full px-4"
        >
          <Plus className="size-4" />
          Adicionar ingrediente
        </Button>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="modo_preparo">Modo de preparo</Label>
        <textarea
          id="modo_preparo"
          rows={7}
          placeholder={'1. Pré-aqueça o forno...\n2. Misture os ingredientes...'}
          aria-invalid={!!errors.modo_preparo}
          {...register('modo_preparo')}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary aria-invalid:border-destructive md:text-sm"
        />
        <p className="text-xs text-foreground/60">
          Dica: numere os passos (1., 2., 3.) ou use uma linha por passo.
        </p>
        <Erro mensagem={errors.modo_preparo?.message} />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="terracota"
        className="h-12 w-full text-base font-bold"
        disabled={isPending}
      >
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  )
}
