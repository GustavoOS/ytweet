import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import '../styles/globals.css'

export const Route = createRootRoute({
  component: () => (
    <div className='h-full min-h-screen w-screen bg-zinc-900 text-white py-8 px-80 dark'>
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  ),
})