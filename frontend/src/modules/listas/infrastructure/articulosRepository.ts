import { insforge } from '@/shared/api/insforge'
import type { Articulo } from '../domain/articulo'

// The only path between PostgREST's `shopping_items` table and
// `modules/listas/domain/`. Every exported CRUD function accepts and
// returns `Articulo`; no raw row shape ever escapes this module
// (docs/03-Arquitectura.md §3.2).

const TABLA = 'shopping_items'

export type FilaArticulo = {
  id: string
  list_id: string
  household_id: string
  content: string
  is_bought: boolean
  bought_by: string | null
  bought_at: string | null
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

// The purchase tri-state (`comprado` / `boughtAt` / `boughtBy`) is passed
// through exactly as read, never independently derived or corrected here —
// it mirrors the database's `comprado_coherente` CHECK constraint
// (backend/migrations/004_shopping_items.sql), which is the single source
// of truth for that coherence.
export function articuloDesdeFila(fila: FilaArticulo): Articulo {
  return {
    id: fila.id,
    listaId: fila.list_id,
    householdId: fila.household_id,
    contenido: fila.content,
    comprado: fila.is_bought,
    boughtAt: fila.bought_at,
    boughtBy: fila.bought_by,
    createdAt: fila.created_at,
    createdBy: fila.created_by,
    updatedAt: fila.updated_at,
    updatedBy: fila.updated_by,
  }
}

// Audit columns (`created_*` / `updated_*`) are server-managed defaults, so
// the writable payload never carries them.
export function filaDesdeArticulo(articulo: Articulo): Partial<FilaArticulo> {
  return {
    id: articulo.id,
    list_id: articulo.listaId,
    household_id: articulo.householdId,
    content: articulo.contenido,
    is_bought: articulo.comprado,
    bought_by: articulo.boughtBy,
    bought_at: articulo.boughtAt,
  }
}

export async function obtenerArticulos(
  householdId: string,
): Promise<Articulo[]> {
  const { data, error } = await insforge.database
    .from(TABLA)
    .select()
    .eq('household_id', householdId)

  if (error) {
    throw error
  }

  return data.map(articuloDesdeFila)
}

export async function insertarArticulo(articulo: Articulo): Promise<Articulo> {
  const { data, error } = await insforge.database
    .from(TABLA)
    .insert([filaDesdeArticulo(articulo)])
    .select()

  if (error) {
    throw error
  }

  return articuloDesdeFila(data[0])
}

export async function actualizarArticulo(
  articulo: Articulo,
): Promise<Articulo> {
  const { data, error } = await insforge.database
    .from(TABLA)
    .update(filaDesdeArticulo(articulo))
    .eq('id', articulo.id)
    .select()

  if (error) {
    throw error
  }

  return articuloDesdeFila(data[0])
}

// Hard delete only — no `deleted_at` column exists on `shopping_items`, and
// no filter beyond the identifying key is ever added here.
export async function eliminarArticulo(id: string): Promise<void> {
  const { error } = await insforge.database.from(TABLA).delete().eq('id', id)

  if (error) {
    throw error
  }
}
