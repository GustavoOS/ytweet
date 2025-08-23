import z from "zod";
import type { PrivateContext, PublicContext } from "./shared";

export const CreatePostSchema = z.object({
    content: z.string().max(256).trim().min(1)
})

type CreatePostSchemaType = z.infer<typeof CreatePostSchema>;


export const createPost = <T>({ input, ctx: { uow, user } }: {
    input: CreatePostSchemaType,
    ctx: PrivateContext<T>
}) =>
    uow.transact(async (tx) => {
        uow.useTransaction(tx);
        const newPost = {
            content: input.content,
            authorName: user.fullName!,
            profilePicture: user.imageUrl
        };
        const posts = await uow.repositories.post.create(newPost);
        return posts[0];
    });

export const listPosts = <T>({ ctx: { uow } }: { ctx: PublicContext<T> }) =>
    uow.repositories.post.findAll();
