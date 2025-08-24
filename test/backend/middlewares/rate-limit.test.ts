import { describe, test, expect, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { rateLimitMiddlewareFunction } from "@worker/trpc/middlewares/rate-limit";
import type { Context } from "@worker/trpc/context";

// Mock the Ratelimit class
const mockLimit = mock();
const mockSlidingWindow = mock((requests: number, window: string) => ({
  type: "slidingWindow",
  requests,
  window,
}));

const MockRatelimitConstructor = mock(function() {
  return {
    limit: mockLimit,
  };
});

// Add static methods using object assignment
Object.assign(MockRatelimitConstructor, {
  slidingWindow: mockSlidingWindow,
});

// Mock modules
mock.module("@upstash/ratelimit", () => ({
  Ratelimit: MockRatelimitConstructor,
}));

describe("rateLimitMiddlewareFunction", () => {
  let mockContext: Context;
  let mockNext: ReturnType<typeof mock>;

  beforeEach(() => {
    // Reset all mocks
    mockLimit.mockReset();
    MockRatelimitConstructor.mockReset();
    mockNext = mock();

    // Setup mock context
    mockContext = {
      req: {
        headers: new Headers(),
      },
      env: {
        DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      },
      redis: {},
      db: {},
      uow: {},
      workerCtx: {},
    } as Context;

    // Setup default Ratelimit constructor behavior
    MockRatelimitConstructor.mockReturnValue({
      limit: mockLimit,
    });
  });

  test("GIVEN a request with valid IP WHEN rate limiter returns success THEN next should be called", async () => {
    // Given
    mockContext.req.headers.set("CF-Connecting-IP", "192.168.1.1");
    mockLimit.mockResolvedValue({ success: true });
    const expectedResult = { data: "test" };
    mockNext.mockResolvedValue(expectedResult);

    // When
    const result = await rateLimitMiddlewareFunction({
      ctx: mockContext,
      next: mockNext,
    });

    // Then
    expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
    expect(mockNext).toHaveBeenCalledWith({ ctx: mockContext });
    expect(result).toBe(expectedResult);
  });

  test("GIVEN a request with valid IP WHEN rate limiter returns failure THEN should throw TOO_MANY_REQUESTS error", async () => {
    // Given
    mockContext.req.headers.set("CF-Connecting-IP", "192.168.1.1");
    mockLimit.mockResolvedValue({ success: false });

    // When & Then
    expect(
      rateLimitMiddlewareFunction({
        ctx: mockContext,
        next: mockNext,
      })
    ).rejects.toThrow(
      new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      })
    );
    expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("GIVEN a request without IP WHEN DATABASE_URL host is localhost THEN next should be called", async () => {
    // Given
    mockContext.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    const expectedResult = { data: "test" };
    mockNext.mockResolvedValue(expectedResult);

    // When
    const result = await rateLimitMiddlewareFunction({
      ctx: mockContext,
      next: mockNext,
    });

    // Then
    expect(mockNext).toHaveBeenCalledWith({ ctx: mockContext });
    expect(result).toBe(expectedResult);
    expect(mockLimit).not.toHaveBeenCalled(); // limit() should not be called in local mode
  });

  test("GIVEN a request without IP WHEN DATABASE_URL host is remote postgres connection THEN should throw BAD_REQUEST error", async () => {
    // Given
    mockContext.env.DATABASE_URL = "postgres://user:pass@remote-host.com:5432/db";

    // When & Then
    expect(
      rateLimitMiddlewareFunction({
        ctx: mockContext,
        next: mockNext,
      })
    ).rejects.toThrow(
      new TRPCError({
        code: "BAD_REQUEST",
        message: "IP address not found",
      })
    );

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockLimit).not.toHaveBeenCalled(); // limit() should not be called since IP is missing
  });
});