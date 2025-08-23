import { describe, test, expect, mock } from "bun:test";
import { createPost, listPosts } from "@worker/services/post";
import type { Tx } from "@worker/uow/types";
import { createMockPost, createMockUOW, createMockPostRepository, createMockUser } from "./shared";


/* Test Setup */

const setupListPostsTest = () => {
    const mockPosts = [
        createMockPost({ content: "Test post 1" }),
        createMockPost({
            id: "123e4567-e89b-12d3-a456-426614174001",
            content: "Test post 2",
            authorName: "Jane Smith"
        })
    ];

    const mockFindAll = mock(() => Promise.resolve(mockPosts));
    const mockUow = createMockUOW(createMockPostRepository(mockFindAll));

    return { mockPosts, mockFindAll, ctx: { uow: mockUow } };
};

const setupCreatePostTest = (content: string) => {

    const user = createMockUser();
    const expectedPost = createMockPost({
        content,
        authorName: user.fullName!,
        profilePicture: user.imageUrl
    });

    const mockCreate = mock(() => Promise.resolve([expectedPost]));
    const mockUseTransaction = mock();
    const transactFn = <T>(fn: (tx: Tx) => Promise<T>) => fn({} as Tx);
    const mockUow = createMockUOW(
        createMockPostRepository(undefined, mockCreate),
        transactFn,
        mockUseTransaction
    );

    return {
        user,
        expectedPost,
        mockCreate,
        mockUseTransaction,
        ctx: { uow: mockUow, user }
    };
};

/* Test Suites */

describe("Post Services", () => {
    describe("listPosts", () => {
        test("GIVEN a public context WHEN calling listPosts THEN should call repository findAll and return posts", async () => {
            // GIVEN
            const { mockPosts, mockFindAll, ctx } = setupListPostsTest();

            // WHEN
            const result = await listPosts({ ctx });

            // THEN
            expect(mockFindAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockPosts);
        });
    });

    describe("createPost", () => {
        test("GIVEN valid input and private context WHEN calling createPost THEN should create post with correct format and return created post", async () => {
            // GIVEN
            const input = { content: "This is a test post" };
            const { user, expectedPost, mockCreate, mockUseTransaction, ctx } = setupCreatePostTest(input.content);

            // WHEN
            const result = await createPost({ input, ctx });

            // THEN
            expect(mockUseTransaction).toHaveBeenCalledTimes(1);
            expect(mockCreate).toHaveBeenCalledTimes(1);
            expect(mockCreate).toHaveBeenCalledWith({
                content: input.content,
                authorName: user.fullName,
                profilePicture: user.imageUrl
            });
            expect(result).toEqual(expectedPost);
        });
    });
});