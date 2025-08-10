import { app } from "@worker/hono/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@worker/trpc/context";
import { appRouter } from "./trpc/router";

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/trpc")) {
      return fetchRequestHandler({
        endpoint: "/trpc",
        req: request,
        router: appRouter,
        createContext: () =>
          createContext({ req: request, env: env, workerCtx: ctx }),
      });
    }
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;