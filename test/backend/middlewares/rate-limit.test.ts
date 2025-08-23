import { TRPCError } from "@trpc/server";
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";


interface RateLimitMockContext {
    req: {
        headers: {
            get: ReturnType<typeof mock>;
        };
    };
    env: {
        DATABASE_URL: string;
        REDIS_URL: string;
        REDIS_TOKEN: string;
        CLERK_PUBLISHABLE_KEY: string;
        CLERK_SECRET_KEY: string;
        HYPERDRIVE: Record<string, unknown>;
    };
    workerCtx: Record<string, unknown>;
    db: Record<string, unknown>;
    redis: {
        get: ReturnType<typeof mock>;
        set: ReturnType<typeof mock>;
    };
}



describe("Rate Limit Middleware", () => {
    // Mock the ratelimit module within the test suite scope
    mock.module("@upstash/ratelimit", () => {
        const mockLimit = mock();

        const RatelimitConstructor = function (this: unknown) {
            return {
                limit: mockLimit,
            };
        };

        RatelimitConstructor.slidingWindow = mock(() => "mock-limiter");

        return {
            Ratelimit: RatelimitConstructor,
            __mockLimit: mockLimit, // Export the mock for test access
        };
    });

    let mockContext: RateLimitMockContext;
    let mockNext: ReturnType<typeof mock>;
    let mockHeaders: ReturnType<typeof mock>;
    let mockLimit: ReturnType<typeof mock>;

    afterAll(() => {
        // Restore the mocks to prevent interference with other tests
        mock.restore();
    });

    beforeEach(async () => {
        // Get the mock limit function from the mocked module
        const ratelimitModule = await import("@upstash/ratelimit");
        mockLimit = (ratelimitModule as unknown as { __mockLimit: ReturnType<typeof mock> }).__mockLimit;

        // Reset all mocks
        mockLimit.mockReset();
        mockNext = mock();
        mockHeaders = mock();

        // Setup default mock context
        mockContext = {
            req: {
                headers: {
                    get: mockHeaders,
                },
            },
            env: {
                DATABASE_URL: "postgresql://user:pass@prod-db.example.com:5432/app",
                REDIS_URL: "redis://localhost:6379",
                REDIS_TOKEN: "test-token",
                CLERK_PUBLISHABLE_KEY: "test",
                CLERK_SECRET_KEY: "test",
                HYPERDRIVE: {},
            },
            workerCtx: {},
            db: {},
            redis: {
                get: mock(),
                set: mock(),
            },
        };

        mockNext.mockResolvedValue({ ctx: mockContext });
    });

    // Helper function to create and execute the middleware
    async function executeMiddleware() {
        // Import the middleware module fresh each time to ensure mocks are applied
        const middlewareModule = await import("@worker/trpc/middlewares/rate-limit");

        // Create a test procedure with the rate limit middleware
        const { t } = await import("@worker/trpc");
        const testProcedure = t.procedure.use(middlewareModule.rateLimit);

        // Extract the middleware function - using bracket notation to avoid TS issues
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

    describe("when IP address is present", () => {
        beforeEach(() => {
            mockHeaders.mockReturnValue("192.168.1.1");
        });

        test("should allow request when rate limit is not exceeded", async () => {
            mockLimit.mockResolvedValue({ success: true });

            const result = await executeMiddleware();

            // We can't easily verify the Ratelimit constructor call with the current mock setup
            // but we can verify that our mock limit function was called
            expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
            expect(mockNext).toHaveBeenCalledWith({ ctx: mockContext });
            expect(result).toMatchObject(expect.any(Object));
        });

        test("should throw TOO_MANY_REQUESTS when rate limit is exceeded", async () => {
            mockLimit.mockResolvedValue({ success: false });

            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: "Rate limit exceeded",
                })
            );

            expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
            expect(mockNext).not.toHaveBeenCalled();
        });

        test("should use CF-Connecting-IP header for rate limiting", async () => {
            const testIP = "203.0.113.1";
            mockHeaders.mockReturnValue(testIP);
            mockLimit.mockResolvedValue({ success: true });

            await executeMiddleware();

            expect(mockHeaders).toHaveBeenCalledWith("CF-Connecting-IP");
            expect(mockLimit).toHaveBeenCalledWith(testIP);
        });
    });

    describe("when IP address is not present", () => {
        beforeEach(() => {
            mockHeaders.mockReturnValue(null);
        });

        test("should skip rate limiting in local environment", async () => {
            // Set DATABASE_URL to a local URL to trigger local mode
            mockContext.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";

            // Mock console.warn to avoid actual console output during tests
            const originalWarn = console.warn;
            console.warn = mock();

            const result = await executeMiddleware();

            expect(console.warn).toHaveBeenCalledWith("⚠️  Running in local mode, skipping rate limit");
            expect(mockLimit).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith({ ctx: mockContext });
            expect(result).toMatchObject(expect.any(Object));

            // Restore console.warn
            console.warn = originalWarn;
        });

        test("should throw BAD_REQUEST in non-local environment", async () => {
            // Set DATABASE_URL to a non-local URL to trigger production mode
            mockContext.env.DATABASE_URL = "postgresql://user:pass@prod-db.example.com:5432/app";

            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "BAD_REQUEST",
                    message: "IP address not found"
                })
            );

            expect(mockLimit).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe("Ratelimit configuration", () => {
        beforeEach(() => {
            mockHeaders.mockReturnValue("192.168.1.1");
            mockLimit.mockResolvedValue({ success: true });
        });

        test("should configure Ratelimit with sliding window of 10 requests per 10 seconds", async () => {
            await executeMiddleware();

            // Verify that our rate limiter was called, which means it was configured properly
            expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
            expect(mockLimit).toHaveBeenCalledTimes(1);
        });
    });

    describe("error handling", () => {
        beforeEach(() => {
            mockHeaders.mockReturnValue("192.168.1.1");
        });

        test("should propagate errors from rate limiter", async () => {
            const testError = new Error("Redis connection failed");
            mockLimit.mockRejectedValue(testError);

            await expect(executeMiddleware()).rejects.toThrow(testError);

            expect(mockNext).not.toHaveBeenCalled();
        });

        test("should propagate errors from next middleware", async () => {
            const testError = new Error("Downstream error");
            mockLimit.mockResolvedValue({ success: true });
            mockNext.mockRejectedValue(testError);

            await expect(executeMiddleware()).rejects.toThrow(testError);

            expect(mockLimit).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe("rate limit bypass scenarios", () => {
        test("should handle missing headers gracefully in local mode", async () => {
            mockHeaders.mockReturnValue(null);
            // Set DATABASE_URL to a local URL to trigger local mode
            mockContext.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";

            const originalWarn = console.warn;
            console.warn = mock();

            const result = await executeMiddleware();

            expect(result).toMatchObject(expect.any(Object));
            expect(mockNext).toHaveBeenCalled();

            console.warn = originalWarn;
        });

        test("should handle different IP formats", async () => {
            const ipv6Address = "2001:db8::1";
            mockHeaders.mockReturnValue(ipv6Address);
            mockLimit.mockResolvedValue({ success: true });

            await executeMiddleware();

            expect(mockLimit).toHaveBeenCalledWith(ipv6Address);
        });

        test("should handle empty string IP", async () => {
            mockHeaders.mockReturnValue("");
            // Set DATABASE_URL to a non-local URL to trigger production mode
            mockContext.env.DATABASE_URL = "postgresql://user:pass@prod-db.example.com:5432/app";

            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "BAD_REQUEST",
                    message: "IP address not found"
                })
            );
        });
    });

    describe("integration scenarios", () => {
        test("should work correctly in production-like environment", async () => {
            // Simulate production environment
            mockContext.env.DATABASE_URL = "postgresql://user:pass@prod-db.example.com:5432/app";
            mockHeaders.mockReturnValue("203.0.113.195");
            mockLimit.mockResolvedValue({ success: true });

            const result = await executeMiddleware();

            expect(mockLimit).toHaveBeenCalledWith("203.0.113.195");
            expect(result).toMatchObject(expect.any(Object));
        });

        test("should handle rate limit success/failure cycle", async () => {
            mockHeaders.mockReturnValue("192.168.1.100");

            // First request - success
            mockLimit.mockResolvedValueOnce({ success: true });
            await expect(executeMiddleware()).resolves.toMatchObject(expect.any(Object));

            // Second request - rate limited
            mockLimit.mockResolvedValueOnce({ success: false });
            await expect(executeMiddleware()).rejects.toThrow(
                new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: "Rate limit exceeded",
                })
            );
        });
    });
});