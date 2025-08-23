import { createPost, CreatePostSchema, listPosts } from "@worker/services/post";
import { createTRPCRouter } from "@worker/trpc";
import { privateProcedure, publicProcedure } from "@worker/trpc/procedures";

export const postRouter = createTRPCRouter({
    all: publicProcedure
        .query(listPosts),

    create: privateProcedure
        .input(CreatePostSchema)
        .mutation(createPost),
})
