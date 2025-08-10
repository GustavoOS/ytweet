import { expect, test, describe } from 'bun:test';
import { render, screen } from '@testing-library/react';
import CreatePost from '@/components/posts/create';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

describe('CreatePost', () => {

  test('displays create post form when user is signed in', () => {
    // Render the component
    render(<CreatePost />);

    // Assert that the post creation form is displayed
    expect(screen.getByPlaceholderText('What are you up to?')).toBeDefined();
    expect(screen.getByText('Post it!')).toBeDefined();
  });

  test('component renders without errors', () => {
    // Just test that the component renders without crashing
    // Since we have global mocks, this will render the signed-in state
    render(<CreatePost />);

    // Check that basic elements are present
    expect(screen.getByRole('textbox')).toBeDefined();
    expect(screen.getByRole('button', { name: /post it/i })).toBeDefined();
  });
});