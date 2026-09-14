import { insforge } from '@/shared/api/insforge'
import type { Lista } from '../domain/lista'

// The only path between PostgREST's `shopping_lists` table and
// `modules/listas/domain/`. Every exported CRUD function accepts and
// returns `Lista`; no raw row shape ever escapes this module
// (docs/03-Arquitectura.md §3.2).

const TABLA = 'shopping_lists'

export type FilaLista = {
  id: string
  household_id: string
  name: string
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

export function listaDesdeFila(fila: FilaLista): Lista {
  return {
    id: fila.id,
    householdId: fila.household_id,
    nombre: fila.name,
    createdAt: fila.created_at,
    createdBy: fila.created_by,
    updatedAt: fila.updated_at,
    updatedBy: fila.updated_by,
  }
}

// Audit columns (`created_*` / `updated_*`) are server-managed defaults —
// see `backend/migrations/003_shopping_lists.sql` — so the writable payload
// never carries them.
export function filaDesdeLista(
  lista: Lista,
): Pick<FilaLista, 'id' | 'household_id' | 'name'> {
  return {
    id: lista.id,
    household_id: lista.householdId,
    name: lista.nombre,
  }
}

export async function obtenerListas(householdId: string): Promise<Lista[]> {
  const { data, error } = await insforge.database
    .from(TABLA)
    .select()
    .eq('household_id', householdId)

  if (error) {
    throw error
  }

  return data.map(listaDesdeFila)
}

export async function insertarLista(lista: Lista): Promise<Lista> {
  const { data, error } = await insforge.database
    .from(TABLA)
    .insert([filaDesdeLista(lista)])
    .select()

  if (error) {
    throw error
  }

  return listaDesdeFila(data[0])
}

export async function actualizarLista(lista: Lista): Promise<Lista> {
  const { data, error } = await insforge.database
    .from(TABLA)
    .update(filaDesdeLista(lista))
    .eq('id', lista.id)
    .select()

  if (error) {
    throw error
  }

  return listaDesdeFila(data[0])
}

// Hard delete only — no `deleted_at` column exists on `shopping_lists`, and
// no filter beyond the identifying key is ever added here.
export async function eliminarLista(id: string): Promise<void> {
  const { error } = await insforge.database.from(TABLA).delete().eq('id', id)

  if (error) {
    throw error
  }
}
