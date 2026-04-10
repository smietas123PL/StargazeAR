import React from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const useCustomAdvisorsMock = vi.fn();
  const collectionMock = vi.fn((...args: unknown[]) => ({ kind: 'collection', args }));
  const docMock = vi.fn((...args: unknown[]) => ({ kind: 'doc', args }));
  const queryMock = vi.fn((...args: unknown[]) => ({ kind: 'query', args }));
  const orderByMock = vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args }));
  const whereMock = vi.fn((...args: unknown[]) => ({ kind: 'where', args }));
  const onSnapshotMock = vi.fn();
  const db = { name: 'db' };

  return {
    useAuthMock,
    useCustomAdvisorsMock,
    collectionMock,
    docMock,
    queryMock,
    orderByMock,
    whereMock,
    onSnapshotMock,
    db,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../hooks/useCustomAdvisors', () => ({
  useCustomAdvisors: () => mocks.useCustomAdvisorsMock(),
}));

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mocks.collectionMock(...args),
  doc: (...args: unknown[]) => mocks.docMock(...args),
  query: (...args: unknown[]) => mocks.queryMock(...args),
  orderBy: (...args: unknown[]) => mocks.orderByMock(...args),
  where: (...args: unknown[]) => mocks.whereMock(...args),
  onSnapshot: (...args: unknown[]) => mocks.onSnapshotMock(...args),
}));

import { AdvisorCard } from '../components/features/AdvisorCard';
import * as featureBarrel from '../components/features/index';
import * as layoutBarrel from '../components/layout/index';
import * as uiBarrel from '../components/ui/index';
import * as hooksBarrel from '../hooks/index';
import { useSession } from '../hooks/useSession';
import { useSharedSessions } from '../hooks/useSharedSessions';
import { useUserSessions } from '../hooks/useUserSessions';
import * as servicesBarrel from '../services/index';

const makeAdvisor = (color: string, overrides: Record<string, unknown> = {}) => ({
  id: 'advisor-1',
  namePl: 'Doradca',
  nameEn: 'Advisor',
  role: 'contrarian',
  description: 'Opis',
  systemPrompt: 'Prompt',
  icon: 'gavel',
  color,
  bgClass: 'bg-red-500/10',
  borderClass: 'border-red-500/20',
  textClass: 'text-red-500',
  isCustom: false,
  ...overrides,
});

describe('AdvisorCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.useCustomAdvisorsMock.mockReturnValue({ allAdvisors: [makeAdvisor('bg-red-500')] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when the advisor role is missing', () => {
    mocks.useCustomAdvisorsMock.mockReturnValue({ allAdvisors: [] });
    const { container } = render(<AdvisorCard role="chairman" content="Brak doradcy" />);

    expect(container.firstChild).toBeNull();
  });

  it.each([
    ['bg-red-500', '#ef4444'],
    ['bg-blue-500', '#3b82f6'],
    ['bg-purple-500', '#a855f7'],
    ['bg-emerald-500', '#10b981'],
    ['bg-amber-500', '#f59e0b'],
    ['bg-cyan-500', '#06b6d4'],
    ['bg-pink-500', '#ec4899'],
    ['bg-primary', '#00fc9b'],
  ])('maps %s to %s for the icon fallback', (color, hex) => {
    mocks.useCustomAdvisorsMock.mockReturnValue({ allAdvisors: [makeAdvisor(color)] });

    render(<AdvisorCard role="contrarian" content="Wiadomosc" />);

    expect(screen.getByText('Wiadomosc')).toBeInTheDocument();
    expect(screen.getByText('gavel')).toHaveStyle({ color: hex });
  });

  it('renders the avatar image when advisor has avatarUrl', () => {
    mocks.useCustomAdvisorsMock.mockReturnValue({
      allAdvisors: [makeAdvisor('bg-red-500', { avatarUrl: 'https://example.com/avatar.png' })],
    });

    render(<AdvisorCard role="contrarian" content="Z avatar" />);

    expect(screen.getByRole('img', { name: 'Doradca' })).toHaveAttribute('src', 'https://example.com/avatar.png');
    expect(screen.queryByText('gavel')).not.toBeInTheDocument();
  });

  it('shows loading placeholders for new content and reveals markdown after the delay', async () => {
    vi.useFakeTimers();

    const { container } = render(<AdvisorCard role="contrarian" content="Nowa odpowiedz" isNew />);

    expect(screen.queryByText('Nowa odpowiedz')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('Nowa odpowiedz')).toBeInTheDocument();
  });
});

