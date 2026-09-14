import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

// Primary in-app navigation. Ships with the single module-1 destination
// (`/`) — see design D4/Deferred: the negative "not the active link"
// assertion has no second destination to exercise until task 049.
//
// `aria-current="page"` is written by the router itself (`link.js:355-358`,
// spread after `activeProps`) — never set it by hand. `activeOptions` is
// intentionally omitted so `to="/"` stays active by prefix match on a
// future `/$listaId` (task 050): passing `{ exact: true }` would break
// that. `activeProps.className` is explicit because an omitted `activeProps`
// silently defaults to `className: 'active'` (`link.js:350`).
export function NavegacionApp() {
  return (
    <nav aria-label="Principal">
      <Link
        to="/"
        // `min-h-11 min-w-11` (2.75rem = 44px) tops up the `sm` button size
        // (h-8 = 32px) to the DESIGN.md 44px touch-target minimum, without
        // touching the shared `Button`/`buttonVariants` defaults — those are
        // shadcn CLI-generated and other screens depend on their sizing.
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'min-h-11 min-w-11',
        )}
        activeProps={{ className: 'bg-accent text-accent-foreground' }}
      >
        Listas
      </Link>
    </nav>
  )
}
