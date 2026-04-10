import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  logoutMock: vi.fn(),
  onCloseMock: vi.fn(),
}));

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

import { Sidebar } from '../components/layout/Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthMock.mockReturnValue({
      logout: mocks.logoutMock,
      profile: {
        displayName: 'Ada',
        email: 'ada@example.com',
        plan: 'premium',
      },
    });
  });

  it('renders open sidebar state, active links and handles backdrop, navigation and logout', () => {
    render(
      <MemoryRouter initialEntries={['/history']}>
        <Sidebar isOpen onClose={mocks.onCloseMock} />
      </MemoryRouter>,
    );

    expect(screen.getByText('AdviseHub')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Plan Pro')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Historia Sesji/i }).className).toContain('text-primary');
    expect(screen.getByRole('link', { name: /Moja Rada/i }).className).toContain('text-zinc-400');

    const backdrop = document.querySelector('[class*="bg-black/60"]');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop as Element);

    fireEvent.click(screen.getByRole('link', { name: /Nowa Sesja/i }));
    fireEvent.click(screen.getByRole('link', { name: /Ustawienia/i }));
    fireEvent.click(screen.getByTitle('Wyloguj'));

    expect(mocks.onCloseMock).toHaveBeenCalledTimes(3);
    expect(mocks.logoutMock).toHaveBeenCalledTimes(1);
  });

  it('renders closed sidebar state without backdrop', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar isOpen={false} onClose={mocks.onCloseMock} />
      </MemoryRouter>,
    );

    expect(document.querySelector('[class*="bg-black/60"]')).not.toBeInTheDocument();
    expect(container.querySelector('aside')?.className).toContain('-translate-x-full');
  });

  it('falls back to email and free plan label when display name is missing', () => {
    mocks.useAuthMock.mockReturnValue({
      logout: mocks.logoutMock,
      profile: {
        displayName: '',
        email: 'fallback@example.com',
        plan: 'free',
      },
    });

    render(
      <MemoryRouter>
        <Sidebar isOpen onClose={mocks.onCloseMock} />
      </MemoryRouter>,
    );

    expect(screen.getByText('fallback@example.com')).toBeInTheDocument();
    expect(screen.getByText('Plan Free')).toBeInTheDocument();
  });

  it('falls back to default user label when profile has no name or email', () => {
    mocks.useAuthMock.mockReturnValue({
      logout: mocks.logoutMock,
      profile: {
        displayName: '',
        email: '',
        plan: 'pro',
      },
    });

    render(
      <MemoryRouter>
        <Sidebar isOpen onClose={mocks.onCloseMock} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Użytkownik')).toBeInTheDocument();
    expect(screen.getByText('Plan Pro')).toBeInTheDocument();
  });
});
