export type Dificuldade = 'facil' | 'medio' | 'dificil'

export type Ordenacao =
  'tempo_asc' | 'tempo_desc' | 'nome_asc' | 'nome_desc' | 'recentes' | 'populares'

export interface Ingrediente {
  id: string
  nome: string
  slug: string
}

export interface ReceitaIngrediente {
  ingrediente_id: string
  nome: string
  quantidade?: string | null
}

export interface Receita {
  id: string
  nome: string
  slug: string
  modo_preparo: string
  categoria?: string | null
  tempo_preparo?: number | null
  dificuldade?: Dificuldade | null
  usuario_id?: string | null
  gerada_por_ia?: boolean
  criado_em: string
  ingredientes: ReceitaIngrediente[]
}

export interface ReceitaPayload {
  nome: string
  modo_preparo: string
  categoria?: string
  tempo_preparo?: number
  dificuldade?: Dificuldade
  ingredientes: { ingrediente_id: string; quantidade?: string }[]
}

export interface Favorito {
  id: string
  receita_id: string
  salvo_em: string
  receita: Receita
}

export interface HistoricoItem {
  id: string
  visualizado_em: string
  receita: Receita
}

export interface Usuario {
  id: string
  nome: string
  email: string
  criado_em: string
}

export interface Preferencias {
  categorias_favoritas: string[]
  restricoes_alimentares: string[]
}
