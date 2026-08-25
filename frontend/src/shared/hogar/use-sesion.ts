import { AuthChangeEvent } from '@insforge/sdk'
import { useCallback, useEffect, useState } from 'react'
import { insforge } from '@/shared/api/insforge'
import { retornoOAuth } from '@/shared/hogar/retorno-oauth'
import { aUsuarioDesdeUserSchema, urlDeRetorno } from '@/shared/hogar/sesion'
import type { ErrorSesion, Usuario } from '@/shared/hogar/sesion'

export interface EstadoSesion {
  user: Usuario | null
  loading: boolean
  error: ErrorSesion | null
  signIn: () => void
  signOut: () => void
}

// The single hook owning the access screen's session state. No
// Context/Provider here — task 038 lifts this shape into one without an API
// change. `loading` means "the session is still being determined".
export function useSesion(): EstadoSesion {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorSesion | null>(null)

  useEffect(() => {
    let cancelado = false

    async function leerUsuarioActual() {
      const { data, error: getCurrentUserError } =
        await insforge.auth.getCurrentUser()

      if (cancelado) return

      if (data.user) {
        setUser(aUsuarioDesdeUserSchema(data.user))
        setError(null)
        setLoading(false)
        return
      }

      if (retornoOAuth.traiaCodigo) {
        setUser(null)
        setError('retorno-sin-sesion')
        setLoading(false)
        return
      }

      if (retornoOAuth.errorDelProveedor) {
        setUser(null)
        setError('proveedor-rechazo')
        setLoading(false)
        return
      }

      // No pending OAuth return: `getCurrentUserError` is `refreshSession`'s
      // expected error for any ordinary signed-out visitor. It must not
      // reach the UI.
      void getCurrentUserError
      setUser(null)
      setError(null)
      setLoading(false)
    }

    // Subscribe before the await below so an event that fires while the
    // request is in flight is not missed.
    const unsubscribe = insforge.auth.onAuthStateChange((event) => {
      if (cancelado) return

      // An explicit sign-out must win outright, never race a re-read of
      // getCurrentUser(). `retornoOAuth.traiaCodigo` stays `true` for the
      // whole page lifetime after a Google return, so re-reading here would
      // let a stale OAuth-return flag resurrect the loud-failure error on a
      // completely successful sign-out.
      if (event === AuthChangeEvent.SIGNED_OUT) {
        setUser(null)
        setError(null)
        setLoading(false)
        return
      }

      // `signedIn` / `tokenRefreshed`: the session changed under us, re-read it.
      void leerUsuarioActual()
    })

    void leerUsuarioActual()

    return () => {
      cancelado = true
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(() => {
    setLoading(true)
    setError(null)

    void insforge.auth
      .signInWithOAuth('google', {
        redirectTo: urlDeRetorno(window.location.origin),
      })
      .then(({ error: signInError }) => {
        if (!signInError) return
        setError('inicio-fallido')
        setLoading(false)
      })
  }, [])

  const signOut = useCallback(() => {
    void insforge.auth.signOut().then(({ error: signOutError }) => {
      if (signOutError) {
        setError('cierre-fallido')
        return
      }
      setUser(null)
      setError(null)
    })
  }, [])

  return { user, loading, error, signIn, signOut }
}
