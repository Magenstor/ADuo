# 031 — Vitest, Testing Library y jsdom

| | |
|---|---|
| **Estado** | ✅ hecha |
| **Bloque** | Frontend · Andamiaje |
| **Depende de** | [026](026-proyecto-vite.md) |
| **Bloquea a** | 039 |

## Objetivo

El corredor de tests. Va antes del primer dominio.

## Pasos

- [x] Instalar `vitest`, `@testing-library/react`, `@testing-library/user-event` y `jsdom`.
- [x] Crear `src/test/setup.ts`.
- [x] Añadir el script `test` a `package.json`.

## Hecho cuando

- `pnpm test` corre y pasa con un test trivial.

## Resultado

Hecha el 22 de agosto de 2026. Vitest **4.1.11**.

| Archivo | Qué cambió |
|---|---|
| `src/test/setup.ts` | Registra los matchers de jest-dom en el `expect` de Vitest. |
| `vite.config.ts` | Bloque `test`, y `defineConfig` pasa a importarse de `vitest/config`. |
| `tsconfig.json` | `"vitest/globals"` añadido a `types`. |
| `package.json` | Scripts `test` (`vitest run`) y `test:watch`. |
| `src/test/harness.test.tsx` | El test trivial. |

**Se añadió `@testing-library/jest-dom`**, que la tarea no listaba. Sin él, `setup.ts` no tendría
nada que hacer y no habría matchers de DOM: `toBeInTheDocument` no existiría.

`globals: true` no es una comodidad para ahorrar imports: **con globals apagado, Testing Library no
hace su limpieza automática entre tests** y hay que desmontar a mano en cada archivo. Un test que
hereda el DOM del anterior falla según el orden en que corran, que es de los fallos más caros de
diagnosticar.

### El test trivial ejercita la cadena entera

Renderiza el `Button` de shadcn y comprueba que está en el documento. En una sola aserción pasa por
jsdom, Testing Library, los matchers de `setup.ts` y el alias `@/` —que hasta ahora solo se había
probado en `vite build`, no bajo Vitest, que resuelve por su cuenta—.

**Y se comprobó que sabe fallar.** Cambiando el nombre buscado por uno inexistente, el test falla con
`Unable to find an accessible element`. Un test que solo se ha visto pasar no demuestra que el
corredor detecte nada.

## Ojo con esto

Va **antes** que el bloque de dominio y no después: sin corredor no hay TDD, y el dominio es justo la parte que se escribe con tests primero.
