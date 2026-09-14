export type Articulo = {
  id: string
  listaId: string
  householdId: string
  contenido: string
  comprado: boolean
  boughtAt: string | null
  boughtBy: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export function marcarArticuloComprado(
  articulo: Articulo,
  boughtAt: string,
  boughtBy: string,
): Articulo {
  return { ...articulo, comprado: true, boughtAt, boughtBy }
}

export function desmarcarArticuloComprado(articulo: Articulo): Articulo {
  return { ...articulo, comprado: false, boughtAt: null, boughtBy: null }
}

export function ordenarArticulosPorIncorporacion(
  articulos: readonly Articulo[],
): Articulo[] {
  return [...articulos].sort((izquierdo, derecho) => {
    if (izquierdo.comprado !== derecho.comprado) {
      return izquierdo.comprado ? 1 : -1
    }

    return Date.parse(izquierdo.createdAt) - Date.parse(derecho.createdAt)
  })
}
