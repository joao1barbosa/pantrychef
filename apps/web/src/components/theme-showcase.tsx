import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ThemeShowcase() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">PantryChef Design System</h1>

      {/* Colors */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Cores</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="h-20 rounded-lg bg-[#2C1810] flex items-center justify-center text-[#F5F0EB] text-xs">Marrom #2C1810</div>
          <div className="h-20 rounded-lg bg-[#F5F0EB] flex items-center justify-center text-[#2C1810] text-xs border">Bege #F5F0EB</div>
          <div className="h-20 rounded-lg bg-[#C0392B] flex items-center justify-center text-[#F5F0EB] text-xs">Terracota #C0392B</div>
          <div className="h-20 rounded-lg bg-[#D4943A] flex items-center justify-center text-[#2C1810] text-xs">Dourado #D4943A</div>
          <div className="h-20 rounded-lg bg-[#5B7553] flex items-center justify-center text-[#F5F0EB] text-xs">Verde #5B7553</div>
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Botões</h2>
        <div className="flex gap-4 flex-wrap">
          <Button variant="default">Default</Button>
          <Button variant="terracota">Terracota</Button>
          <Button variant="dourado">Dourado</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Badges</h2>
        <div className="flex gap-4 flex-wrap">
          <Badge variant="default">Default</Badge>
          <Badge variant="terracota">Terracota</Badge>
          <Badge variant="dourado">Dourado</Badge>
          <Badge variant="verde">Verde</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Cards */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Claro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Exemplo de card com tema claro.</p>
            </CardContent>
          </Card>
          <Card className="dark">
            <CardHeader>
              <CardTitle>Card Escuro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Exemplo de card com tema escuro.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Form */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Formulário</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button variant="terracota" className="w-full">Entrar</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
