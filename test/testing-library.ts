import { afterEach, expect } from 'bun:test';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Set up module mocking for tests
// This will make Bun use the __mocks__ directory for module resolution
process.env.NODE_ENV = 'test';

afterEach(() => {
  cleanup();
});
