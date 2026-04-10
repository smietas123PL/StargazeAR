import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => useAuthMock(),
}));

import { ProtectedRoute } from '../components/auth/ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children for authenticated users', () => {
    useAuthMock.mockReturnValue({ user: { uid: 'user-1' } });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={(
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to the login page', () => {
    useAuthMock.mockReturnValue({ user: null });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route
            path="/private"
            element={(
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });
});
