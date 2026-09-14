export type Lista = {
  id: string
  householdId: string
  nombre: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type ErrorNombreLista = 'nombre-vacio' | 'nombre-demasiado-largo'

export type ResultadoCrearLista =
  { ok: true; lista: Lista } | { ok: false; error: ErrorNombreLista }

export function crearLista(datos: Lista): ResultadoCrearLista {
  const nombre = datos.nombre.trim()

  if (nombre === '') {
    return { ok: false, error: 'nombre-vacio' }
  }

  if (Array.from(nombre).length > 80) {
    return { ok: false, error: 'nombre-demasiado-largo' }
  }

  return {
    ok: true,
    lista: {
      id: datos.id,
      householdId: datos.householdId,
      nombre,
      createdAt: datos.createdAt,
      createdBy: datos.createdBy,
      updatedAt: datos.updatedAt,
      updatedBy: datos.updatedBy,
    },
  }
}
