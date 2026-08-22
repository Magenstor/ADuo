import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from '@/app/router'
import { AppProviders } from '@/app/providers/query'

// The application boots here and nowhere else. The router is built by
// app/router.tsx: before, this file created a second one and declared the
// Register type again, so there were two routers claiming to be the same.
const router = getRouter()

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}
