import type { User } from "@worker/services/shared";
import type { UOW } from "@worker/uow";
import type { PostRepository } from "@worker/uow/repositories/post";
import type { Tx } from "@worker/uow/types";
import { mock } from "bun:test";

// Mock post data type
type MockPost = {
    id: string;
    content: string;
    authorName: string;
    profilePicture: string | null;
    createdAt: Date;
    updatedAt: Date | null;
};

// Test data factories
export const createMockPost = (overrides: Partial<MockPost> = {}): MockPost => ({
    id: "123e4567-e89b-12d3-a456-426614174000",
    content: "Test post content",
    authorName: "John Doe",
    profilePicture: "https://example.com/profile.jpg",
    createdAt: new Date("2025-08-23T10:00:00Z"),
    updatedAt: null,
    ...overrides
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
    fullName: "John Doe",
    imageUrl: "https://example.com/profile.jpg",
    ...overrides
});

// Mock factory functions
export const createMockPostRepository = (
    findAllMock = mock(),
    createMock = mock()
): PostRepository => ({
    findAll: findAllMock as unknown as PostRepository['findAll'],
    create: createMock as unknown as PostRepository['create']
});

export const createMockUOW = (
    postRepository: PostRepository,
    transactFn?: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>,
    useTransactionMock = mock()
): UOW<Tx> => ({
    repositories: {
        post: postRepository
    },
    transact: transactFn || mock(),
    useTransaction: useTransactionMock
});
