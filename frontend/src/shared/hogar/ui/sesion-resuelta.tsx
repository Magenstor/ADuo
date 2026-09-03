import { useState } from 'react'
import type { ReactNode } from 'react'
import { useSesion } from '@/shared/hogar/sesion-contexto'

// Gates the whole route tree until the session has resolved ONCE. Reading
// `loading` directly (instead of latching) would unmount the access screen
// on every `signIn()` click, since `use-sesion.ts:93` sets `loading` back to
// `true` while the OAuth redirect starts — see design Decision 2.
export function SesionResuelta({ children }: { children: ReactNode }) {
  const { loading } = useSesion()
  const [resuelta, setResuelta] = useState(false)

  // Render-phase state adjustment (React-sanctioned pattern): flips the
  // latch closed→open exactly once, the first time `loading` becomes
  // `false`, and never re-closes it afterwards.
  if (!loading && !resuelta) setResuelta(true)

  if (!resuelta) {
    return (
      <div role="status" aria-live="polite">
        Loading…
      </div>
    )
  }

  return <>{children}</>
}
