import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useEstadoSesion } from '@/shared/hogar/use-sesion'
import type { EstadoSesion } from '@/shared/hogar/use-sesion'

// Undefined is the "no provider mounted" sentinel, never a valid session
// value — `useSesion()` below turns it into a thrown error instead of a
// silent `undefined` leaking into a consumer.
const SesionContext = createContext<EstadoSesion | undefined>(undefined)

// The ONLY runtime caller of `useEstadoSesion()`. Mounting this once at the
// app root (see `app/providers/query.tsx`) is what gives the whole tree a
// single `getCurrentUser()` read and a single `onAuthStateChange`
// subscription, per the Single App-Wide Session Resolution requirement.
export function SesionProvider({ children }: { children: ReactNode }) {
  // Passed straight through — no `useMemo`. `useEstadoSesion()` already
  // returns a fresh object each render, so memoizing here would only hide
  // that cost, not remove it.
  const estadoSesion = useEstadoSesion()

  return (
    <SesionContext.Provider value={estadoSesion}>
      {children}
    </SesionContext.Provider>
  )
}

// The public entry point every screen imports. Same name, same shape as the
// old `use-sesion.ts` hook — the rename in that file is an internal detail
// consumers never see.
export function useSesion(): EstadoSesion {
  const estadoSesion = useContext(SesionContext)

  if (!estadoSesion) {
    throw new Error('useSesion() must be called within a <SesionProvider>')
  }

  return estadoSesion
}
