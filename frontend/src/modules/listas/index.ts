// Public surface of the shopping-lists module.
//
// Everything the rest of the application is allowed to use from this module is
// re-exported here. Anything not listed is internal: importing it from outside
// the module is what erodes the boundary.
//
// Layer rules (docs/03-Arquitectura.md, section 3):
//   domain/          pure TypeScript. No React, no InsForge.
//   application/     use cases and hooks that orchestrate domain + infrastructure.
//   infrastructure/  the only layer that knows InsForge.
//   ui/              components and routes.

export {}
