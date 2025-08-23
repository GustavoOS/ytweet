import type { Db } from "@worker/uow/types";
import { postRepository } from "./post";

export const getRepositories = (db: Db) => ({
    post: postRepository(db),
});

export type Repositories = ReturnType<typeof getRepositories>;
