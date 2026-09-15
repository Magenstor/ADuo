// Builds a typed application error from any cause without mutating it. The
// cause may be an object shared with other consumers (a household error from
// `useHogar()`), so its own `tipo` must survive; the label lives only on the
// new error and the original is kept reachable through `cause`.
export function fallo<T extends string>(
  tipo: T,
  causa: unknown,
): Error & { tipo: T } {
  const mensaje = causa instanceof Error ? causa.message : String(causa)
  return Object.assign(new Error(mensaje, { cause: causa }), { tipo })
}
