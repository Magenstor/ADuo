import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'

// Informational, persistent notice shown when the household has fewer than
// two members (spec "Second-member notice"). `role="status"` overrides the
// shadcn default `role="alert"` (design D7): this is not an assertive
// interruption, and props spread after `role` in `alert.tsx` makes the
// override legal. No call-to-action — inviting a member is out of scope.
export function AvisoSegundoMiembro() {
  return (
    <Alert role="status">
      <AlertTitle>Todavía no hay nadie más en tu hogar.</AlertTitle>
      <AlertDescription>
        Invita a alguien para compartir las listas.
      </AlertDescription>
    </Alert>
  )
}
