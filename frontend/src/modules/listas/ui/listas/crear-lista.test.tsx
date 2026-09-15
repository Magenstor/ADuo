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
      // `crearLista()` (domain/lista.ts) rejects a name over 80 characters
      // with this exact token via `fallo('validation', ...)` — this is the
      // realistic path, since only blank/whitespace is guarded client-side.
      error: Object.assign(new Error('nombre-demasiado-largo'), {
        tipo: 'validation',
      }),
    })
    const user = userEvent.setup()
    render(<CrearLista crear={crear} />)

    const input = screen.getByRole('textbox', { name: /nombre/i })
    await user.type(input, 'Semanal')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    // Never the raw domain token — the mapped Spanish copy instead.
    expect(
      await screen.findByText('El nombre no puede superar los 80 caracteres.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('nombre-demasiado-largo')).not.toBeInTheDocument()
    expect(input).toHaveValue('Semanal')
  })

  it('shows a generic retry message, never the raw SDK message, on a persistence error', async () => {
    const crear = vi.fn().mockResolvedValue({
      ok: false,
      error: Object.assign(
        new Error('duplicate key value violates unique constraint'),
        { tipo: 'persistence' },
      ),
    })
    const user = userEvent.setup()
    render(<CrearLista crear={crear} />)

    await user.type(screen.getByRole('textbox', { name: /nombre/i }), 'Semanal')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(
      await screen.findByText(
        'No se pudo guardar el cambio. Inténtalo de nuevo.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/duplicate key value/i)).not.toBeInTheDocument()
  })

  it('carries the min-h-11 and min-w-11 touch-target classes on the submit control', () => {
    render(<CrearLista crear={vi.fn()} />)

    const boton = screen.getByRole('button', { name: /crear/i })
    expect(boton.className).toMatch(/\bmin-h-11\b/)
    expect(boton.className).toMatch(/\bmin-w-11\b/)
  })
})
