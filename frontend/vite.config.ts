// defineConfig comes from vitest/config, not vite, so the `test` block below is
// typed. It is the same function plus the test schema.
import { defineConfig } from 'vitest/config'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
  ],
  test: {
    // jsdom gives the tests a DOM. Without it, rendering a component throws.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // With globals on, Testing Library also runs its automatic cleanup between
    // tests. Turning it off means unmounting by hand in every test file.
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})

export default config
