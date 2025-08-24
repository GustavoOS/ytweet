import { t } from "@worker/trpc";
import { rateLimit, authentication } from "@worker/trpc/middlewares";

export const publicProcedure = t.procedure.use(rateLimit);
export const privateProcedure = t.procedure.use(rateLimit).use(authentication);
