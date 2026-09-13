import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // The app should render the home page by default
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })
})