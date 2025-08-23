import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@worker/trpc/router";

export const api = createTRPCReact<AppRouter>();