describe('realtime hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
  });

  it('handles missing session id and missing user before subscribing in useSession', () => {
    const missingId = renderHook(() => useSession(undefined));
    expect(missingId.result.current.loading).toBe(false);
    expect(missingId.result.current.error).toContain('Brak ID');
    expect(mocks.onSnapshotMock).not.toHaveBeenCalled();

    mocks.useAuthMock.mockReturnValue({ user: null });
    const missingUser = renderHook(() => useSession('session-1'));
    expect(missingUser.result.current.loading).toBe(true);
    expect(missingUser.result.current.error).toBeNull();
    expect(mocks.onSnapshotMock).not.toHaveBeenCalled();
  });

  it('subscribes to the session and ordered messages in useSession', async () => {
    const unsubSession = vi.fn();
    const unsubMessages = vi.fn();

    mocks.onSnapshotMock
      .mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
        onNext({
          exists: () => true,
          data: () => ({ id: 'session-1', title: 'Sesja', userId: 'user-1', question: 'Pytanie', status: 'completed', createdAt: 1, fileUrls: [] }),
        });
        return unsubSession;
      })
      .mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
        onNext({
          docs: [
            {
              id: 'msg-1',
              data: () => ({ sessionId: 'session-1', userId: 'user-1', role: 'user', content: 'Hello', order: 1, timestamp: 1 }),
            },
          ],
        });
        return unsubMessages;
      });

    const { result, unmount } = renderHook(() => useSession('session-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toMatchObject({ title: 'Sesja' });
    expect(result.current.messages).toEqual([
      expect.objectContaining({ id: 'msg-1', content: 'Hello', order: 1 }),
    ]);
    expect(result.current.error).toBeNull();

    unmount();
    expect(unsubSession).toHaveBeenCalledTimes(1);
    expect(unsubMessages).toHaveBeenCalledTimes(1);
  });

  it('reports missing sessions and session snapshot errors in useSession', async () => {
    mocks.onSnapshotMock
      .mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
        onNext({ exists: () => false, data: () => null });
        return vi.fn();
      })
      .mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
        onNext({ docs: [] });
        return vi.fn();
      });

    const missingSession = renderHook(() => useSession('session-404'));

    await waitFor(() => {
      expect(missingSession.result.current.loading).toBe(false);
    });
    expect(missingSession.result.current.error).toContain('Sesja');

    mocks.onSnapshotMock.mockReset();
    mocks.onSnapshotMock
      .mockImplementationOnce((_ref, _onNext: (value: unknown) => void, onError: (error: unknown) => void) => {
        onError(new Error('session failed'));
        return vi.fn();
      })
      .mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
        onNext({ docs: [] });
        return vi.fn();
      });

    const sessionError = renderHook(() => useSession('session-error'));

    await waitFor(() => {
      expect(sessionError.result.current.loading).toBe(false);
    });
    expect(console.error).toHaveBeenCalled();
    expect(sessionError.result.current.error).toContain('sesji');
  });

  it('reports message snapshot errors in useSession', async () => {
    mocks.onSnapshotMock
      .mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
        onNext({ exists: () => true, data: () => ({ id: 'session-1', userId: 'user-1', question: 'Q', status: 'completed', createdAt: 1, fileUrls: [] }) });
        return vi.fn();
      })
      .mockImplementationOnce((_ref, _onNext: (value: unknown) => void, onError: (error: unknown) => void) => {
        onError(new Error('messages failed'));
        return vi.fn();
      });

    const { result } = renderHook(() => useSession('session-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(console.error).toHaveBeenCalled();
    expect(result.current.error).toContain('wiadomo');
  });

  it('returns early for anonymous users in useUserSessions', () => {
    mocks.useAuthMock.mockReturnValue({ user: null });

    const { result } = renderHook(() => useUserSessions());

    expect(result.current.sessions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mocks.onSnapshotMock).not.toHaveBeenCalled();
  });

  it('loads sessions and cleans up subscriptions in useUserSessions', async () => {
    const unsubscribe = vi.fn();
    mocks.onSnapshotMock.mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
      onNext({
        forEach: (callback: (doc: { id: string; data: () => unknown }) => void) => {
          [
            { id: 's1', data: () => ({ title: 'Pierwsza', userId: 'user-1', question: 'Q1', status: 'completed', createdAt: 2, fileUrls: [] }) },
            { id: 's2', data: () => ({ title: 'Druga', userId: 'user-1', question: 'Q2', status: 'draft', createdAt: 1, fileUrls: [] }) },
          ].forEach(callback);
        },
      });
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => useUserSessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.sessions[0]).toMatchObject({ id: 's1', title: 'Pierwsza' });
    expect(result.current.error).toBeNull();

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('stores errors from useUserSessions subscription failures', async () => {
    mocks.onSnapshotMock.mockImplementationOnce((_ref, _onNext: (value: unknown) => void, onError: (error: unknown) => void) => {
      onError(new Error('snapshot failed'));
      return vi.fn();
    });

    const { result } = renderHook(() => useUserSessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(console.error).toHaveBeenCalled();
    expect(result.current.error).toContain('historii');
  });

  it('returns empty shared-session state for anonymous users', () => {
    mocks.useAuthMock.mockReturnValue({ user: null });

    const { result } = renderHook(() => useSharedSessions());

    expect(result.current.ownedSessions).toEqual([]);
    expect(result.current.guestSessions).toEqual([]);
    expect(result.current.invitations).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mocks.onSnapshotMock).not.toHaveBeenCalled();
  });

  it('sorts and splits owned, guest and invited sessions in useSharedSessions', async () => {
    const unsubSessions = vi.fn();
    const unsubInvitations = vi.fn();

    mocks.onSnapshotMock
      .mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
        onNext({
          docs: [
            { id: 'owned-older', data: () => ({ userId: 'user-1', participants: ['user-1', 'user-2'], createdAt: 3, title: 'Owned older', question: 'Q', status: 'completed', fileUrls: [] }) },
            { id: 'guest-newer', data: () => ({ userId: 'other', participants: ['other', 'user-1'], createdAt: 9, title: 'Guest newer', question: 'Q', status: 'completed', fileUrls: [] }) },
            { id: 'owned-newer', data: () => ({ userId: 'user-1', participants: ['user-1', 'user-3'], createdAt: 12, title: 'Owned newer', question: 'Q', status: 'completed', fileUrls: [] }) },
            { id: 'owned-private', data: () => ({ userId: 'user-1', participants: ['user-1'], createdAt: 20, title: 'Owned private', question: 'Q', status: 'draft', fileUrls: [] }) },
            { id: 'guest-older', data: () => ({ userId: 'other-2', participants: ['other-2', 'user-1'], createdAt: 5, title: 'Guest older', question: 'Q', status: 'completed', fileUrls: [] }) },
          ],
        });
        return unsubSessions;
      })
      .mockImplementationOnce((_ref, onNext: (value: unknown) => void) => {
        onNext({
          docs: [
            { id: 'inv-older', data: () => ({ invitedEmail: 'ada@example.com', status: 'pending', createdAt: 2, sessionId: 's1', invitedBy: 'owner@example.com' }) },
            { id: 'inv-newer', data: () => ({ invitedEmail: 'ada@example.com', status: 'pending', createdAt: 11, sessionId: 's2', invitedBy: 'owner@example.com' }) },
          ],
        });
        return unsubInvitations;
      });

    const { result, unmount } = renderHook(() => useSharedSessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ownedSessions.map((session) => session.id)).toEqual(['owned-newer', 'owned-older']);
    expect(result.current.guestSessions.map((session) => session.id)).toEqual(['guest-newer', 'guest-older']);
    expect(result.current.invitations.map((invitation) => invitation.id)).toEqual(['inv-newer', 'inv-older']);

    unmount();
    expect(unsubSessions).toHaveBeenCalledTimes(1);
    expect(unsubInvitations).toHaveBeenCalledTimes(1);
  });
});

describe('barrel files', () => {
  it('keep the placeholder barrels empty', () => {
    expect(Object.keys(featureBarrel)).toHaveLength(0);
    expect(Object.keys(layoutBarrel)).toHaveLength(0);
    expect(Object.keys(uiBarrel)).toHaveLength(0);
    expect(Object.keys(hooksBarrel)).toHaveLength(0);
    expect(Object.keys(servicesBarrel)).toHaveLength(0);
  });
});
