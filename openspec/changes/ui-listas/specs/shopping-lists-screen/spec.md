# shopping-lists-screen Specification

## Purpose

Let a household member view, create, rename, and delete the household's shared shopping lists from `/`, with every loading/empty/error state handled and a link into each list's detail route.

## Scope and Compatibility

New capability. Consumes `shopping-application-hooks` (`useListas`, `useArticulos`) and `household-context` (`useHogar`) read-only; MUST NOT modify either. List detail route, article UI, and any `household-context` change are out of scope.

## Requirements

### Requirement: Household-gated screen state

The screen MUST derive its top-level state from `useHogar()` and `useListas()` by this priority:

| # | Condition | Rendered state |
|---|---|---|
| 1 | household `loading`, or `ready` with `useListas().ready` false | loading indicator only |
| 2 | household `sin-hogar` | "no household" empty state (no create form) |
| 3 | household `error` (`useHogar().estado === 'error'`, surfaced by `useListas().error.tipo === 'realtime'` when no mutation error is pending) | error state: a destructive alert banner (`role="alert"`) with the error message; no rows, no form |
| 4 | `ready` + lists `ready` + zero lists | "no lists yet" empty state with the create form |
| 5 | `ready` + lists `ready` + one or more lists | create form pinned above the mapped rows |

Only one of these five states renders at a time. A mutation error from `crear`, `renombrar`, or `eliminar` (`useListas().error.tipo` `persistence` or `query`) MUST NOT replace states 4 or 5 with state 3. Instead it MUST render as a destructive alert banner (`role="alert"`) above the create form while that state's lists (or empty state) and form stay visible and usable — the banner and the second-member notice are overlays on states 4–5, not states themselves. A `tipo === 'validation'` error MUST NOT appear in that banner; it MUST surface inline next to the form or row control that produced it.

#### Scenario: Each priority condition renders its own state and no other

- GIVEN one of the five conditions above holds and no mutation-error overlay applies
- WHEN the screen renders
- THEN it shows only that row's state
- AND it shows neither list rows, a create form, nor another row's state, unless that row specifies one.

#### Scenario: A persistence or query mutation error overlays without emptying the screen

- GIVEN state 4 or state 5 is showing
- WHEN a `crear`, `renombrar`, or `eliminar` call resolves with `useListas().error.tipo` equal to `persistence` or `query`
- THEN a destructive `role="alert"` banner appears above the create form
- AND the lists (or empty state) and the form remain visible and usable, not replaced by state 3.

#### Scenario: Validation errors never reach the banner

- GIVEN a mutation resolves `ok:false` with `tipo === 'validation'`
- WHEN the screen re-renders
- THEN no banner appears
- AND the error is shown inline at the form or row that produced it.

### Requirement: Create a list with a mandatory name

The screen MUST render one reusable create-list form (visible label + text input + submit) using `useListas().crear`. A blank or whitespace-only name MUST be rejected client-side without calling `crear`. A valid submission MUST call `crear` and disable the submit control until it settles. An `ok:false` result MUST be shown to the user and MUST NOT clear the entered name.

#### Scenario: Blank name is rejected before the hook runs

- GIVEN the input is empty or whitespace-only
- WHEN the user submits
- THEN `crear` is not called and a validation message is shown.

#### Scenario: Valid submission disables the control until settled, and a rejection is shown

- GIVEN a valid name is submitted
- WHEN the promise is pending, THEN the submit control is disabled
- WHEN `crear` resolves `ok:false`, THEN the error is shown and the typed name remains.

### Requirement: Inline rename

Each row MUST offer an edit affordance swapping the name for a controlled input. Commit (Enter or equivalent) MUST call `useListas().renombrar(id, valor)`; cancel (Escape or equivalent) MUST discard the edit without calling `renombrar`. An `ok:false` result MUST be shown and MUST leave the row in edit state with the attempted value.

#### Scenario: Commit renames; cancel discards

- GIVEN a row in edit mode with a changed value
- WHEN the user commits, THEN `renombrar` is called and the row exits edit mode on success
- WHEN the user cancels instead, THEN `renombrar` is not called and the prior name is shown.

#### Scenario: A failed rename keeps the row editable and the list visible

- GIVEN a row is in edit mode and commits a changed value
- WHEN `renombrar` resolves `ok:false`
- THEN the row stays in edit mode with the attempted value and its inline error shown
- AND the rest of the list, the screen heading, and the create form remain visible — the failure does not replace the screen with the household-error state.

### Requirement: Delete confirmation states the article count

Deleting a list MUST open an `alert-dialog` before calling `useListas().eliminar`, stating how many articles from `useArticulos(listaId)` will be lost. Confirming MUST call `eliminar`; cancelling MUST not.

| `useArticulos(listaId).ready` | count | wording |
|---|---|---|
| false | any | neutral counting state (`role="status"`), never a literal zero |
| true | 0 | zero-article wording |
| true | 1 | singular "1 artículo" wording |
| true | >1 | plural "N artículos" wording |

#### Scenario: Wording matches readiness and count

- GIVEN the delete dialog is open
- WHEN `useArticulos(listaId)` is at one of the readiness/count rows above
- THEN the dialog text matches that row's wording.

#### Scenario: Cancel deletes nothing; confirming the last list returns to the empty state

- GIVEN the delete dialog is open
- WHEN the user cancels, THEN `eliminar` is not called and the list stays visible
- WHEN the user confirms deletion of the only remaining list and it succeeds, THEN the screen shows the empty-lists state with the create form.

### Requirement: Second-member notice

When `useHogar()` is `ready` and `miembros.length < 2`, the screen MUST show an informational alert with no call-to-action. It MUST NOT render when `miembros.length >= 2` or when the household is not `ready`.

#### Scenario: Notice visibility follows member count

- GIVEN household is `ready`
- WHEN `miembros.length` is 1, THEN the alert is shown
- WHEN `miembros.length` is 2 or more, THEN the alert is not shown.

### Requirement: Each row links to its list detail route

Every row MUST expose a keyboard-reachable link whose destination resolves to `/listas/$listaId` with that row's list id, independent of the rename/delete controls.

#### Scenario: A row's link targets its own list

- GIVEN a rendered row for list id `X`
- WHEN its link destination is inspected
- THEN it resolves to `/listas/$listaId` with `listaId` equal to `X`.

### Requirement: Structural constraints on this screen's implementation

| Constraint | Rule |
|---|---|
| Touch target | Every new interactive control (submit, edit, save, cancel, delete-trigger, dialog confirm/cancel) carries a `min-h-11` class |
| Owned paths | Route entry and UI code live only under `frontend/src/routes/_privado/index.tsx` and `frontend/src/modules/listas/ui/listas/**` |
| Shared UI additions | New primitives may be added additively under `frontend/src/shared/ui/`; pre-existing `button.tsx`, `alert.tsx`, `avatar.tsx` stay unmodified |
| Out-of-boundary files | Household context, navigation chrome, hook implementations, and the generated route tree are not modified |

#### Scenario: New controls and touched files satisfy every constraint

- GIVEN the change that implements this screen
- WHEN each row of the constraint table is checked
- THEN the implementation satisfies it.

## Out of Scope

List detail route and article UI, `household-context` behavior changes, navigation chrome, and the generated route tree.
