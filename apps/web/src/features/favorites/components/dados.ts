export type Refeicao = 'cafe' | 'almoco' | 'lanche' | 'jantar'
export type Dificuldade = 'facil' | 'media' | 'dificil'
export type Restricao =
  | 'vegetariano'
  | 'vegano'
  | 'sem-gluten'
  | 'sem-lactose'
  | 'low-carb'
  | 'sem-acucar'
export type Origem = 'comunidade' | 'minha'

export interface Receita {
  id: string
  nome: string
  /** Caminho da foto. As fotos de exemplo ficam em public/receitas */
  imagem: string
  refeicao: Refeicao
  tempoMinutos: number
  dificuldade: Dificuldade
  porcoes: number
  origem: Origem
  restricoes: Restricao[]
  ingredientes: string[]
  /** Data em que a receita foi favoritada (ISO). Usada em "Mais recentes" */
  salvaEm: string
}

export const REFEICOES: { id: Refeicao; label: string }[] = [
  { id: 'cafe', label: 'Café da manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche', label: 'Lanche da tarde' },
  { id: 'jantar', label: 'Jantar' },
]

export const DIFICULDADES: { id: Dificuldade; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Média' },
  { id: 'dificil', label: 'Difícil' },
]

export const RESTRICOES: { id: Restricao; label: string }[] = [
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'sem-gluten', label: 'Sem glúten' },
  { id: 'sem-lactose', label: 'Sem lactose' },
  { id: 'low-carb', label: 'Low carb' },
  { id: 'sem-acucar', label: 'Sem açúcar' },
]

export const rotuloRefeicao = (id: Refeicao) =>
  REFEICOES.find((r) => r.id === id)?.label ?? id

export const rotuloDificuldade = (id: Dificuldade) =>
  DIFICULDADES.find((d) => d.id === id)?.label ?? id

/** Receitas de exemplo. Troque pelos dados vindos da API do app. */
export const RECEITAS_EXEMPLO: Receita[] = [
  {
    id: 'pao-de-queijo-frigideira',
    nome: 'Pão de queijo de frigideira',
    imagem: '/receitas/pao-de-queijo.jpg',
    refeicao: 'cafe',
    tempoMinutos: 15,
    dificuldade: 'facil',
    porcoes: 2,
    origem: 'comunidade',
    restricoes: ['vegetariano', 'sem-gluten', 'sem-acucar'],
    ingredientes: ['ovo', 'polvilho', 'queijo', 'leite', 'sal'],
    salvaEm: '2026-09-15T10:00:00Z',
  },
  {
    id: 'escondidinho-carne-seca',
    nome: 'Escondidinho de carne seca',
    imagem: '/receitas/escondidinho.jpg',
    refeicao: 'almoco',
    tempoMinutos: 50,
    dificuldade: 'media',
    porcoes: 6,
    origem: 'comunidade',
    restricoes: ['sem-gluten', 'sem-acucar'],
    ingredientes: ['carne seca', 'mandioca', 'queijo', 'manteiga', 'cebola', 'alho'],
    salvaEm: '2026-09-14T12:30:00Z',
  },
  {
    id: 'bolo-fuba-goiabada',
    nome: 'Bolo de fubá com goiabada',
    imagem: '/receitas/bolo-de-fuba.jpg',
    refeicao: 'lanche',
    tempoMinutos: 45,
    dificuldade: 'facil',
    porcoes: 12,
    origem: 'minha',
    restricoes: ['vegetariano'],
    ingredientes: ['fubá', 'farinha de trigo', 'ovo', 'leite', 'açúcar', 'goiabada'],
    salvaEm: '2026-09-12T16:00:00Z',
  },
  {
    id: 'caldo-verde',
    nome: 'Caldo verde',
    imagem: '/receitas/caldo-verde.jpg',
    refeicao: 'jantar',
    tempoMinutos: 35,
    dificuldade: 'facil',
    porcoes: 4,
    origem: 'comunidade',
    restricoes: ['sem-gluten', 'sem-lactose', 'sem-acucar'],
    ingredientes: ['batata', 'couve', 'linguiça calabresa', 'cebola', 'alho', 'azeite'],
    salvaEm: '2026-09-10T20:00:00Z',
  },
  {
    id: 'tapioca-banana-canela',
    nome: 'Tapioca de banana com canela',
    imagem: '/receitas/tapioca.jpg',
    refeicao: 'cafe',
    tempoMinutos: 10,
    dificuldade: 'facil',
    porcoes: 1,
    origem: 'comunidade',
    restricoes: ['vegetariano', 'vegano', 'sem-gluten', 'sem-lactose'],
    ingredientes: ['goma de tapioca', 'banana', 'canela', 'pasta de amendoim'],
    salvaEm: '2026-09-09T08:15:00Z',
  },
  {
    id: 'moqueca-peixe',
    nome: 'Moqueca de peixe',
    imagem: '/receitas/moqueca.jpg',
    refeicao: 'almoco',
    tempoMinutos: 55,
    dificuldade: 'media',
    porcoes: 4,
    origem: 'comunidade',
    restricoes: ['sem-gluten', 'sem-lactose', 'low-carb', 'sem-acucar'],
    ingredientes: ['peixe', 'leite de coco', 'tomate', 'pimentão', 'cebola', 'coentro', 'azeite de dendê'],
    salvaEm: '2026-09-07T13:00:00Z',
  },
  {
    id: 'crepioca-frango',
    nome: 'Crepioca de frango',
    imagem: '/receitas/crepioca.jpg',
    refeicao: 'lanche',
    tempoMinutos: 20,
    dificuldade: 'facil',
    porcoes: 1,
    origem: 'minha',
    restricoes: ['sem-gluten', 'sem-acucar'],
    ingredientes: ['ovo', 'goma de tapioca', 'frango', 'requeijão', 'orégano'],
    salvaEm: '2026-09-05T17:40:00Z',
  },
  {
    id: 'risoto-abobora',
    nome: 'Risoto de abóbora',
    imagem: '/receitas/risoto-abobora.jpg',
    refeicao: 'jantar',
    tempoMinutos: 40,
    dificuldade: 'dificil',
    porcoes: 2,
    origem: 'comunidade',
    restricoes: ['vegetariano', 'sem-gluten', 'sem-acucar'],
    ingredientes: ['arroz arbóreo', 'abóbora', 'caldo de legumes', 'parmesão', 'manteiga', 'cebola', 'tomilho'],
    salvaEm: '2026-09-02T19:00:00Z',
  },
]
