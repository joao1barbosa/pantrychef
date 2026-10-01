# PantryChef Design System

## Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Marrom Profundo | #2C1810 | Backgrounds escuros, texto principal |
| Bege | #F5F0EB | Backgrounds claros, texto em fundos escuros |
| Terracota | #C0392B | CTAs primários, destaques, destructive |
| Dourado | #D4943A | CTAs secundários, highlights |
| Verde Oliva | #5B7553 | Success, secondary accent |

## Tema Claro (Default)

- Background: Bege (#F5F0EB)
- Foreground: Marrom Profundo (#2C1810)
- Primary: Terracota (#C0392B)
- Secondary: Verde Oliva (#5B7553)
- Accent: Dourado (#D4943A)

## Tema Escuro (.dark)

- Background: Marrom Profundo (#2C1810)
- Foreground: Bege (#F5F0EB)
- Primary: Dourado (#D4943A)
- Secondary: Verde Oliva (#5B7553)
- Accent: Terracota (#C0392B)

## Componentes

### Button

Variantes: `default`, `terracota`, `dourado`, `secondary`, `outline`, `ghost`, `destructive`

Tamanhos: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`

### Badge

Variantes: `default`, `terracota`, `dourado`, `verde`, `secondary`, `outline`, `ghost`

### Card

Tamanhos: `default`, `sm`

Sub-componentes: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`

## Tokens de Design

Acesse via `@/lib/design-tokens`:

```typescript
import { colors, spacing, typography, borderRadius } from '@/lib/design-tokens'
```

## Visualização

Os componentes base ficam em `src/components/ui/` e os compostos do app em
`src/shared/components/` (navegação, card de receita, diálogo de confirmação...).
Para vê-los em uso, rode `npm run dev` e navegue pelas telas.

## Alternância de tema (como funciona)

- As cores da marca (`terracota`, `dourado`, `verde`) são variáveis CSS: no tema
  escuro usam tons mais claros para manter o contraste sobre o marrom.
- `public/theme-init.js` aplica a classe `.dark` no `<html>` antes da primeira
  pintura (arquivo externo por causa da CSP, que bloqueia scripts inline).
- `useTema()` (`src/lib/theme.ts`) guarda a preferência (`sistema`, `claro` ou
  `escuro`) em `localStorage` e acompanha a configuração do sistema.
- Controles: botão na sidebar (desktop) e aba **Aparência** no Perfil.
