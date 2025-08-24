import type { User } from "@clerk/backend";
import type { Context } from "@worker/trpc/context";
import { authFunction } from "@worker/trpc/middlewares/auth";
import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock the Clerk module
const mockCreateClerkClient = mock();
const mockAuthenticateRequest = mock();
const mockToAuth = mock();
const mockGetUser = mock();

mock.module("@clerk/backend", () => ({
  createClerkClient: mockCreateClerkClient,
}));

describe("authFunction", () => {
  let mockContext: Context;

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

    // Setup default Clerk client mock
    mockCreateClerkClient.mockReturnValue({
      authenticateRequest: mockAuthenticateRequest,
      users: {
        getUser: mockGetUser,
      },
    });
  });

  it("GIVEN an authenticated user WHEN getUser is called THEN user is returned", async () => {
    // Given
    const mockUser = { id: "user_123", firstName: "John" } as unknown as User;
    
    mockAuthenticateRequest.mockResolvedValue({ toAuth: mockToAuth });
    mockToAuth.mockReturnValue({ isAuthenticated: true, userId: "user_123" });
    mockGetUser.mockResolvedValue(mockUser);

    // When
    const result = await authFunction(mockContext);

    // Then
    expect(result).toBe(mockUser);
    expect(mockCreateClerkClient).toHaveBeenCalledWith({
      secretKey: "test-secret-key",
      publishableKey: "test-publishable-key",
    });
    expect(mockGetUser).toHaveBeenCalledWith("user_123");
  });

  it("GIVEN an unauthenticated user WHEN getUser is called THEN Error is thrown", async () => {
    // Given
    mockAuthenticateRequest.mockResolvedValue({ toAuth: mockToAuth });
    mockToAuth.mockReturnValue({ isAuthenticated: false, userId: null });

    // When & Then
    expect(authFunction(mockContext)).rejects.toThrow("User is not authenticated");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("GIVEN clerk backend error WHEN getUser is called THEN error is thrown", async () => {
    // Given
    mockAuthenticateRequest.mockRejectedValue(new Error("Clerk API error"));

    // When & Then
    expect(authFunction(mockContext)).rejects.toThrow("Clerk API error");
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});