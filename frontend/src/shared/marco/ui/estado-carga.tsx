// Shared loading state. Reuses the exact role/aria convention established at
// `shared/hogar/ui/sesion-resuelta.tsx:20-22` instead of inventing a new one
// — see design D6.
export function EstadoCarga({ etiqueta }: { etiqueta?: string }) {
  return (
    <div role="status" aria-live="polite">
      {etiqueta ?? 'Cargando…'}
    </div>
  )
}
