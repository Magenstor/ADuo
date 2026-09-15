import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ComponentType, ReactNode } from 'react'
import { resolverHogar } from './hogar-repository'
import type {
  ErrorHogar,
  Hogar,
  Miembro,
  ResolucionHogar,
} from './hogar-repository'
import { useSesion } from './sesion-contexto'

export type EstadoHogar =
  | { estado: 'loading' }
  | { estado: 'ready'; hogar: Hogar; miembros: Miembro[] }
  | { estado: 'sin-hogar' }
  | { estado: 'error'; error: ErrorHogar }

type RecursoHogar = ComponentType<{
  hogar: Hogar
  alError: (error: ErrorHogar) => void
  children?: ReactNode
}>

const ContextoHogar = createContext<EstadoHogar | undefined>(undefined)

const CARGANDO: EstadoHogar = { estado: 'loading' }

// A resolution is only meaningful for the session it was resolved for, so
// the stored state carries that session's identity. Comparing it against the
// current session DURING render is what keeps a child from observing the
// previous household on the render where the session has already changed
// but no effect has run yet.
type ResolucionAlmacenada = { sesion: string; estado: EstadoHogar }

function estadoDesdeResolucion(resolucion: ResolucionHogar): EstadoHogar {
  return resolucion
}

function estadoVisible(
  almacenada: ResolucionAlmacenada | undefined,
  sesion: string | undefined,
): EstadoHogar {
  return almacenada && almacenada.sesion === sesion
    ? almacenada.estado
    : CARGANDO
}

export function HogarProvider({
  children,
  recurso: Recurso,
}: {
  children: ReactNode
  recurso?: RecursoHogar
}) {
  const { user, loading: cargandoSesion } = useSesion()
  const sesion = cargandoSesion || !user ? undefined : user.id
  const [almacenada, setAlmacenada] = useState<ResolucionAlmacenada>()
  const generacion = useRef(0)
  const estado = estadoVisible(almacenada, sesion)

  useEffect(() => {
    const actual = ++generacion.current
    if (sesion === undefined) {
      // Absent session: discard the prior result so a later sign-in of the
      // same user starts from `loading` rather than from what it last saw.
      setAlmacenada(undefined)
      return
    }

    void resolverHogar(sesion).then((resolucion) => {
      if (generacion.current === actual)
        setAlmacenada({ sesion, estado: estadoDesdeResolucion(resolucion) })
    })
    return () => {
      // Unmount (or a Strict Mode replay) retires this generation so its
      // in-flight resolution can never publish.
      generacion.current++
    }
  }, [sesion])

  const reportarErrorRecurso = useCallback((error: ErrorHogar) => {
    setAlmacenada((previa) =>
      previa?.estado.estado === 'ready'
        ? { sesion: previa.sesion, estado: { estado: 'error', error } }
        : previa,
    )
  }, [])

  return (
    <ContextoHogar.Provider value={estado}>
      {estado.estado === 'ready' && Recurso ? (
        <Recurso hogar={estado.hogar} alError={reportarErrorRecurso}>
          {children}
        </Recurso>
      ) : (
        children
      )}
    </ContextoHogar.Provider>
  )
}

export function useHogar(): EstadoHogar {
  const estado = useContext(ContextoHogar)
  if (!estado)
    throw new Error('useHogar() must be called within a <HogarProvider>')
  return estado
}
