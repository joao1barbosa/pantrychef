import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { SESSAO_EXPIRADA_KEY } from '@/lib/api'
import { PasswordInput } from '@/shared/components/password-input'
import { useAuth } from '../hooks/use-auth'
import { destinoSeguro } from '../utils/redirect'

const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

function consumirAvisoDeSessao() {
  const expirou = sessionStorage.getItem(SESSAO_EXPIRADA_KEY) === '1'
  if (expirou) sessionStorage.removeItem(SESSAO_EXPIRADA_KEY)
  return expirou
}

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login, isLoginLoading, loginError } = useAuth()
  const [sessaoExpirada] = useState(consumirAvisoDeSessao)
  const contaCriada = params.get('cadastro') === 'ok'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
      navigate(destinoSeguro(params.get('next')), { replace: true })
    } catch {
      // Error is handled by loginError
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracota">
            <ChefHat className="h-7 w-7 text-bege" />
          </div>
        </div>
        <CardTitle className="text-2xl">
          <h1>Entrar</h1>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Acesse seus favoritos, histórico e receitas.
        </p>
      </CardHeader>
      <CardContent>
        {sessaoExpirada && (
          <p
            role="status"
            className="mb-4 rounded-lg bg-dourado/15 px-3 py-2 text-sm text-foreground"
          >
            Sua sessão expirou. Faça login novamente.
          </p>
        )}
        {contaCriada && !sessaoExpirada && (
          <p
            role="status"
            className="mb-4 rounded-lg bg-verde/15 px-3 py-2 text-sm text-foreground"
          >
            Conta criada! Entre com seu email e senha.
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className="h-11"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <PasswordInput
              id="senha"
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11"
              aria-invalid={!!errors.senha}
              {...register('senha')}
            />
            {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
          </div>
          {loginError && (
            <p role="alert" className="text-sm text-destructive">
              {loginError}
            </p>
          )}
          <Button
            type="submit"
            variant="terracota"
            className="h-11 w-full font-bold"
            disabled={isLoginLoading}
          >
            {isLoginLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link
            to={{ pathname: '/register', search: params.toString() }}
            className="font-semibold text-terracota hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Continuar sem conta
        </Link>
      </CardFooter>
    </Card>
  )
}
