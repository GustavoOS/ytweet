import type { UOW } from "@worker/uow";

export type User = {
    fullName: string | null,
    imageUrl: string
};

export interface PublicContext<T> {
    uow: UOW<T>
}

export interface PrivateContext<T> extends PublicContext<T> {
    user: User
}
