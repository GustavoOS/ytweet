import { TRPCError } from "@trpc/server";
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

interface AuthMockContext {
    req: Request;
    env: {
        CLERK_SECRET_KEY: string;
        CLERK_PUBLISHABLE_KEY: string;
        DATABASE_URL: string;
        REDIS_URL: string;
        REDIS_TOKEN: string;
        HYPERDRIVE: Record<string, unknown>;
    };
    workerCtx: Record<string, unknown>;
    db: Record<string, unknown>;
}


describe("Authentication Middleware", () => {
    // Mock the Clerk backend module within the test suite scope
    const mockGetUser = mock();
    const mockAuthenticateRequest = mock();
    const mockCreateClerkClient = mock();

    mock.module("@clerk/backend", () => ({
        createClerkClient: mockCreateClerkClient,
    }));

    let mockContext: AuthMockContext;
    let mockNext: ReturnType<typeof mock>;
    let mockRequest: Request;

    afterAll(() => {
        // Restore the mocks to prevent interference with other tests
        mock.restore();
    });

    beforeEach(async () => {
        // Reset all mocks
        mockGetUser.mockReset();
        mockAuthenticateRequest.mockReset();
        mockCreateClerkClient.mockReset();
        mockNext = mock();

        // Create a mock request
        mockRequest = new Request("https://example.com/test");

        // Setup default mock context
        mockContext = {
            req: mockRequest,
            env: {
                CLERK_SECRET_KEY: "test-secret-key",
                CLERK_PUBLISHABLE_KEY: "test-publishable-key",
                DATABASE_URL: "postgresql://user:pass@prod-db.example.com:5432/app",
                REDIS_URL: "redis://localhost:6379",
                REDIS_TOKEN: "test-token",
                HYPERDRIVE: {},
            },
            workerCtx: {},
            db: {},
        };

        // Setup default Clerk client mock
        mockCreateClerkClient.mockReturnValue({
            authenticateRequest: mockAuthenticateRequest,
            users: {
                getUser: mockGetUser,
            },
        });

        mockNext.mockResolvedValue({ ctx: mockContext });
    });

    // Helper function to create and execute the middleware
    async function executeMiddleware() {
        // Import the middleware module fresh each time to ensure mocks are applied
        const middlewareModule = await import("@worker/trpc/middlewares/auth");

        // Create a test procedure with the auth middleware
        const { t } = await import("@worker/trpc");
        const testProcedure = t.procedure.use(middlewareModule.authentication);

        // Extract the middleware function
        const middleware = testProcedure["_def"].middlewares[0];

        // Create a complete middleware context with all required properties
        const middlewareContext = {
            ctx: mockContext,
            type: "query" as const,
            path: "test",
            input: undefined,
            getRawInput: async () => undefined,
            meta: undefined,
            signal: undefined,
            next: mockNext,
        };

        return middleware(middlewareContext);
    }

    describe("when user is authenticated", () => {
        const mockUser = {
            id: "user_123",
            emailAddresses: [{ emailAddress: "test@example.com" }],
            firstName: "John",
            lastName: "Doe",
        };

        beforeEach(() => {
            // Setup successful authentication flow
            const mockAuth = {
                isAuthenticated: true,
                userId: "user_123",
            };

            const mockRequestState = {
                toAuth: () => mockAuth,
            };

            mockAuthenticateRequest.mockResolvedValue(mockRequestState);
            mockGetUser.mockResolvedValue(mockUser);
        });

        test("should call createClerkClient with correct credentials", async () => {
            await executeMiddleware();

            expect(mockCreateClerkClient).toHaveBeenCalledWith({
                secretKey: "test-secret-key",
                publishableKey: "test-publishable-key",
            });
        });

        test("should authenticate request with context.req", async () => {
            await executeMiddleware();

            expect(mockAuthenticateRequest).toHaveBeenCalledWith(mockRequest);
        });

        test("should fetch user data when authenticated", async () => {
            await executeMiddleware();

            expect(mockGetUser).toHaveBeenCalledWith("user_123");
        });

        test("should call next with user in context", async () => {
            const result = await executeMiddleware();

            expect(mockNext).toHaveBeenCalledWith({
                ctx: {
                    ...mockContext,
                    user: mockUser,
                },
            });
            expect(result).toMatchObject(expect.any(Object));
        });

        test("should return the result from next middleware", async () => {
            const result = await executeMiddleware();

            expect(result).toBeDefined();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe("when user is not authenticated", () => {
        beforeEach(() => {
            // Setup failed authentication flow
            const mockAuth = {
                isAuthenticated: false,
                userId: null,
            };

            const mockRequestState = {
                toAuth: () => mockAuth,
            };

            mockAuthenticateRequest.mockResolvedValue(mockRequestState);
        });

        test("should throw UNAUTHORIZED error when user is not authenticated", async () => {
            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unable to get auth",
                })
            );

            expect(mockGetUser).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        test("should not call getUser when authentication fails", async () => {
            try {
                await executeMiddleware();
            } catch {
                // Expected to throw
            }

            expect(mockGetUser).not.toHaveBeenCalled();
        });
    });

    describe("when authentication state is null", () => {
        beforeEach(() => {
            const mockRequestState = {
                toAuth: () => null,
            };

            mockAuthenticateRequest.mockResolvedValue(mockRequestState);
        });

        test("should throw UNAUTHORIZED error when auth state is null", async () => {
            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unable to get auth",
                })
            );

            expect(mockGetUser).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe("error handling", () => {
        test("should throw UNAUTHORIZED when Clerk client creation fails", async () => {
            mockCreateClerkClient.mockImplementation(() => {
                throw new Error("Invalid credentials");
            });

            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unable to get auth",
                })
            );

            expect(mockNext).not.toHaveBeenCalled();
        });

        test("should throw UNAUTHORIZED when authenticateRequest fails", async () => {
            mockAuthenticateRequest.mockRejectedValue(new Error("Request authentication failed"));

            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unable to get auth",
                })
            );

            expect(mockGetUser).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        test("should throw UNAUTHORIZED when getUser fails", async () => {
            const mockAuth = {
                isAuthenticated: true,
                userId: "user_123",
            };

            const mockRequestState = {
                toAuth: () => mockAuth,
            };

            mockAuthenticateRequest.mockResolvedValue(mockRequestState);
            mockGetUser.mockRejectedValue(new Error("User not found"));

            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unable to get auth",
                })
            );

            expect(mockNext).not.toHaveBeenCalled();
        });

        test("should propagate errors from next middleware", async () => {
            const mockUser = {
                id: "user_123",
                emailAddresses: [{ emailAddress: "test@example.com" }],
            };

            const mockAuth = {
                isAuthenticated: true,
                userId: "user_123",
            };

            const mockRequestState = {
                toAuth: () => mockAuth,
            };

            mockAuthenticateRequest.mockResolvedValue(mockRequestState);
            mockGetUser.mockResolvedValue(mockUser);

            const downstreamError = new Error("Downstream middleware error");
            mockNext.mockRejectedValue(downstreamError);

            await expect(executeMiddleware()).rejects.toThrow(downstreamError);

            expect(mockGetUser).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe("integration scenarios", () => {
        test("should handle complete authentication flow with real-like data", async () => {
            const mockUser = {
                id: "user_2abcd1234",
                emailAddresses: [
                    {
                        emailAddress: "john.doe@example.com",
                        id: "email_123"
                    }
                ],
                firstName: "John",
                lastName: "Doe",
                username: "johndoe",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const mockAuth = {
                isAuthenticated: true,
                userId: "user_2abcd1234",
                sessionId: "sess_123",
            };

            const mockRequestState = {
                toAuth: () => mockAuth,
            };

            mockAuthenticateRequest.mockResolvedValue(mockRequestState);
            mockGetUser.mockResolvedValue(mockUser);

            const result = await executeMiddleware();

            expect(mockCreateClerkClient).toHaveBeenCalledWith({
                secretKey: "test-secret-key",
                publishableKey: "test-publishable-key",
            });
            expect(mockAuthenticateRequest).toHaveBeenCalledWith(mockRequest);
            expect(mockGetUser).toHaveBeenCalledWith("user_2abcd1234");
            expect(mockNext).toHaveBeenCalledWith({
                ctx: {
                    ...mockContext,
                    user: mockUser,
                },
            });
            expect(result).toMatchObject(expect.any(Object));
        });

        test("should handle missing environment variables gracefully", async () => {
            mockContext.env.CLERK_SECRET_KEY = "";
            mockContext.env.CLERK_PUBLISHABLE_KEY = "";

            // This should still call createClerkClient with empty strings
            // Clerk will handle the validation
            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Unable to get auth",
                })
            );

            expect(mockCreateClerkClient).toHaveBeenCalledWith({
                secretKey: "",
                publishableKey: "",
            });
        });

        test("should work with different request types", async () => {
            // Test with POST request
            const postRequest = new Request("https://example.com/test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ test: "data" }),
            });

            mockContext.req = postRequest;

            const mockUser = { id: "user_123" };
            const mockAuth = { isAuthenticated: true, userId: "user_123" };
            const mockRequestState = { toAuth: () => mockAuth };

            mockAuthenticateRequest.mockResolvedValue(mockRequestState);
            mockGetUser.mockResolvedValue(mockUser);

            await executeMiddleware();

            expect(mockAuthenticateRequest).toHaveBeenCalledWith(postRequest);
        });
    });

    describe("console logging", () => {
        test("should log errors to console when authentication fails", async () => {
            const originalError = console.error;
            console.error = mock();

            const testError = new Error("Test authentication error");
            mockAuthenticateRequest.mockRejectedValue(testError);

            try {
                await executeMiddleware();
            } catch {
                // Expected to throw
            }

            expect(console.error).toHaveBeenCalledWith(testError);

            // Restore console.error
            console.error = originalError;
        });
    });
});
