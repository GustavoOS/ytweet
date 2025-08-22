import { t } from "@worker/trpc";
import { authentication } from "@worker/trpc/middlewares/auth";
import { rateLimit } from "@worker/trpc/middlewares/rate-limit";

export const publicProcedure = t.procedure.use(rateLimit);
export const privateProcedure = t.procedure.use(rateLimit).use(authentication);
