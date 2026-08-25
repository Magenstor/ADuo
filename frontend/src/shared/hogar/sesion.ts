import type { UserSchema } from '@insforge/shared-schemas'

// The session's view of a signed-in user. Deliberately smaller than
// `UserSchema`: only what the access screen (and later, task 038's session
// Provider) needs to render — never the raw backend row.
export interface Usuario {
  id: string
  email: string
  nombre: string | null
  avatarUrl: string | null
}

// Every screen state the access screen can be in, keyed by the failure that
// produced it. UI copy for each code lives in `ui/pantalla-acceso.tsx`, not
// here — this module only names the cases.
export type ErrorSesion =
  | 'inicio-fallido'
  | 'proveedor-rechazo'
  | 'retorno-sin-sesion'
  | 'cierre-fallido'

// Pure mapping from the backend's `UserSchema` to the session's `Usuario`.
// `profile` is nullable on `UserSchema` — a user can exist with no profile
// row yet — so both derived fields degrade to `null` rather than throwing.
export function aUsuarioDesdeUserSchema(user: UserSchema): Usuario {
  return {
    id: user.id,
    email: user.email,
    nombre: user.profile?.name ?? null,
    avatarUrl: user.profile?.avatar_url ?? null,
  }
}

// Pure: resolves the OAuth `redirectTo` for a given origin. Always the app
// root with a trailing slash — constant and origin-derived, never built from
// user input, so there is no open-redirect surface. In production this must
// resolve to exactly `http://localhost:3000/` to match the backend's
// registered `allowedRedirectUrls` entry.
export function urlDeRetorno(origin: string): string {
  return new URL('/', origin).toString()
}
