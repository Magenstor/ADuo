import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { CrearLista } from './crear-lista'

function diferido<T>() {
  let resolver!: (valor: T) => void
  const promesa = new Promise<T>((cumplir) => {
    resolver = cumplir
  })
  return { promesa, resolver }
}

describe('CrearLista', () => {
  it('renders a visible label and a text input', () => {
    render(<CrearLista crear={vi.fn()} />)

    expect(screen.getByRole('textbox', { name: /nombre/i })).toBeInTheDocument()
  })

  it('rejects a blank submission without calling crear and shows a validation message', async () => {
    const crear = vi.fn()
    const user = userEvent.setup()
    render(<CrearLista crear={crear} />)

    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(crear).not.toHaveBeenCalled()
    expect(screen.getByText(/nombre no puede estar vacío/i)).toBeInTheDocument()
  })

  it('rejects a whitespace-only submission without calling crear', async () => {
    const crear = vi.fn()
    const user = userEvent.setup()
    render(<CrearLista crear={crear} />)

    await user.type(screen.getByRole('textbox', { name: /nombre/i }), '   ')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(crear).not.toHaveBeenCalled()
  })

  it('calls crear on a valid submission and disables the submit control until it settles', async () => {
    const diferida = diferido<{ ok: true; valor: string }>()
    const crear = vi.fn().mockReturnValue(diferida.promesa)
    const user = userEvent.setup()
    render(<CrearLista crear={crear} />)

    await user.type(screen.getByRole('textbox', { name: /nombre/i }), 'Semanal')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(crear).toHaveBeenCalledWith('Semanal')
    expect(screen.getByRole('button', { name: /crear/i })).toBeDisabled()

    diferida.resolver({ ok: true, valor: 'lista-1' })
    await screen.findByRole('button', { name: /crear/i, hidden: false })
    expect(screen.getByRole('button', { name: /crear/i })).toBeEnabled()
  })

  it('resets and refocuses the input on ok:true', async () => {
    const crear = vi.fn().mockResolvedValue({ ok: true, valor: 'lista-1' })
    const user = userEvent.setup()
    render(<CrearLista crear={crear} />)

    const input = screen.getByRole('textbox', { name: /nombre/i })
    await user.type(input, 'Semanal')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(await screen.findByDisplayValue('')).toBe(input)
    expect(input).toHaveFocus()
  })

  it('shows the inline error and keeps the typed name on ok:false', async () => {
    const crear = vi.fn().mockResolvedValue({
      ok: false,
      error: Object.assign(new Error('nombre inválido'), {
        tipo: 'validation',
      }),
    })
    const user = userEvent.setup()
    render(<CrearLista crear={crear} />)

    const input = screen.getByRole('textbox', { name: /nombre/i })
    await user.type(input, 'Semanal')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(await screen.findByText('nombre inválido')).toBeInTheDocument()
    expect(input).toHaveValue('Semanal')
  })

  it('carries the min-h-11 touch-target class on the submit control', () => {
    render(<CrearLista crear={vi.fn()} />)

    expect(screen.getByRole('button', { name: /crear/i }).className).toMatch(
      /\bmin-h-11\b/,
    )
  })
})
