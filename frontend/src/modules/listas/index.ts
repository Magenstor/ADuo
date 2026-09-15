// The public module surface deliberately exposes projections and actions only.
// Collections, repositories, realtime subscriptions, and resource boundaries
// stay internal to preserve the application/storage separation.
export { useListas } from './application/useListas'
export { useArticulos } from './application/useArticulos'
export type { ErrorAplicacion, Resultado } from './application/useListas'
