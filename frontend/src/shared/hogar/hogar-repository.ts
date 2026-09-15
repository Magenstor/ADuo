import { insforge } from '@/shared/api/insforge'

export type Hogar = { id: string; nombre: string }
export type Miembro = {
  id: string
  householdId: string
  userId: string
  nombre: string
}
export type ErrorHogar = Error & {
  tipo: 'consulta' | 'configuracion' | 'realtime'
}
export type ResolucionHogar =
  | { estado: 'ready'; hogar: Hogar; miembros: Miembro[] }
  | { estado: 'sin-hogar' }
  | { estado: 'error'; error: ErrorHogar }

type FilaMembresia = { household_id: string }
type FilaHogar = { id: string; name: string }
type FilaMiembro = {
  id: string
  household_id: string
  user_id: string
  display_name: string
}

function errorHogar(tipo: ErrorHogar['tipo'], causa: unknown): ErrorHogar {
  const error = causa instanceof Error ? causa : new Error(String(causa))
  return Object.assign(error, { tipo })
}

// PostgREST caps every response at the server's `max-rows`, so one unranged
// read is only complete while a household has fewer members than that cap.
// Reading in explicit `range` windows, ordered by the primary key so pages
// cannot overlap, makes member retrieval complete regardless of the cap.
const MIEMBROS_POR_PAGINA = 100

function miembroDesdeFila(fila: FilaMiembro): Miembro {
  return {
    id: fila.id,
    householdId: fila.household_id,
    userId: fila.user_id,
    nombre: fila.display_name,
  }
}

async function todosLosMiembros(householdId: string): Promise<Miembro[]> {
  const miembros: Miembro[] = []
  for (let desde = 0; ; desde += MIEMBROS_POR_PAGINA) {
    const { data, error } = await insforge.database
      .from('household_members')
      .select('id, household_id, user_id, display_name')
      .eq('household_id', householdId)
      .order('id')
      .range(desde, desde + MIEMBROS_POR_PAGINA - 1)

    if (error) throw errorHogar('consulta', error)
    const pagina = (data as FilaMiembro[]).map(miembroDesdeFila)
    miembros.push(...pagina)
    if (pagina.length < MIEMBROS_POR_PAGINA) return miembros
  }
}

export async function resolverHogar(userId: string): Promise<ResolucionHogar> {
  try {
    const { data: membresias, error: errorMembresias } = await insforge.database
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .limit(2)

    if (errorMembresias) throw errorHogar('consulta', errorMembresias)
    const encontradas = membresias as FilaMembresia[]
    if (encontradas.length === 0) return { estado: 'sin-hogar' }
    if (encontradas.length > 1) {
      return {
        estado: 'error',
        error: errorHogar(
          'configuracion',
          'El usuario pertenece a más de un hogar',
        ),
      }
    }

    const householdId = encontradas[0].household_id
    const [{ data: hogares, error: errorHogarLeido }, miembros] =
      await Promise.all([
        insforge.database
          .from('households')
          .select('id, name')
          .eq('id', householdId)
          .limit(1),
        todosLosMiembros(householdId),
      ])
    if (errorHogarLeido) throw errorHogar('consulta', errorHogarLeido)
    const filaHogar = (hogares as FilaHogar[] | null)?.[0]
    if (!filaHogar) throw errorHogar('consulta', 'No se encontró el hogar')

    return {
      estado: 'ready',
      hogar: { id: filaHogar.id, nombre: filaHogar.name },
      miembros,
    }
  } catch (causa) {
    return { estado: 'error', error: errorHogar('consulta', causa) }
  }
}
