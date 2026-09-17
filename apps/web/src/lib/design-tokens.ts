/**
 * PantryChef Design Tokens
 *
 * Paleta e tokens alinhados com o @theme inline do Tailwind (src/index.css).
 * Use as variáveis CSS via `var(--color-*)` ou as classes utilitárias do Tailwind
 * (ex: `bg-marrom`, `text-terracota`, `border-dourado`).
 */

export const colors = {
  marrom: '#2C1810',
  bege: '#F5F0EB',
  terracota: '#C0392B',
  dourado: '#D4943A',
  verde: '#5B7553',
} as const

export const spacing = {
  xs: 'var(--pantry-spacing-xs)',
  sm: 'var(--pantry-spacing-sm)',
  md: 'var(--pantry-spacing-md)',
  lg: 'var(--pantry-spacing-lg)',
  xl: 'var(--pantry-spacing-xl)',
  '2xl': 'var(--pantry-spacing-2xl)',
} as const

export const typography = {
  fontSans: 'var(--font-sans)',
  fontHeading: 'var(--font-heading)',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const

export const borderRadius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: '9999px',
} as const
