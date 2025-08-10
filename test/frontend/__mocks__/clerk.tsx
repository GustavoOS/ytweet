/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { mock } from 'bun:test';

// Simple mock for the useUser hook
export const useUser = mock(() => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: 'user_123',
    firstName: 'John',
    lastName: 'Doe',
    profileImageUrl: 'https://example.com/john-doe.jpg',
    emailAddresses: [{ emailAddress: 'john.doe@example.com' }],
    fullName: 'John Doe',
    imageUrl: 'https://example.com/john-doe.jpg',
  },
}));

// Simple mock for ClerkProvider that just renders children
export const ClerkProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};