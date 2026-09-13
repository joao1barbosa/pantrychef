import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '../hooks/use-auth'

const registerSchema = z
  .object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmacao: z.string(),
  })
  .refine((data) => data.senha === data.confirmacao, {
    message: 'Senhas não coincidem',
    path: ['confirmacao'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, isRegisterLoading, registerError } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
      })
      navigate('/login')
    } catch {
      // Error is handled by registerError
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracota">
            <ChefHat className="h-7 w-7 text-bege" />
          </div>
        </div>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" type="text" placeholder="Seu nome" {...register('nome')} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              {...register('senha')}
            />
            {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacao">Confirmar senha</Label>
            <Input
              id="confirmacao"
              type="password"
              placeholder="Repita a senha"
              {...register('confirmacao')}
            />
            {errors.confirmacao && (
              <p className="text-sm text-destructive">{errors.confirmacao.message}</p>
            )}
          </div>
          {registerError && <p className="text-sm text-destructive">{registerError}</p>}
          <Button
            type="submit"
            variant="terracota"
            className="w-full"
            disabled={isRegisterLoading}
          >
            {isRegisterLoading ? 'Cadastrando...' : 'Criar conta'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="text-terracota hover:underline">
            Faça login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
