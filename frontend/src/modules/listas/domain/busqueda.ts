// U+0303 is excluded because `ñ`/`Ñ` decompose canonically to `n`/`N` + U+0303,
// so stripping it would rewrite a distinct Spanish letter as `n` and collide
// `piña` with `pina`.
const MARCAS_DIACRITICAS_PLEGABLES = /[\u{0300}-\u{0302}\u{0304}-\u{036F}]/gu

export function normalizarParaBusqueda(texto: string): string {
  return texto
    .trim()
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS_PLEGABLES, '')
    .normalize('NFC')
    .toLowerCase()
}

export function coincideConBusqueda(
  contenido: string,
  consulta: string,
): boolean {
  const consultaNormalizada = normalizarParaBusqueda(consulta)

  if (consultaNormalizada === '') {
    return true
  }

  return normalizarParaBusqueda(contenido).includes(consultaNormalizada)
}
