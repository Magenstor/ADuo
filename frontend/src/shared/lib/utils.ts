import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merges class names and resolves Tailwind conflicts, keeping the last one.
// Every shadcn/ui component imports this, so it has to live where
// components.json points `utils` at.
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}
