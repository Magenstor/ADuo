# 031 — Vitest, Testing Library y jsdom

| | |
|---|---|
| **Estado** | pendiente |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [026](026-proyecto-vite.md) |
| **Bloquea a** | 039 |

## Objetivo

El corredor de tests. Va antes del primer dominio.

## Pasos

- [ ] Instalar `vitest`, `@testing-library/react`, `@testing-library/user-event` y `jsdom`.
- [ ] Crear `src/test/setup.ts`.
- [ ] Añadir el script `test` a `package.json`.

## Hecho cuando

- `pnpm test` corre y pasa con un test trivial.

## Ojo con esto

Va **antes** que el bloque de dominio y no después: sin corredor no hay TDD, y el dominio es justo la parte que se escribe con tests primero.
