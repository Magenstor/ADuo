import { leerRetornoOAuth } from '@/shared/hogar/retorno-oauth'

// `leerRetornoOAuth` is the pure half of the OAuth-return capture: given a
// `location.search` string, it says whether the page was entered mid-OAuth
// exchange (`insforge_code`) or with a provider-side denial (`error`). The
// impure half — capturing `window.location.search` at module load, before
// the SDK strips these params — lives in the module-level `retornoOAuth`
// constant and is exercised by the wiring/integration layer, not here.
describe('leerRetornoOAuth', () => {
  it('reports traiaCodigo when the URL carries insforge_code', () => {
    const retorno = leerRetornoOAuth('?insforge_code=abc123')

    expect(retorno).toEqual({ traiaCodigo: true, errorDelProveedor: false })
  })

  it('reports errorDelProveedor when the URL carries an error param', () => {
    const retorno = leerRetornoOAuth('?error=access_denied')

    expect(retorno).toEqual({ traiaCodigo: false, errorDelProveedor: true })
  })

  it('reports neither flag on a plain visit with no OAuth params', () => {
    const retorno = leerRetornoOAuth('')

    expect(retorno).toEqual({ traiaCodigo: false, errorDelProveedor: false })
  })
})
