import { describe, test, expect, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { rateLimitFunction } from "@worker/trpc/middlewares/rate-limit";
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

describe("rateLimitFunction", () => {
  let mockContext: Context;

  beforeEach(() => {
    // Reset all mocks
    mockLimit.mockReset();
    MockRatelimitConstructor.mockReset();

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

  test("GIVEN a request with valid IP WHEN rate limiter returns success THEN should not throw error", async () => {
    // Given
    mockContext.req.headers.set("CF-Connecting-IP", "192.168.1.1");
    mockLimit.mockResolvedValue({ success: true });

    // When & Then
    expect(rateLimitFunction(mockContext)).resolves.toBeUndefined();
    expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
  });

  test("GIVEN a request with valid IP WHEN rate limiter returns failure THEN should throw TOO_MANY_REQUESTS error", async () => {
    // Given
    mockContext.req.headers.set("CF-Connecting-IP", "192.168.1.1");
    mockLimit.mockResolvedValue({ success: false });

    // When & Then
    expect(rateLimitFunction(mockContext)).rejects.toThrow(
      new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      })
    );
    expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
  });

  test("GIVEN a request without IP WHEN DATABASE_URL host is localhost THEN should not throw error", async () => {
    // Given
    mockContext.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";

    // When & Then
    expect(rateLimitFunction(mockContext)).resolves.toBeUndefined();
    expect(mockLimit).not.toHaveBeenCalled(); // limit() should not be called in local mode
  });

  test("GIVEN a request without IP WHEN DATABASE_URL host is remote postgres connection THEN should throw BAD_REQUEST error", async () => {
    // Given
    mockContext.env.DATABASE_URL = "postgres://user:pass@remote-host.com:5432/db";

    // When & Then
    expect(rateLimitFunction(mockContext)).rejects.toThrow(
      new TRPCError({
        code: "BAD_REQUEST",
        message: "IP address not found",
      })
    );

    expect(mockLimit).not.toHaveBeenCalled(); // limit() should not be called since IP is missing
  });
});