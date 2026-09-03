import { createFileRoute } from '@tanstack/react-router'

// Placeholder only — task 039 replaces `AppPlaceholder` with the real
// signed-in home screen. Defined inline per design Decision 5:
// `docs/03-Arquitectura.md:80` forbids module LOGIC in `src/routes/`, and a
// heading is not that.
export const Route = createFileRoute('/_privado/app')({
  component: AppPlaceholder,
})

function AppPlaceholder() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">ADuo</h1>
    </div>
  )
}
