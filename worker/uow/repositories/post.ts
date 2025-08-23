import { PostTable } from "@worker/db/schema";
import type { Database, Tx } from "@worker/uow/types";
import { desc } from 'drizzle-orm';

export const postRepository = (db: Database | Tx) => ({
    findAll: () => db.select().from(PostTable).orderBy(desc(PostTable.id)),

    create: (newPost: {
        content: string;
        authorName: string;
        profilePicture: string;
    }) => db.insert(PostTable).values(newPost).returning()

});

export type PostRepository = ReturnType<typeof postRepository>;
