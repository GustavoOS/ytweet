import { mock } from 'bun:test';

// Mock the TRPC hooks
const mockCreateMutation = {
  mutate: mock(() => {}),
  isLoading: false,
  isError: false,
  isSuccess: false,
  data: undefined,
  error: null,
};

const mockUtils = {
  posts: {
    all: {
      invalidate: mock(() => {}),
    },
  },
};

export const api = {
  posts: {
    create: {
      useMutation: mock(() => mockCreateMutation),
    },
  },
  useUtils: mock(() => mockUtils),
};
