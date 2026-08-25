export interface RetornoOAuth {
  traiaCodigo: boolean
  errorDelProveedor: boolean
}

// Pure: reads a `location.search` string and reports what an OAuth return
// looked like, without touching the DOM or the SDK.
export function leerRetornoOAuth(search: string): RetornoOAuth {
  const params = new URLSearchParams(search)

  return {
    traiaCodigo: params.has('insforge_code'),
    errorDelProveedor: params.has('error'),
  }
}

// STRUCTURAL INVARIANT — do not move or remove this side-effect capture.
//
// `@insforge/sdk`'s `Auth` constructor calls `detectAuthCallback()`
// synchronously, which strips both `insforge_code` and `error` from the URL
// via `history.replaceState` before its first `await` — i.e. before React
// ever renders and before any hook could read `window.location.search`.
//
// This module-level constant captures the params at import time. It is only
// safe because `shared/api/insforge.ts` imports this module, for its side
// effect, ABOVE the `createClient()` call: ESM guarantees a static import
// evaluates before the importing module's own body runs, so this line always
// executes before the SDK client (and its param-stripping) is constructed.
export const retornoOAuth = leerRetornoOAuth(window.location.search)
