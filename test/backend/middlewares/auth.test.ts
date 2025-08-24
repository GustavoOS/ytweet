import type { User } from "@clerk/backend";
import { TRPCError } from "@trpc/server";
import type { Context } from "@worker/trpc/context";
import { authenticateUserMiddlewareFunction } from "@worker/trpc/middlewares/auth";
import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock the Clerk module
const mockCreateClerkClient = mock();
const mockAuthenticateRequest = mock();
const mockToAuth = mock();
const mockGetUser = mock();

mock.module("@clerk/backend", () => ({
  createClerkClient: mockCreateClerkClient,
}));

describe("authenticateUserMiddlewareFunction", () => {
  let mockContext: Context;
  let mockNext: ReturnType<typeof mock>;

  beforeEach(() => {
    // Reset all mocks
    mockCreateClerkClient.mockReset();
    mockAuthenticateRequest.mockReset();
    mockToAuth.mockReset();
    mockGetUser.mockReset();

    // Setup mock context
    mockContext = {
      env: {
        CLERK_SECRET_KEY: "test-secret-key",
        CLERK_PUBLISHABLE_KEY: "test-publishable-key",
      },
      req: new Request("http://localhost"),
    } as Context;

    // Setup mock next function
    mockNext = mock().mockResolvedValue("next-result");

    // Setup default Clerk client mock
    mockCreateClerkClient.mockReturnValue({
      authenticateRequest: mockAuthenticateRequest,
      users: {
        getUser: mockGetUser,
      },
    });
  });

  it("GIVEN an authenticated user WHEN middleware runs THEN next is called with user attached to context", async () => {
    // Given
    const mockUser = { id: "user_123", firstName: "John" } as unknown as User;
    const mockAuth = { isAuthenticated: true, userId: "user_123" };
    
    mockAuthenticateRequest.mockResolvedValue({ toAuth: mockToAuth });
    mockToAuth.mockReturnValue(mockAuth);
    mockGetUser.mockResolvedValue(mockUser);

    // When
    const result = await authenticateUserMiddlewareFunction({
      ctx: mockContext,
      next: mockNext,
    });

    // Then
    expect(result).toBe("next-result");
    expect(mockNext).toHaveBeenCalledWith({
      ctx: { ...mockContext, user: mockUser },
    });
  });

  it("GIVEN an unauthenticated user WHEN middleware runs THEN TRPCError is thrown", async () => {
    // Given
    const mockAuth = {
      isAuthenticated: false,
      userId: null,
    };

    const mockRequestState = {
      toAuth: mockToAuth,
    };

    mockAuthenticateRequest.mockResolvedValue(mockRequestState);
    mockToAuth.mockReturnValue(mockAuth);

    // When & Then
    expect(
      authenticateUserMiddlewareFunction({
        ctx: mockContext,
        next: mockNext,
      })
    ).rejects.toThrow(TRPCError);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("GIVEN clerk backend error WHEN middleware runs THEN TRPCError is thrown", async () => {
    // Given
    const clerkError = new Error("Clerk API error");
    mockAuthenticateRequest.mockRejectedValue(clerkError);

    // When & Then
    expect(
      authenticateUserMiddlewareFunction({
        ctx: mockContext,
        next: mockNext,
      })
    ).rejects.toThrow(TRPCError);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});