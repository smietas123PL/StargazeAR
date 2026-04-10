import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const useDocumentRAGMock = vi.fn();
  const collectionMock = vi.fn((...args: unknown[]) => ({ kind: 'collection', args }));
  const docMock = vi.fn();
  const setDocMock = vi.fn();
  const updateDocMock = vi.fn();
  const httpsCallableMock = vi.fn();
  const toastError = vi.fn();
  const db = { name: 'db' };
  const functions = { name: 'functions' };

  return {
    useAuthMock,
    useDocumentRAGMock,
    collectionMock,
    docMock,
    setDocMock,
    updateDocMock,
    httpsCallableMock,
    toastError,
    db,
    functions,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../hooks/useDocumentRAG', () => ({
  useDocumentRAG: () => mocks.useDocumentRAGMock(),
}));

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
  functions: mocks.functions,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mocks.collectionMock(...args),
  doc: (...args: unknown[]) => mocks.docMock(...args),
  setDoc: (...args: unknown[]) => mocks.setDocMock(...args),
  updateDoc: (...args: unknown[]) => mocks.updateDocMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => mocks.httpsCallableMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

import { useRunChairman } from '../hooks/useRunChairman';

const chairmanMessages = [
  {
    id: 'user-1',
    sessionId: 'session-1',
    userId: 'user-1',
    role: 'user',
    content: 'Jak rozwijać firmę?',
    order: 0,
    timestamp: 1,
  },
  {
    id: 'advisor-1',
    sessionId: 'session-1',
    userId: 'user-1',
    role: 'contrarian',
    content: 'Rynek jest trudny, ale jest luka.',
    order: 1,
    timestamp: 2,
  },
  {
    id: 'advisor-2',
    sessionId: 'session-1',
    userId: 'user-1',
    role: 'executor',
    content: 'Najpierw trzeba przetestować kanał sprzedaży.',
    order: 2,
    timestamp: 3,
  },
  {
    id: 'peer-review',
    sessionId: 'session-1',
    userId: 'user-1',
    role: 'peer_review',
    content: 'Peer review wskazuje na ryzyko kosztowe.',
    order: 6,
    timestamp: 4,
  },
] as const;

