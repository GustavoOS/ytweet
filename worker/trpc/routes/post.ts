import { PostTable } from "@worker/db/schema";
import { createTRPCRouter } from "@worker/trpc";
import { privateProcedure, publicProcedure } from "@worker/trpc/procedures";
import { desc } from 'drizzle-orm';
import z from "zod";

export const postRouter = createTRPCRouter({
    all: publicProcedure
    .input(z.object({}))
    .query(async ({ctx} ) => {
        const posts = await ctx.db.select().from(PostTable).orderBy(desc(PostTable.id));
        return posts;
    }),

    create: privateProcedure
    .input(z.object({
        content: z.string().max(256).trim().min(1)
    }))
    .mutation(async ({ctx, input}) => {       
        const newPost = {
            content: input.content,
            authorName: ctx.user.fullName!,
            profilePicture: ctx.user.imageUrl
        };
        const posts = await ctx.db.insert(PostTable).values(newPost).returning();
        return posts[0];
    }),
})
