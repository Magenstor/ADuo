import { createClient } from '@insforge/sdk'

// The single point through which the application talks to the backend.
//
// Only `infrastructure/` layers are allowed to import this module
// (docs/03-Arquitectura.md, section 3.2). Keeping that rule is what makes the
// realtime decision reversible: swapping the data layer means rewriting those
// adapters and nothing else.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and fill it in.`,
    )
  }
  return value
}

// Anon key only. It ships inside the browser bundle by design, and row-level
// security is what protects the data. An admin or service key here would remove
// RLS from the picture entirely.
export const insforge = createClient({
  baseUrl: required('VITE_INSFORGE_URL', import.meta.env.VITE_INSFORGE_URL),
  anonKey: required(
    'VITE_INSFORGE_ANON_KEY',
    import.meta.env.VITE_INSFORGE_ANON_KEY,
  ),
})
