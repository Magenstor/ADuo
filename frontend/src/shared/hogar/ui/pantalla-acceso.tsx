import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { useSesion } from '@/shared/hogar/use-sesion'
import type { ErrorSesion } from '@/shared/hogar/sesion'

// English UI copy for each error code the session hook can surface. Kept out
// of the hook itself so session logic stays free of presentation strings.
const COPIA_ERROR: Record<ErrorSesion, string> = {
  'inicio-fallido': 'Could not start Google sign-in. Please try again.',
  'proveedor-rechazo': 'Google sign-in was cancelled or denied.',
  'retorno-sin-sesion':
    'Google sent you back, but the session could not be completed. Your account may not be usable yet.',
  'cierre-fallido': 'Could not sign out. Please try again.',
}

// The single access screen: signed-out button, signed-in identity + sign-out,
// and a persistent inline alert for any session error. No toast system.
export function PantallaAcceso() {
  const { user, error, signIn, signOut } = useSesion()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">ADuo</h1>

      {error && (
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>{COPIA_ERROR[error]}</AlertDescription>
        </Alert>
      )}

      {user ? (
        <div className="flex flex-col items-center gap-3">
          <Avatar size="lg">
            <AvatarImage
              src={user.avatarUrl ?? undefined}
              alt={user.nombre ?? user.email}
            />
            <AvatarFallback>
              {(user.nombre ?? user.email).slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="font-medium">{user.nombre ?? user.email}</p>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      ) : (
        <Button onClick={() => signIn()}>Sign in with Google</Button>
      )}
    </div>
  )
}
