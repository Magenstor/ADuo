import { render, screen } from '@testing-library/react'
import { AvisoSegundoMiembro } from './aviso-segundo-miembro'

describe('AvisoSegundoMiembro', () => {
  it('renders an informational status alert with no call-to-action', () => {
    render(<AvisoSegundoMiembro />)

    const aviso = screen.getByRole('status')
    expect(aviso).toHaveTextContent('Todavía no hay nadie más en tu hogar.')
    expect(aviso).toHaveTextContent(
      'Invita a alguien para compartir las listas.',
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
