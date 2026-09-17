import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    )
    // A raiz redireciona para /login (sem token) ou /home (com token)
    // O teste apenas verifica que o app renderiza sem crashar
    expect(document.body).toBeInTheDocument()
  })
})
