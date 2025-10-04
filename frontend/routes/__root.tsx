import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { QueryClient } from '@tanstack/react-query'
import '../styles/globals.css'
import type { AppRouter } from '@worker/trpc/router'

export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>
  queryClient: QueryClient
}


export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: () => (
    <div className='h-full min-h-screen w-screen bg-zinc-900 text-white py-8 px-80 dark'>
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  ),
})