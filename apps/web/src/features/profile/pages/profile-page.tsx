import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChefHat, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { fetchWithAuth, mensagemDeErro } from '@/lib/api'
import { USUARIO_QUERY_KEY, useAuth } from '@/features/auth/hooks/use-auth'
import type { Preferencias, Usuario } from '@/types'
import { TagInput } from '../components/tag-input'

const PREFERENCIAS_QUERY_KEY = ['users', 'me', 'preferences'] as const

const CATEGORIAS_SUGERIDAS = [
  'Massas',
  'Doces',
  'Saladas',
  'Sopas',
  'Carnes',
  'Lanches',
  'Café da manhã',
]
const RESTRICOES_SUGERIDAS = [
  'Vegetariano',
  'Vegano',
  'Sem glúten',
  'Sem lactose',
  'Low carb',
  'Sem açúcar',
]

const profileSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido'),
})

type ProfileFormData = z.infer<typeof profileSchema>

function formatarMembroDesde(iso: string) {
  const data = new Date(iso)
  return Number.isNaN(data.getTime())
    ? null
    : data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function DadosForm({ user }: { user: Usuario }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nome: user.nome, email: user.email },
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      fetchWithAuth<Usuario>('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: data.nome.trim(), email: data.email.trim() }),
      }),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(USUARIO_QUERY_KEY, atualizado)
      reset({ nome: atualizado.nome, email: atualizado.email })
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          className="h-11"
          autoComplete="name"
          aria-invalid={!!errors.nome}
          {...register('nome')}
        />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className="h-11"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mensagemDeErro(mutation.error, 'Erro ao atualizar perfil.')}
        </p>
      )}
      {mutation.isSuccess && !isDirty && (
        <p role="status" className="text-sm text-verde">
          Perfil atualizado com sucesso!
        </p>
      )}
      <Button
        type="submit"
        variant="terracota"
        className="h-11 rounded-full px-6 font-bold"
        disabled={mutation.isPending || !isDirty}
      >
        {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </form>
  )
}

function PreferenciasForm({ preferencias }: { preferencias: Preferencias }) {
  const queryClient = useQueryClient()
  const [categorias, setCategorias] = useState(preferencias.categorias_favoritas ?? [])
  const [restricoes, setRestricoes] = useState(preferencias.restricoes_alimentares ?? [])

  const mutation = useMutation({
    mutationFn: () =>
      fetchWithAuth<Preferencias>('/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorias_favoritas: categorias,
          restricoes_alimentares: restricoes,
        }),
      }),
    onSuccess: (atualizadas) => queryClient.setQueryData(PREFERENCIAS_QUERY_KEY, atualizadas),
  })

  const alterado =
    JSON.stringify(categorias) !== JSON.stringify(preferencias.categorias_favoritas ?? []) ||
    JSON.stringify(restricoes) !== JSON.stringify(preferencias.restricoes_alimentares ?? [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
      className="space-y-6"
    >
      <TagInput
        id="categorias"
        rotulo="Categorias favoritas"
        valores={categorias}
        sugestoes={CATEGORIAS_SUGERIDAS}
        onChange={setCategorias}
        variante="dourado"
      />
      <TagInput
        id="restricoes"
        rotulo="Restrições alimentares"
        valores={restricoes}
        sugestoes={RESTRICOES_SUGERIDAS}
        onChange={setRestricoes}
        variante="verde"
      />
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mensagemDeErro(mutation.error, 'Erro ao atualizar preferências.')}
        </p>
      )}
      {mutation.isSuccess && !alterado && (
        <p role="status" className="text-sm text-verde">
          Preferências atualizadas!
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        className="h-11 rounded-full px-6 font-bold"
        disabled={mutation.isPending || !alterado}
      >
        {mutation.isPending ? 'Salvando...' : 'Salvar preferências'}
      </Button>
    </form>
  )
}

export function ProfilePage() {
  const { user, isLoading, logout } = useAuth()
  const { data: preferencias, isLoading: carregandoPrefs } = useQuery({
    queryKey: PREFERENCIAS_QUERY_KEY,
    queryFn: () => fetchWithAuth<Preferencias>('/users/me/preferences'),
  })

  if (isLoading) {
    return (
      <div
        className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-24 md:pb-6"
        aria-busy="true"
      >
        <div className="h-8 w-40 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-10 w-64 animate-pulse rounded-full bg-foreground/10" />
        <div className="h-60 animate-pulse rounded-[20px] bg-foreground/10" />
        <p className="sr-only">Carregando perfil...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-destructive">Erro ao carregar perfil. Tente novamente.</p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </div>
    )
  }

  const membroDesde = formatarMembroDesde(user.criado_em)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-28 md:pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[34px] leading-none font-extrabold tracking-tight">Perfil</h1>
        <p className="text-sm text-foreground/70">Gerencie sua conta</p>
      </header>

      <Tabs defaultValue="usuario">
        <TabsList>
          <TabsTrigger value="usuario">Usuário</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="usuario">
          <Card className="rounded-[20px] border-foreground/10 p-5 shadow-none">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-terracota/10 text-terracota">
                  <ChefHat className="size-6" />
                </span>
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg font-extrabold">{user.nome}</CardTitle>
                  <p className="truncate text-sm text-foreground/70">{user.email}</p>
                  {membroDesde && (
                    <p className="text-xs text-foreground/50">Membro desde {membroDesde}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <DadosForm key={`${user.nome}|${user.email}`} user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias">
          <Card className="rounded-[20px] border-foreground/10 p-5 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-extrabold">Preferências</CardTitle>
              <p className="text-sm text-foreground/70">
                Conte o que você gosta e o que evita na cozinha.
              </p>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {carregandoPrefs || !preferencias ? (
                <div className="h-40 animate-pulse rounded-xl bg-foreground/10" aria-busy="true" />
              ) : (
                <PreferenciasForm preferencias={preferencias} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sair da conta — fixo no mobile (acima da BottomNav); no desktop o logout fica na sidebar */}
      <div className="fixed right-0 bottom-16 left-0 z-40 border-t border-border bg-card p-4 md:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={logout}
          className="h-12 w-full rounded-full font-bold"
        >
          <LogOut className="size-5" />
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
