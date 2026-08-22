import { render, screen } from '@testing-library/react'
import { Button } from '@/shared/ui/button'

// Exercises the whole chain in one go: jsdom provides the DOM, Testing Library
// renders into it, the jest-dom matcher comes from setup.ts, and the import
// proves the @/ alias resolves under Vitest too — not only under vite build.
describe('test harness', () => {
  it('renders a component and asserts on the DOM', () => {
    render(<Button>Comprar</Button>)

    expect(screen.getByRole('button', { name: 'Comprar' })).toBeInTheDocument()
  })
})
