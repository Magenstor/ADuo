// Shared blank/whitespace guard for list names, used by both the create form
// (`CrearLista`) and the inline rename form (`FilaLista`) — client-side
// rejection happens before either hook call per spec "Blank name is rejected
// before the hook runs".
export function nombreValido(valor: string): string | undefined {
  const normalizado = valor.trim()
  return normalizado === '' ? undefined : normalizado
}
