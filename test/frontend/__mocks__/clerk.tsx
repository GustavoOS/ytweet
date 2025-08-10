import React from 'react';
import { mock } from 'bun:test'

// A simple mock for ClerkProvider that just renders its children
export const ClerkProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// A mock for the useUser hook
// eslint-disable-next-line react-refresh/only-export-components
export const useUser = mock((): {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    emailAddresses: { emailAddress: string }[];
    fullName?: string;
    imageUrl?: string;
  } | null;
} => ({
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