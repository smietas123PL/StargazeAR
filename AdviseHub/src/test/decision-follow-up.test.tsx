import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const navigateMock = vi.fn();
  const collectionMock = vi.fn((...args: unknown[]) => ({ kind: 'collection', args }));
  const addDocMock = vi.fn();
  const docMock = vi.fn((...args: unknown[]) => ({ id: String(args[2]) }));
  const getDocMock = vi.fn();
  const updateDocMock = vi.fn();
  const toastSuccess = vi.fn();
  const toastError = vi.fn();
  const db = { name: 'db' };

  return {
    useAuthMock,
    navigateMock,
    collectionMock,
    addDocMock,
    docMock,
    getDocMock,
    updateDocMock,
    toastSuccess,
    toastError,
    db,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigateMock,
  };
});

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mocks.collectionMock(...args),
  addDoc: (...args: unknown[]) => mocks.addDocMock(...args),
  doc: (...args: unknown[]) => mocks.docMock(...args),
  getDoc: (...args: unknown[]) => mocks.getDocMock(...args),
  updateDoc: (...args: unknown[]) => mocks.updateDocMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

import { useDecisionFollowUp } from '../hooks/useDecisionFollowUp';

const recentDecision = {
  id: 'decision-1',
  sessionId: 'session-1',
  sessionTitle: 'Sesja 1',
  title: 'Wejść w nowy kanał',
  description: 'Opis decyzji',
  expectedOutcome: 'Więcej leadów',
  status: 'planned' as const,
  decidedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
};

describe('useDecisionFollowUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.addDocMock.mockReset();
    mocks.addDocMock
      .mockResolvedValueOnce({ id: 'follow-up-1' })
      .mockResolvedValueOnce({ id: 'message-1' });
    mocks.getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        decisions: [
          { id: 'decision-1', title: 'Wejść w nowy kanał', reviewed: false },
          { id: 'decision-2', title: 'Inna decyzja', reviewed: false },
        ],
      }),
    });
    mocks.updateDocMock.mockResolvedValue(undefined);
  });

  it('returns null immediately when the user is missing', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    const { result } = renderHook(() => useDecisionFollowUp());

    let createdId: string | null = 'initial';
    await act(async () => {
      createdId = await result.current.createFollowUp(recentDecision as never);
    });

    expect(createdId).toBeNull();
    expect(mocks.addDocMock).not.toHaveBeenCalled();
    expect(result.current.isCreating).toBe(false);
  });

  it('creates a recent follow-up, updates the source decision and navigates to the new session', async () => {
    const { result } = renderHook(() => useDecisionFollowUp());

    let createdId: string | null = null;
    await act(async () => {
      createdId = await result.current.createFollowUp(recentDecision as never);
    });

    expect(createdId).toBe('follow-up-1');
    expect(mocks.addDocMock).toHaveBeenNthCalledWith(
      1,
      { kind: 'collection', args: [mocks.db, 'sessions'] },
      expect.objectContaining({
        userId: 'user-1',
        title: 'Follow-up: Wejść w nowy kanał',
        question: expect.stringContaining('sprzed 2 dni'),
        selectedAdvisors: [],
        participants: ['user-1'],
      }),
    );
    expect(mocks.addDocMock.mock.calls[0][1].question).toContain('Brak danych');
    expect(mocks.addDocMock).toHaveBeenNthCalledWith(
      2,
      { kind: 'collection', args: [mocks.db, 'messages'] },
      expect.objectContaining({
        sessionId: 'follow-up-1',
        role: 'user',
        order: 0,
      }),
    );
    expect(mocks.updateDocMock).toHaveBeenCalledWith(
      { id: 'session-1' },
      {
        decisions: [
          expect.objectContaining({ id: 'decision-1', reviewed: true, reviewedAt: expect.any(Number) }),
          expect.objectContaining({ id: 'decision-2', reviewed: false }),
        ],
      },
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Utworzono sesję follow-up');
    expect(mocks.navigateMock).toHaveBeenCalledWith('/session/follow-up-1');
    expect(result.current.isCreating).toBe(false);
  });

  it('supports older decisions with actual outcome and skips updates when the source session does not exist', async () => {
    mocks.addDocMock.mockReset();
    mocks.addDocMock
      .mockResolvedValueOnce({ id: 'follow-up-2' })
      .mockResolvedValueOnce({ id: 'message-2' });
    mocks.getDocMock.mockResolvedValue({
      exists: () => false,
    });

    const olderDecision = {
      ...recentDecision,
      id: 'decision-3',
      title: 'Zamknąć kanał',
      actualOutcome: 'CAC wzrósł',
      decidedAt: Date.now() - 16 * 24 * 60 * 60 * 1000,
    };

    const { result } = renderHook(() => useDecisionFollowUp());

    await act(async () => {
      await result.current.createFollowUp(olderDecision as never);
    });

    expect(mocks.addDocMock.mock.calls[0][1].question).toContain('sprzed 2 tygodni');
    expect(mocks.addDocMock.mock.calls[0][1].question).toContain('CAC wzrósł');
    expect(mocks.updateDocMock).not.toHaveBeenCalled();
    expect(mocks.navigateMock).toHaveBeenCalledWith('/session/follow-up-2');
    expect(result.current.isCreating).toBe(false);
  });

  it('handles existing source sessions without a decisions array', async () => {
    mocks.addDocMock.mockReset();
    mocks.addDocMock
      .mockResolvedValueOnce({ id: 'follow-up-3' })
      .mockResolvedValueOnce({ id: 'message-3' });
    mocks.getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    });

    const { result } = renderHook(() => useDecisionFollowUp());

    await act(async () => {
      await result.current.createFollowUp(recentDecision as never);
    });

    expect(mocks.updateDocMock).toHaveBeenCalledWith(
      { id: 'session-1' },
      { decisions: [] },
    );
    expect(mocks.navigateMock).toHaveBeenCalledWith('/session/follow-up-3');
    expect(result.current.isCreating).toBe(false);
  });
  it('returns null and shows an error toast when follow-up creation fails', async () => {
    mocks.addDocMock.mockReset();
    mocks.addDocMock.mockRejectedValueOnce(new Error('cannot create follow-up'));
    const { result } = renderHook(() => useDecisionFollowUp());

    let createdId: string | null = 'initial';
    await act(async () => {
      createdId = await result.current.createFollowUp(recentDecision as never);
    });

    expect(createdId).toBeNull();
    expect(console.error).toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('Nie udało się utworzyć sesji follow-up');
    expect(result.current.isCreating).toBe(false);
  });
});



