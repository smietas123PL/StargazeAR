import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const authInstance = { name: 'auth' };
  const dbInstance = { name: 'db' };
  const state: {
    authStateListener?: (user: unknown) => Promise<void> | void;
  } = {};
  const docMock = vi.fn();
  const getDocMock = vi.fn();
  const setDocMock = vi.fn();
  const signInWithPopupMock = vi.fn();
  const signOutMock = vi.fn();
  const onAuthStateChangedMock = vi.fn();
  const setCustomParametersMock = vi.fn();
  const unsubscribeMock = vi.fn();

  class GoogleAuthProviderMock {
    setCustomParameters = setCustomParametersMock;
  }

  return {
    authInstance,
    dbInstance,
    state,
    docMock,
    getDocMock,
    setDocMock,
    signInWithPopupMock,
    signOutMock,
    onAuthStateChangedMock,
    setCustomParametersMock,
    unsubscribeMock,
    GoogleAuthProviderMock,
  };
});

vi.mock('../lib/firebase', () => ({
  auth: mocks.authInstance,
  db: mocks.dbInstance,
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mocks.docMock(...args),
  getDoc: (...args: unknown[]) => mocks.getDocMock(...args),
  setDoc: (...args: unknown[]) => mocks.setDocMock(...args),
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: mocks.GoogleAuthProviderMock,
  signInWithPopup: (...args: unknown[]) => mocks.signInWithPopupMock(...args),
  signOut: (...args: unknown[]) => mocks.signOutMock(...args),
  onAuthStateChanged: (...args: unknown[]) => mocks.onAuthStateChangedMock(...args),
}));

import { AuthProvider, useAuth } from '../providers/AuthProvider';

function AuthConsumer() {
  const { user, profile, loading, signInWithGoogle, logout } = useAuth();

  return (
    <>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user ? String((user as { email?: string }).email ?? 'has-user') : 'no-user'}</div>
      <div data-testid="profile">{profile ? profile.plan : 'no-profile'}</div>
      <button onClick={() => signInWithGoogle()}>sign-in</button>
      <button onClick={() => logout()}>logout</button>
    </>
  );
}

function OutsideConsumer() {
  useAuth();
  return null;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.authStateListener = undefined;
    mocks.docMock.mockReturnValue({ ref: 'user-ref' });
    mocks.setDocMock.mockResolvedValue(undefined);
    mocks.getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'user-1',
        email: 'ada@example.com',
        displayName: 'Ada',
        plan: 'pro',
        createdAt: 123,
      }),
    });
    mocks.signInWithPopupMock.mockResolvedValue({ user: { email: 'ada@example.com' } });
    mocks.signOutMock.mockResolvedValue(undefined);
    mocks.onAuthStateChangedMock.mockImplementation((_auth, callback) => {
      mocks.state.authStateListener = callback as (user: unknown) => Promise<void> | void;
      return mocks.unsubscribeMock;
    });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('hides children while auth state is loading and unsubscribes on unmount', () => {
    const { queryByText, unmount } = render(
      <AuthProvider>
        <div>Protected Child</div>
      </AuthProvider>,
    );

    expect(queryByText('Protected Child')).not.toBeInTheDocument();

    unmount();

    expect(mocks.unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('loads an existing user profile from Firestore', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.({ uid: 'user-1', email: 'ada@example.com', displayName: 'Ada' });
    });

    expect(mocks.docMock).toHaveBeenCalledWith(mocks.dbInstance, 'users', 'user-1');
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    expect(screen.getByTestId('user')).toHaveTextContent('ada@example.com');
    expect(screen.getByTestId('profile')).toHaveTextContent('pro');
  });

  it('creates a new profile when no existing profile is found', async () => {
    mocks.getDocMock.mockResolvedValue({
      exists: () => false,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.({ uid: 'user-2', email: 'new@example.com', displayName: 'New User' });
    });

    await waitFor(() => {
      expect(mocks.setDocMock).toHaveBeenCalledWith(
        { ref: 'user-ref' },
        expect.objectContaining({
          uid: 'user-2',
          email: 'new@example.com',
          displayName: 'New User',
          plan: 'free',
        }),
      );
    });
    expect(screen.getByTestId('profile')).toHaveTextContent('free');
  });

  it('fills missing email and display name with empty strings for new profiles', async () => {
    mocks.getDocMock.mockResolvedValue({
      exists: () => false,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.({ uid: 'user-4', email: null, displayName: null });
    });

    await waitFor(() => {
      expect(mocks.setDocMock).toHaveBeenCalledWith(
        { ref: 'user-ref' },
        expect.objectContaining({
          uid: 'user-4',
          email: '',
          displayName: '',
          plan: 'free',
        }),
      );
    });
    expect(screen.getByTestId('profile')).toHaveTextContent('free');
  });

  it('handles profile loading errors without blocking the user', async () => {
    const error = new Error('profile failed');
    mocks.getDocMock.mockRejectedValue(error);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.({ uid: 'user-3', email: 'err@example.com', displayName: 'Error User' });
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error loading user profile'), error);
    });
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    expect(screen.getByTestId('user')).toHaveTextContent('err@example.com');
    expect(screen.getByTestId('profile')).toHaveTextContent('no-profile');
  });

  it('clears the profile when the user signs out', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.({ uid: 'user-1', email: 'ada@example.com', displayName: 'Ada' });
    });

    await act(async () => {
      await mocks.state.authStateListener?.(null);
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('profile')).toHaveTextContent('no-profile');
  });

  it('signs in with Google and logs out', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.(null);
    });

    fireEvent.click(screen.getByText('sign-in'));

    await waitFor(() => {
      expect(mocks.setCustomParametersMock).toHaveBeenCalledWith({ prompt: 'select_account' });
      expect(mocks.signInWithPopupMock).toHaveBeenCalledWith(mocks.authInstance, expect.any(mocks.GoogleAuthProviderMock));
    });

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => {
      expect(mocks.signOutMock).toHaveBeenCalledWith(mocks.authInstance);
    });
  });

  it('shows an alert when the popup is blocked', async () => {
    mocks.signInWithPopupMock.mockRejectedValue({ code: 'auth/popup-blocked' });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.(null);
    });

    fireEvent.click(screen.getByText('sign-in'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledTimes(1);
    });
  });

  it('ignores cancelled popup requests', async () => {
    mocks.signInWithPopupMock.mockRejectedValue({ code: 'auth/cancelled-popup-request' });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.(null);
    });

    fireEvent.click(screen.getByText('sign-in'));

    await waitFor(() => {
      expect(mocks.signInWithPopupMock).toHaveBeenCalled();
    });
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('shows a generic alert for other sign-in errors', async () => {
    mocks.signInWithPopupMock.mockRejectedValue({ code: 'auth/unknown', message: 'Nope' });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await mocks.state.authStateListener?.(null);
    });

    fireEvent.click(screen.getByText('sign-in'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Nope'));
    });
  });

  it('throws when useAuth is used outside the provider', () => {
    expect(() => render(<OutsideConsumer />)).toThrow('useAuth must be used within an AuthProvider');
  });
});
