import { expect, test, describe, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import CreatePost from '@/components/posts/create';
import userEvent from '@testing-library/user-event';

// Import mocks
import { useUser } from '../../../frontend/__mocks__/clerk';
import { api } from '../../../frontend/__mocks__/trpc';

// Mock the modules with the imported mocks
mock.module('@clerk/clerk-react', () => ({
  useUser,
}));

mock.module('@/trpc', () => ({
  api,
}));


const user = userEvent.setup();

describe('CreatePost component', () => {

  test('displays create post form when user is signed in', () => {
    // Render the component
    render(<CreatePost />);

    // Assert that the post creation form is displayed
    expect(screen.getByPlaceholderText('What are you up to?')).toBeDefined();
    expect(screen.getByText('Post it!')).toBeDefined();
  });

  test('signed in user can view post it button', () => {
    // Just test that the component renders without crashing
    // Since we have global mocks, this will render the signed-in state
    render(<CreatePost />);

    // Check that basic elements are present
    expect(screen.getByRole('textbox')).toBeDefined();
    expect(screen.getByRole('button', { name: /post it/i })).toBeDefined();
  });

  test('mutation is called on post creation', async () => {
    // Render the component
    render(<CreatePost />);

    // Simulate user interaction
    const postInput = screen.getByPlaceholderText('What are you up to?');
    const postButton = screen.getByRole('button', { name: /post it/i });

    // Get the user event instance
    

    // Simulate typing in the input
    await user.type(postInput, 'Hello World!');    
    // Simulate clicking the post button
    await user.click(postButton);

    // Get the mock mutation function that was called
    const mockMutation = api.posts.create.useMutation();
    
    // Assert that the mutation was called
    expect(mockMutation.mutate).toHaveBeenCalledWith({
      content: 'Hello World!',
    });
  });


});