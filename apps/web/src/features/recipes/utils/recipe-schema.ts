import { z } from 'zod'
import type { Receita, ReceitaPayload } from '@/types'

export const CATEGORIAS_SUGERIDAS = [
  'Café da manhã',
  'Almoço',
  'Jantar',
  'Lanche',
  'Sobremesa',
  'Prato principal',
  'Acompanhamento',
  'Salada',
  'Sopa',
  'Molho',
  'Bebida',
]

export const recipeSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(120, 'Use no máximo 120 caracteres'),
  categoria: z.string().trim().max(60, 'Use no máximo 60 caracteres').optional(),
  tempo_preparo: z.coerce
    .number({ message: 'Informe um número' })
    .int('Deve ser um número inteiro')
    .positive('Tempo deve ser maior que 0')
    .max(1440, 'Máximo de 1440 minutos (24 h)')
    .optional(),
  dificuldade: z.enum(['facil', 'medio', 'dificil']).optional(),
  modo_preparo: z
    .string()
    .trim()
    .min(1, 'Modo de preparo é obrigatório')
    .max(10000, 'Texto muito longo'),
  ingredientes: z
    .array(
      z.object({
        ingrediente_id: z.string().min(1, 'Selecione um ingrediente'),
        quantidade: z.string().trim().max(60, 'Use no máximo 60 caracteres').optional(),
      }),
    )
    .min(1, 'Adicione pelo menos 1 ingrediente')
    .max(50, 'Máximo de 50 ingredientes')
    .superRefine((itens, ctx) => {
      const vistos = new Set<string>()
      itens.forEach((item, index) => {
        if (!item.ingrediente_id) return
        if (vistos.has(item.ingrediente_id)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Ingrediente repetido',
            path: [index, 'ingrediente_id'],
          })
        }
        vistos.add(item.ingrediente_id)
      })
    }),
})

export type RecipeFormData = z.input<typeof recipeSchema>

export function buildRecipePayload(data: RecipeFormData): ReceitaPayload {
  const tempo =
    data.tempo_preparo === undefined || data.tempo_preparo === ''
      ? undefined
      : Number(data.tempo_preparo)
  return {
    nome: data.nome.trim(),
    categoria: data.categoria?.trim() || undefined,
    tempo_preparo: tempo,
    dificuldade: data.dificuldade || undefined,
    modo_preparo: data.modo_preparo.trim(),
    ingredientes: data.ingredientes.map((i) => ({
      ingrediente_id: i.ingrediente_id,
      quantidade: i.quantidade?.trim() || undefined,
    })),
  }
}

export function recipeToFormData(receita: Receita): RecipeFormData {
  return {
    nome: receita.nome,
    categoria: receita.categoria ?? '',
    tempo_preparo: receita.tempo_preparo ?? undefined,
    dificuldade: receita.dificuldade ?? undefined,
    modo_preparo: receita.modo_preparo,
    ingredientes:
      receita.ingredientes.length > 0
        ? receita.ingredientes.map((i) => ({
            ingrediente_id: i.ingrediente_id,
            quantidade: i.quantidade ?? '',
          }))
        : [{ ingrediente_id: '', quantidade: '' }],
  }
}
