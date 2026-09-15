import type { ErrorAplicacion } from '@/modules/listas'

// The proposal requires all UI copy in Spanish, but `ErrorAplicacion.message`
// carries either a raw domain token (`crearLista()` in `domain/lista.ts`,
// surfaced via `fallo('validation', ...)`) or the raw SDK message for
// `persistence`/`query`/`realtime`. This maps either into inline Spanish
// copy, never the token or the SDK text, for `CrearLista`, `FilaLista`'s
// rename form, and `ContenidoEliminarLista`'s confirm action.
const COPIA_VALIDACION: Record<string, string> = {
  'nombre-vacio': 'El nombre no puede estar vacío.',
  'nombre-demasiado-largo': 'El nombre no puede superar los 80 caracteres.',
}

const COPIA_MUTACION_GENERICA =
  'No se pudo guardar el cambio. Inténtalo de nuevo.'

export function copiaErrorLista(error: ErrorAplicacion): string {
  if (error.tipo === 'validation') {
    return COPIA_VALIDACION[error.message] ?? 'El nombre no es válido.'
  }
  return COPIA_MUTACION_GENERICA
}
