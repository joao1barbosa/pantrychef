import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { PasswordInput } from '@/shared/components/password-input'
import { useAuth } from '../hooks/use-auth'
import { destinoSeguro } from '../utils/redirect'

const SENHA_MINIMA = 8

const registerSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo'),
    email: z.string().trim().email('Email inválido'),
    senha: z
      .string()
      .min(SENHA_MINIMA, `Senha deve ter pelo menos ${SENHA_MINIMA} caracteres`)
      .max(128, 'Senha muito longa'),
    confirmacao: z.string(),
  })
  .refine((data) => data.senha === data.confirmacao, {
    message: 'Senhas não coincidem',
    path: ['confirmacao'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const {
    register: registerUser,
    login,
    isRegisterLoading,
    isLoginLoading,
    registerError,
  } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({ nome: data.nome, email: data.email, senha: data.senha })
    } catch {
      return
    }
    try {
      await login({ email: data.email, senha: data.senha })
      navigate(destinoSeguro(params.get('next')), { replace: true })
    } catch {
      navigate('/login?cadastro=ok', { replace: true })
    }
  }

  const enviando = isRegisterLoading || isLoginLoading

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracota">
            <ChefHat className="h-7 w-7 text-bege" />
          </div>
        </div>
        <CardTitle className="text-2xl">
          <h1>Criar conta</h1>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Salve receitas e crie as suas.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              className="h-11"
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
              autoComplete="new-password"
              placeholder={`Mínimo ${SENHA_MINIMA} caracteres`}
              className="h-11"
              aria-invalid={!!errors.senha}
              {...register('senha')}
            />
            {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacao">Confirmar senha</Label>
            <PasswordInput
              id="confirmacao"
              autoComplete="new-password"
              placeholder="Repita a senha"
              className="h-11"
              aria-invalid={!!errors.confirmacao}
              {...register('confirmacao')}
            />
            {errors.confirmacao && (
              <p className="text-sm text-destructive">{errors.confirmacao.message}</p>
            )}
          </div>
          {registerError && (
            <p role="alert" className="text-sm text-destructive">
              {registerError}
            </p>
          )}
          <Button
            type="submit"
            variant="terracota"
            className="h-11 w-full font-bold"
            disabled={enviando}
          >
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link
            to={{ pathname: '/login', search: params.toString() }}
            className="font-semibold text-terracota hover:underline"
          >
            Faça login
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
