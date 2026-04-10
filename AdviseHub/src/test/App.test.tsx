import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.fn();
const docMock = vi.fn();
const getDocMock = vi.fn();
const updateDocMock = vi.fn();

vi.mock('../providers/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => useAuthMock(),
}));

vi.mock('../components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">toaster</div>,
}));

vi.mock('../components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/layout/MainLayout', async () => {
  const router = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    MainLayout: () => (
      <div data-testid="layout">
        <router.Outlet />
      </div>
    ),
  };
});

vi.mock('../pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('../pages/Home', () => ({ default: () => <div>Home Page</div> }));
vi.mock('../pages/SessionLive', () => ({ default: () => <div>Session Live Page</div> }));
vi.mock('../pages/History', () => ({ default: () => <div>History Page</div> }));
vi.mock('../pages/DecisionTracker', () => ({ default: () => <div>Decision Tracker Page</div> }));
vi.mock('../pages/SharedSessions', () => ({ default: () => <div>Shared Sessions Page</div> }));
vi.mock('../pages/Settings', () => ({ default: () => <div>Settings Page</div> }));
vi.mock('../pages/CustomBoard', () => ({ default: () => <div>Custom Board Page</div> }));
vi.mock('../pages/Pricing', () => ({ default: () => <div>Pricing Page</div> }));
vi.mock('../pages/Landing', () => ({ default: () => <div>Landing Page</div> }));
vi.mock('../pages/AdvisorTemplates', () => ({ default: () => <div>Advisor Templates Page</div> }));
vi.mock('../pages/Marketplace', () => ({ default: () => <div>Marketplace Page</div> }));
vi.mock('../pages/VoiceChat', () => ({ default: () => <div>Voice Chat Page</div> }));
vi.mock('../pages/VoiceSetup', () => ({ default: () => <div>Voice Setup Page</div> }));
vi.mock('../pages/KnowledgeVault', () => ({ default: () => <div>Knowledge Vault Page</div> }));

vi.mock('../lib/firebase', () => ({
  db: { name: 'db' },
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
}));

import App from '../App';

function renderApp(path = '/') {
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ loading: false, user: null });
    docMock.mockReturnValue({ ref: 'user-ref' });
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ plan: 'pro' }),
    });
    updateDocMock.mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('shows the loading screen while auth state is loading', () => {
    useAuthMock.mockReturnValue({ loading: true, user: null });

    renderApp('/');

    expect(screen.getByText('AdviseHub')).toBeInTheDocument();
    expect(screen.getByText(/Inicjalizacja/i)).toBeInTheDocument();
  });

  it('renders landing page for unauthenticated users on the root route', () => {
    renderApp('/');

    expect(screen.getByText('Landing Page')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('renders the login page for unauthenticated users', () => {
    renderApp('/login');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders the public pricing page for unauthenticated users', () => {
    renderApp('/pricing');

    expect(screen.getByText('Pricing Page')).toBeInTheDocument();
  });

  it('redirects unknown public routes back to the landing page', async () => {
    renderApp('/missing');

    await waitFor(() => {
      expect(screen.getByText('Landing Page')).toBeInTheDocument();
    });
  });

  it('renders authenticated routes inside the main layout', async () => {
    useAuthMock.mockReturnValue({ loading: false, user: { uid: 'user-1' } });

    renderApp('/history');

    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
    expect(screen.getByText('History Page')).toBeInTheDocument();
  });

  it('redirects authenticated users away from the login page to the home page', async () => {
    useAuthMock.mockReturnValue({ loading: false, user: { uid: 'user-1' } });

    renderApp('/login');

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  it('upgrades non-pro users to the pro plan automatically', async () => {
    useAuthMock.mockReturnValue({ loading: false, user: { uid: 'user-42' } });
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ plan: 'free' }),
    });

    renderApp('/');

    await waitFor(() => {
      expect(docMock).toHaveBeenCalledWith({ name: 'db' }, 'users', 'user-42');
      expect(updateDocMock).toHaveBeenCalledWith({ ref: 'user-ref' }, { plan: 'pro' });
    });
  });

  it('does not update users who already have the pro plan', async () => {
    useAuthMock.mockReturnValue({ loading: false, user: { uid: 'user-42' } });

    renderApp('/');

    await waitFor(() => {
      expect(getDocMock).toHaveBeenCalled();
    });
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('logs upgrade errors without breaking the app', async () => {
    useAuthMock.mockReturnValue({ loading: false, user: { uid: 'user-42' } });
    const error = new Error('upgrade failed');
    getDocMock.mockRejectedValue(error);

    renderApp('/');

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('auto-upgrade'), error);
    });
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
