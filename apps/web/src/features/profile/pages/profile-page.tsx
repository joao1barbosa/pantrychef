import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { ChefHat, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { fetchWithAuth } from '@/lib/api'

interface UserOut {
  id: string
  nome: string
  email: string
  criado_em: string
}

interface Preferences {
  categorias_favoritas: string[]
  restricoes_alimentares: string[]
}

const profileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
})

const preferencesSchema = z.object({
  categorias: z.string().optional(),
  restricoes: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PreferencesFormData = z.infer<typeof preferencesSchema>

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function ProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => fetchWithAuth('/users/me') as Promise<UserOut>,
  })

  const { data: preferences } = useQuery({
    queryKey: ['users', 'me', 'preferences'],
    queryFn: () => fetchWithAuth('/users/me/preferences') as Promise<Preferences>,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: registerPrefs,
    handleSubmit: handleSubmitPrefs,
    reset: resetPrefs,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
  })

  useEffect(() => {
    if (user) reset({ nome: user.nome })
  }, [user, reset])

  useEffect(() => {
    if (preferences) {
      resetPrefs({
        categorias: (preferences.categorias_favoritas ?? []).join(', '),
        restricoes: (preferences.restricoes_alimentares ?? []).join(', '),
      })
    }
  }, [preferences, resetPrefs])

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      fetchWithAuth('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: data.nome }),
      }) as Promise<UserOut>,
    onSuccess: (updated) => {
      queryClient.setQueryData(['users', 'me'], updated)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  const prefsMutation = useMutation({
    mutationFn: (data: PreferencesFormData) =>
      fetchWithAuth('/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorias_favoritas: parseList(data.categorias),
          restricoes_alimentares: parseList(data.restricoes),
        }),
      }) as Promise<Preferences>,
    onSuccess: (updated) => {
      queryClient.setQueryData(['users', 'me', 'preferences'], updated)
    },
  })

  const logout = () => {
    localStorage.removeItem('token')
    queryClient.clear()
    navigate('/login')
  }

  if (isLoadingUser) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-10 w-64 animate-pulse rounded-full bg-foreground/10" />
        <div className="h-60 animate-pulse rounded-[20px] bg-foreground/10" />
        <p className="sr-only">Carregando perfil...</p>
      </div>
    )
  }

  if (isErrorUser || !user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-destructive">Erro ao carregar perfil. Tente novamente.</p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-6 pb-6">
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
                <span className="flex size-12 items-center justify-center rounded-full bg-[#C0392B]/10 text-[#C0392B]">
                  <ChefHat className="size-6" />
                </span>
                <div>
                  <CardTitle className="text-lg font-extrabold">{user.nome}</CardTitle>
                  <p className="text-sm text-foreground/70">{user.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <form
                onSubmit={handleSubmit((d) => profileMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" {...register('nome')} />
                  {errors.nome && (
                    <p className="text-sm text-destructive">{errors.nome.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled readOnly />
                  <p className="text-xs text-foreground/60">O email não pode ser alterado.</p>
                </div>
                {profileMutation.isError && (
                  <p className="text-sm text-destructive">
                    {profileMutation.error instanceof Error
                      ? profileMutation.error.message
                      : 'Erro ao atualizar perfil.'}
                  </p>
                )}
                {profileMutation.isSuccess && (
                  <p className="text-sm text-[#5B7553]">Perfil atualizado com sucesso!</p>
                )}
                <Button
                  type="submit"
                  variant="terracota"
                  className="h-11 rounded-full px-6 font-bold"
                  disabled={profileMutation.isPending}
                >
                  {profileMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias">
          <Card className="rounded-[20px] border-foreground/10 p-5 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-extrabold">Preferências</CardTitle>
              <p className="text-sm text-foreground/70">
                Categorias favoritas e restrições alimentares (separadas por vírgula).
              </p>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {(preferences?.categorias_favoritas?.length ?? 0) > 0 && (
                <div className="mb-3 flex flex-wrap gap-2" aria-label="Categorias favoritas">
                  {(preferences?.categorias_favoritas ?? []).map((c) => (
                    <Badge
                      key={c}
                      variant="dourado"
                      className="rounded-full px-3 py-1 text-xs font-bold"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
              {(preferences?.restricoes_alimentares?.length ?? 0) > 0 && (
                <div className="mb-3 flex flex-wrap gap-2" aria-label="Restrições alimentares">
                  {(preferences?.restricoes_alimentares ?? []).map((r) => (
                    <Badge
                      key={r}
                      variant="verde"
                      className="rounded-full px-3 py-1 text-xs font-bold"
                    >
                      {r}
                    </Badge>
                  ))}
                </div>
              )}
              <form
                onSubmit={handleSubmitPrefs((d) => prefsMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="categorias">Categorias favoritas</Label>
                  <Input
                    id="categorias"
                    placeholder="Ex.: massas, doces, saladas"
                    {...registerPrefs('categorias')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restricoes">Restrições alimentares</Label>
                  <Input
                    id="restricoes"
                    placeholder="Ex.: lactose, glúten"
                    {...registerPrefs('restricoes')}
                  />
                </div>
                {prefsMutation.isError && (
                  <p className="text-sm text-destructive">
                    {prefsMutation.error instanceof Error
                      ? prefsMutation.error.message
                      : 'Erro ao atualizar preferências.'}
                  </p>
                )}
                {prefsMutation.isSuccess && (
                  <p className="text-sm text-[#5B7553]">Preferências atualizadas!</p>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  className="h-11 rounded-full px-6 font-bold"
                  disabled={prefsMutation.isPending}
                >
                  {prefsMutation.isPending ? 'Salvando...' : 'Salvar preferências'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button
        type="button"
        variant="outline"
        onClick={logout}
        className="h-12 rounded-full font-bold"
      >
        <LogOut className="size-5" />
        Sair da conta
      </Button>
    </div>
  )
}
