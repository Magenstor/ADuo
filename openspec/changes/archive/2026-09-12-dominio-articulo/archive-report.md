# Archive Report: `dominio-articulo`

## Status

**PASS** — the change was archived using the authoritative native SDD status supplied by the parent. The v2 status reported `nextRecommended: archive`, `dependencies.archive: ready`, `apply: all_done`, `verify: all_done`, and no blockers. All implementation tasks were checked before archive-time synchronization and the move.

## Artifacts Read

- `openspec/changes/dominio-articulo/proposal.md`
- `openspec/changes/dominio-articulo/specs/articulo-domain/spec.md`
- `openspec/changes/dominio-articulo/design.md`
- `openspec/changes/dominio-articulo/tasks.md`
- `openspec/changes/dominio-articulo/apply-progress.md`
- `openspec/changes/dominio-articulo/verify-report.md`
- `openspec/changes/dominio-articulo/sync-report.md`
- `openspec/config.yaml`

## Verification and Task Gate

- Verification verdict: `PASS WITH WARNINGS`; machine-readable verdict: `pass`.
- Requirements: 5/5; scenarios: 9/9.
- Blockers: 0; critical findings: 0.
- Full test exit code: 0; TypeScript check exit code: 0.
- Persisted `tasks.md` was re-read immediately before archive-time synchronization.
- Implementation task boxes remaining unchecked: none (`5/5` complete).
- No stale-checkbox reconciliation was performed.
- No non-critical partial archive approval was needed.

## Sync and Canonical Spec

The previous `sync-report.md` records a blocked sync attempt from the older status shape (`dependencies.sync: blocked`) and confirms that canonical specs were not updated. That evidence is preserved unchanged in the archived change.

Under the parent-supplied authoritative v2 status, sync was not a dependency and the route was directly to archive. Because the canonical domain spec was absent, archive-time synchronization copied the complete change spec to:

- `openspec/specs/articulo-domain/spec.md`

This was a new canonical spec; no ADDED, MODIFIED, REMOVED, or RENAMED delta operations were present.

### Requirements Synced

- Public article contract
- Deterministic marking API
- Coherent unmarking API
- Stable incorporation ordering API
- Pure domain boundary

## Collisions and Destructive Merge

- Active same-domain change warnings: none found.
- Destructive merge: none; no requirements were replaced or removed.
- Destructive approval: not applicable.
- Legacy flat change spec: not present; the domain spec used `specs/articulo-domain/spec.md`.

## Status and Action Context

- Status schema: `gentle-pi.sdd-status` v2, as supplied by the parent.
- Change: `dominio-articulo`.
- Artifact store: `openspec`.
- Native route: `archive` ready.
- Action context: `repo-local`.
- Workspace root and allowed edit root: `/Users/cmotero/repos/ADuo`.
- Canonical and archive paths are inside the authoritative workspace and allowed edit root.
- Parent retained acquire and settlement obligations; this executor did not run acquire or settle.
- Failed sync evidence to be remediated by parent settlement: `sha256:bb4325f37933ad0a0de05eba2713fcaf46fe9daf6ce0c0c4f7d2b00766bf2878`.

## Archived Path

`openspec/changes/dominio-articulo/` was moved to:

`openspec/changes/archive/2026-09-12-dominio-articulo/`

## Result

Canonical synchronization completed through the archive-time new-domain copy, the audit evidence for the earlier blocked sync was retained, and the completed change was moved to the dated archive.
