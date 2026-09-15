# list-shopping-detail Specification

## Purpose

Provide a mobile-first shopping list detail UI for managing articles inside one selected list.

## Requirements

### Requirement: Route renders the selected list detail

The app MUST expose a private route at `/listas/$listaId` that reads the route parameter and renders the shopping detail UI for that list. The route shell MUST remain thin and MUST NOT own article business behavior.

#### Scenario: Selected list name is shown

- GIVEN `useListas` returns a list whose `id` matches the route `listaId`
- WHEN the user opens `/listas/$listaId`
- THEN the page shows that list's name as the detail heading.

#### Scenario: Unknown list is handled without leaking another list

- GIVEN `useListas` is ready and no list matches `listaId`
- WHEN the detail page renders
- THEN it shows an empty/not-found state for the selected list
- AND it does not render articles from another list.

### Requirement: Articles are displayed pending first with purchased grouped last

The detail UI MUST render the current list's pending articles first and purchased articles in a separate final group. Purchased articles MUST remain visible until explicitly deleted or cleared.

#### Scenario: Pending and purchased groups are ordered for shopping

- GIVEN a list has pending and purchased articles
- WHEN the detail page renders
- THEN pending articles appear before the purchased group
- AND purchased articles remain visible in the purchased group.

### Requirement: User can add and toggle articles

The detail UI MUST allow adding a valid article through `useArticulos(listaId).agregar`. It MUST allow marking and unmarking visible current articles through `marcar` and `desmarcar`.

#### Scenario: Add succeeds and clears the input

- GIVEN the add input contains valid content
- WHEN `agregar` resolves successfully
- THEN the action is called with the submitted content
- AND the input is cleared.

#### Scenario: Add failure preserves the input

- GIVEN the add input contains valid content
- WHEN `agregar` resolves with a failure
- THEN the input remains available for correction or retry.

#### Scenario: Mark and unmark call the scoped actions

- GIVEN a pending article and a purchased article are visible
- WHEN the user toggles each control
- THEN the pending article calls `marcar(id)`
- AND the purchased article calls `desmarcar(id)`.

### Requirement: User can edit and delete a single article

The detail UI MUST allow editing a visible article's content through `editar(id, contenido)` and deleting it through `eliminar(id)`. Editing MUST keep a local draft while editing and MUST not mutate another row.

#### Scenario: Edited content is persisted for the selected article

- GIVEN a visible article is in edit mode
- WHEN the user submits new valid content
- THEN `editar` is called with that article id and the submitted content.

#### Scenario: Delete removes only the selected article

- GIVEN a visible article row
- WHEN the user activates delete for that row
- THEN `eliminar` is called with that article id.

### Requirement: Purchased articles can be cleared in bulk

The detail UI MUST expose a clear-purchased control for the current list. The control MUST call `limpiarComprados` only when purchased articles are present and MUST be disabled or inert when none are visible.

#### Scenario: Clear purchased calls the bulk action

- GIVEN the current list has purchased articles
- WHEN the user activates clear purchased
- THEN `limpiarComprados` is called.

#### Scenario: Clear purchased is disabled with no purchased articles

- GIVEN the current list has no purchased articles
- WHEN the page renders
- THEN the clear-purchased control is disabled or absent
- AND the bulk action is not called.

### Requirement: Search is client-side view state

The detail UI MUST provide a search input that filters already-loaded articles using `coincideConBusqueda`. Search text MUST be local UI state and MUST NOT become part of a query key or cause server fetch behavior. Filtering MUST preserve pending-first and purchased-last grouping.

#### Scenario: Search normalizes accents

- GIVEN a visible article named `Azúcar`
- WHEN the user searches for `azucar`
- THEN the article remains visible.

#### Scenario: Search preserves grouping

- GIVEN matching pending and purchased articles
- WHEN the user filters the list
- THEN matching pending articles still appear before matching purchased articles.

### Requirement: Touch ergonomics fit the supermarket context

The primary add and mark/unmark controls MUST have at least 44px touch targets. Icon-only or compact row actions MUST have accessible labels and usable touch width. The layout MUST be mobile-first and keep primary actions reachable on small screens.

#### Scenario: Primary touch targets are large enough

- GIVEN the page renders on a mobile-sized viewport
- WHEN controls for adding and marking are inspected
- THEN they expose classes or attributes equivalent to a minimum 44px touch target.

#### Scenario: Compact actions are accessible

- GIVEN edit/delete controls are rendered as compact buttons
- WHEN assistive technology reads them
- THEN each control has an accessible label naming the action and article context.