describe('useRunChairman', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.useDocumentRAGMock.mockReturnValue({
      getRelevantVaultChunks: vi.fn().mockResolvedValue([]),
    });
    let messageCounter = 0;
    let resultCounter = 0;
    mocks.docMock.mockImplementation((...args: unknown[]) => {
      const firstArg = args[0] as { kind?: string; args?: unknown[] } | undefined;
      if (firstArg?.kind === 'collection') {
        const collectionPath = String(firstArg.args?.[1] ?? '')
        if (collectionPath.includes('/messages')) {
          messageCounter += 1;
          return { id: `chairman-message-${messageCounter}` };
        }
        resultCounter += 1;
        return { id: `council-result-${resultCounter}` };
      }
      return { id: String(args[2]) };
    });
    mocks.setDocMock.mockResolvedValue(undefined);
    mocks.updateDocMock.mockResolvedValue(undefined);
  });

  it('returns early when the user is missing', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    const { result } = renderHook(() => useRunChairman('session-1'));

    await act(async () => {
      await result.current.runChairman(chairmanMessages as never, 'Jak rozwijać firmę?');
    });

    expect(mocks.httpsCallableMock).not.toHaveBeenCalled();
    expect(mocks.setDocMock).not.toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
  });

  it('retries the verdict, saves results and extracts decisions on success', async () => {
    const getRelevantVaultChunks = vi.fn().mockResolvedValue([
      { documentName: 'Vault Alpha', text: 'Fakt 1' },
      { documentName: 'Vault Alpha', text: 'Fakt 2' },
      { documentName: 'Vault Beta', text: 'Fakt 3' },
    ]);
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantVaultChunks });

    const callable = vi.fn(async (payload: { temperature?: number; responseMimeType?: string; prompt: string }) => {
      if (payload.responseMimeType === 'application/json') {
        return {
          data: {
            text: JSON.stringify([
              {
                title: 'Uruchomić eksperyment',
                description: 'Sprawdzić nowy kanał pozyskania klientów',
                expectedOutcome: 'Więcej rozmów sprzedażowych',
              },
            ]),
          },
        };
      }

      if (payload.temperature === 0.5) {
        return { data: { text: 'za krótko' } };
      }

      return { data: { text: 'A'.repeat(220) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunChairman('session-1'));

    await act(async () => {
      await result.current.runChairman(
        chairmanMessages as never,
        'Jak rozwijać firmę?',
        'Dodatkowy kontekst strategiczny',
      );
    });

    expect(getRelevantVaultChunks).toHaveBeenCalledWith('user-1', 'Jak rozwijać firmę?', 3);
    expect(mocks.httpsCallableMock).toHaveBeenCalledWith(mocks.functions, 'generateAdvisorResponse');
    expect(callable).toHaveBeenCalledTimes(3);
    expect(callable.mock.calls[1][0].prompt).toContain('Vault Alpha');
    expect(callable.mock.calls[1][0].prompt).toContain('Peer review wskazuje');
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      1,
      { id: 'chairman-message-1' },
      expect.objectContaining({
        role: 'chairman',
        content: 'A'.repeat(220),
        order: 7,
      }),
    );
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      2,
      { id: 'council-result-1' },
      expect.objectContaining({
        sessionId: 'session-1',
        peerReview: 'Peer review wskazuje na ryzyko kosztowe.',
        advisors: {
          contrarian: 'Rynek jest trudny, ale jest luka.',
          executor: 'Najpierw trzeba przetestować kanał sprzedaży.',
        },
      }),
    );
    expect(mocks.updateDocMock).toHaveBeenCalledWith(
      { id: 'session-1' },
      {
        status: 'completed',
        decisions: [
          expect.objectContaining({
            id: '11111111-1111-4111-8111-111111111111',
            title: 'Uruchomić eksperyment',
            status: 'planned',
          }),
        ],
      },
    );
    expect(result.current.error).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it('marks the session as failed when both chairman attempts are invalid', async () => {
    const callable = vi.fn()
      .mockResolvedValueOnce({ data: { text: "I'm sorry, but I cannot help with that." } })
      .mockResolvedValueOnce({ data: {} });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunChairman('session-1'));

    await act(async () => {
      await result.current.runChairman(chairmanMessages as never, 'Jak rozwijać firmę?');
    });

    expect(callable).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalled();
    expect(mocks.updateDocMock).toHaveBeenCalledWith({ id: 'session-1' }, { status: 'failed' });
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.setDocMock).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it('continues with empty decisions when extraction parsing fails', async () => {
    const callable = vi.fn(async (payload: { responseMimeType?: string }) => {
      if (payload.responseMimeType === 'application/json') {
        return { data: { text: 'not-json' } };
      }

      return { data: { text: 'B'.repeat(180) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const messagesWithoutPeerReview = chairmanMessages.filter((message) => message.role !== 'peer_review');
    const { result } = renderHook(() => useRunChairman('session-2'));

    await act(async () => {
      await result.current.runChairman(messagesWithoutPeerReview as never, 'Pytanie bez kontekstu');
    });

    expect(console.error).toHaveBeenCalled();
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      2,
      { id: 'council-result-1' },
      expect.objectContaining({
        peerReview: '',
      }),
    );
    expect(mocks.updateDocMock).toHaveBeenCalledWith(
      { id: 'session-2' },
      { status: 'completed', decisions: [] },
    );
    expect(result.current.isRunning).toBe(false);
  });

  it('retries when the first verdict contains a failed pattern', async () => {
    const callable = vi.fn(async (payload: { temperature?: number }) => {
      if (payload.temperature === 0.5) {
        return { data: { text: "I cannot " + 'A'.repeat(140) } };
      }

      return { data: { text: 'C'.repeat(180) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunChairman('session-pattern'));

    await act(async () => {
      await result.current.runChairman(chairmanMessages as never, 'Pytanie');
    });

    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.6 }));
    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'chairman-message-1' },
      expect.objectContaining({ content: 'C'.repeat(180) }),
    );
    expect(result.current.isRunning).toBe(false);
  });

  it('retries when the first verdict is too long', async () => {
    const callable = vi.fn(async (payload: { temperature?: number }) => {
      if (payload.temperature === 0.5) {
        return { data: { text: '9'.repeat(16001) } };
      }

      return { data: { text: 'D'.repeat(180) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunChairman('session-long'));

    await act(async () => {
      await result.current.runChairman(chairmanMessages as never, 'Pytanie');
    });

    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.6 }));
    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'chairman-message-1' },
      expect.objectContaining({ content: 'D'.repeat(180) }),
    );
    expect(result.current.isRunning).toBe(false);
  });

  it('retries when the first verdict has no letters', async () => {
    const callable = vi.fn(async (payload: { temperature?: number }) => {
      if (payload.temperature === 0.5) {
        return { data: { text: '9'.repeat(140) } };
      }

      return { data: { text: 'E'.repeat(180) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunChairman('session-digits'));

    await act(async () => {
      await result.current.runChairman(chairmanMessages as never, 'Pytanie');
    });

    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.6 }));
    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'chairman-message-1' },
      expect.objectContaining({ content: 'E'.repeat(180) }),
    );
    expect(result.current.isRunning).toBe(false);
  });

  it('retries when the initial verdict is empty and falls back to empty extracted decisions', async () => {
    const callable = vi.fn(async (payload: { temperature?: number; responseMimeType?: string }) => {
      if (payload.responseMimeType === 'application/json') {
        return { data: {} };
      }

      if (payload.temperature === 0.5) {
        return { data: {} };
      }

      return { data: { text: 'F'.repeat(180) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunChairman('session-empty'));

    await act(async () => {
      await result.current.runChairman(chairmanMessages as never, 'Pytanie');
    });

    expect(callable).toHaveBeenCalledTimes(3);
    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'chairman-message-1' },
      expect.objectContaining({ content: 'F'.repeat(180) }),
    );
    expect(mocks.updateDocMock).toHaveBeenCalledWith(
      { id: 'session-empty' },
      { status: 'completed', decisions: [] },
    );
    expect(result.current.isRunning).toBe(false);
  });
  it('treats resource exhausted errors as a rate limit', async () => {
    const callable = vi.fn().mockRejectedValue({ code: 'functions/resource-exhausted' });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunChairman('session-code-rate'));

    await act(async () => {
      await result.current.runChairman(chairmanMessages as never, 'Pytanie');
    });

    expect(mocks.toastError).toHaveBeenCalled();
    expect(result.current.error).toContain('limit zapyta');
    expect(result.current.isRunning).toBe(false);
  });
  it('surfaces rate limit and fallback synthesis errors', async () => {
    const rateLimitCallable = vi.fn().mockRejectedValue({ message: 'Rate limit exceeded' });
    mocks.httpsCallableMock.mockReturnValue(rateLimitCallable);

    const rateLimited = renderHook(() => useRunChairman('session-1'));
    await act(async () => {
      await rateLimited.result.current.runChairman(chairmanMessages as never, 'Pytanie');
    });

    expect(mocks.toastError).toHaveBeenCalled();
    expect(rateLimited.result.current.error).toContain('limit zapyta');
    expect(rateLimited.result.current.isRunning).toBe(false);

    const genericCallable = vi.fn().mockRejectedValue({});
    mocks.httpsCallableMock.mockReturnValue(genericCallable);

    const genericFailure = renderHook(() => useRunChairman('session-1'));
    await act(async () => {
      await genericFailure.result.current.runChairman(chairmanMessages as never, 'Pytanie');
    });

    expect(console.error).toHaveBeenCalled();
    expect(genericFailure.result.current.error).toContain('syntezy');
    expect(genericFailure.result.current.isRunning).toBe(false);
  });
});







