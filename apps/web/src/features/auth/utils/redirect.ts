/** Aceita apenas caminhos internos para evitar open redirect via ?next=. */
export function destinoSeguro(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  if (next.startsWith('/login') || next.startsWith('/register')) return '/'
  return next
}
