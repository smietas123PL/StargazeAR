import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const useCustomAdvisorsMock = vi.fn();
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
    useCustomAdvisorsMock,
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

vi.mock('../hooks/useCustomAdvisors', () => ({
  useCustomAdvisors: () => mocks.useCustomAdvisorsMock(),
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

import { useRunCouncil } from '../hooks/useRunCouncil';
import { useRunPeerReview } from '../hooks/useRunPeerReview';

const advisors = [
  {
    id: 'contrarian',
    namePl: 'Kontrarianin',
    role: 'contrarian',
    systemPrompt: 'Prompt contrarian',
  },
  {
    id: 'outsider',
    namePl: 'Outsider',
    role: 'outsider',
    systemPrompt: 'Prompt outsider',
  },
  {
    id: 'executor',
    namePl: 'Egzekutor',
    role: 'executor',
    systemPrompt: 'Prompt executor',
  },
];

const sessionBase = {
  id: 'session-1',
  userId: 'user-1',
  title: 'Sesja',
  question: 'Jak rozwijać produkt?',
  status: 'running',
  createdAt: 1,
  fileUrls: [],
};

const peerMessages = [
  { id: 'user-msg', sessionId: 'session-1', userId: 'user-1', role: 'user', content: 'Pytanie usera', order: 0, timestamp: 1 },
  { id: 'advisor-1', sessionId: 'session-1', userId: 'user-1', role: 'contrarian', content: 'Analiza A', order: 1, timestamp: 2 },
  { id: 'advisor-2', sessionId: 'session-1', userId: 'user-1', role: 'executor', content: 'Analiza B', order: 2, timestamp: 3 },
] as const;

describe('useRunCouncil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.useCustomAdvisorsMock.mockReturnValue({ allAdvisors: advisors });
    mocks.useDocumentRAGMock.mockReturnValue({
      getRelevantChunks: vi.fn(),
      getRelevantVaultChunks: vi.fn(),
    });
    let docCounter = 0;
    mocks.docMock.mockImplementation((...args: unknown[]) => {
      const firstArg = args[0] as { kind?: string } | undefined;
      if (firstArg?.kind === 'collection') {
        docCounter += 1;
        return { id: `message-${docCounter}` };
      }
      return { id: String(args[2]) };
    });
    mocks.setDocMock.mockResolvedValue(undefined);
    mocks.updateDocMock.mockResolvedValue(undefined);
  });

  it('returns early when user or session is missing', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    const noUser = renderHook(() => useRunCouncil(sessionBase as never));

    await act(async () => {
      await noUser.result.current.runCouncil('Pytanie', 'Kontekst');
    });

    expect(mocks.setDocMock).not.toHaveBeenCalled();

    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1' } });
    const noSession = renderHook(() => useRunCouncil(null));

    await act(async () => {
      await noSession.result.current.runCouncil('Pytanie', 'Kontekst');
    });

    expect(mocks.setDocMock).not.toHaveBeenCalled();
    expect(noSession.result.current.isRunning).toBe(false);
  });

  it('runs selected advisors with RAG context, search fallback and retry validation', async () => {
    const getRelevantChunks = vi.fn()
      .mockResolvedValueOnce({ chunks: ['Sesyjny fragment'], needsSearch: true })
      .mockResolvedValueOnce({ chunks: [], needsSearch: false });
    const getRelevantVaultChunks = vi.fn().mockResolvedValue([
      { documentName: 'Vault One', text: 'Vault A' },
      { documentName: 'Vault One', text: 'Vault B' },
    ]);
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantChunks, getRelevantVaultChunks });

    const callable = vi.fn(async (payload: { systemInstruction: string; temperature: number }) => {
      if (payload.systemInstruction.includes('Prompt contrarian') && payload.temperature === 0.7) {
        return { data: { text: 'za krótko' } };
      }
      if (payload.systemInstruction.includes('Prompt contrarian') && payload.temperature === 0.8) {
        return { data: { text: 'A'.repeat(120) } };
      }
      return { data: { text: 'B'.repeat(120) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const session = {
      ...sessionBase,
      attachedFiles: [
        { name: 'brief.txt', url: 'https://example.com/brief.txt' },
        { name: 'empty.txt', url: 'https://example.com/empty.txt' },
      ],
      selectedAdvisors: ['contrarian', 'executor'],
    };

    const { result } = renderHook(() => useRunCouncil(session as never));

    await act(async () => {
      await result.current.runCouncil('Jak rozwijać produkt?', 'Dodatkowy kontekst');
    });

    expect(getRelevantChunks).toHaveBeenNthCalledWith(1, 'user-1', 'brief.txt', 'Jak rozwijać produkt?');
    expect(getRelevantChunks).toHaveBeenNthCalledWith(2, 'user-1', 'empty.txt', 'Jak rozwijać produkt?');
    expect(getRelevantVaultChunks).toHaveBeenCalledWith('user-1', 'Jak rozwijać produkt?', 5);
    expect(mocks.httpsCallableMock).toHaveBeenCalledWith(mocks.functions, 'generateAdvisorResponse');
    expect(callable).toHaveBeenCalledTimes(3);
    expect(callable).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        enableSearch: true,
        temperature: 0.7,
        systemInstruction: expect.stringContaining('wyszukiwania internetu'),
        context: expect.stringContaining('Vault One'),
      }),
    );
    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.8, systemInstruction: expect.stringContaining('Prompt contrarian') }));
    expect(callable).toHaveBeenCalledWith(
      expect.objectContaining({
        enableSearch: false,
        systemInstruction: 'Prompt executor',
      }),
    );
    expect(
      mocks.setDocMock.mock.calls.some(([, payload]) => payload.role === 'contrarian' && payload.order === 1 && payload.content === 'A'.repeat(120)),
    ).toBe(true);
    expect(
      mocks.setDocMock.mock.calls.some(([, payload]) => payload.role === 'executor' && payload.order === 2 && payload.content === 'B'.repeat(120)),
    ).toBe(true);
    expect(mocks.updateDocMock).toHaveBeenCalledWith({ id: 'session-1' }, { status: 'advisors_completed' });
    expect(result.current.progress.completed).toBe(2);
    expect(result.current.progress.total).toBe(2);
    expect(result.current.error).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it('falls back to all advisors, session document text and warning content when retries fail validation', async () => {
    const getRelevantChunks = vi.fn();
    const getRelevantVaultChunks = vi.fn().mockResolvedValue([]);
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantChunks, getRelevantVaultChunks });

    const callable = vi.fn()
      .mockResolvedValueOnce({ data: { text: "I'm sorry" } })
      .mockResolvedValueOnce({ data: { text: 'C'.repeat(120) } })
      .mockResolvedValueOnce({ data: { text: '1'.repeat(16001) } })
      .mockResolvedValueOnce({ data: { text: '12345' } })
      .mockResolvedValueOnce({ data: { text: '12345' } })
      .mockResolvedValueOnce({ data: { text: 'D'.repeat(120) } });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const session = {
      ...sessionBase,
      documentTexts: 'Pełny tekst dokumentu',
    };

    const { result } = renderHook(() => useRunCouncil(session as never));

    await act(async () => {
      await result.current.runCouncil('Jak rozwijać produkt?');
    });

    expect(getRelevantChunks).not.toHaveBeenCalled();
    expect(getRelevantVaultChunks).toHaveBeenCalledWith('user-1', 'Jak rozwijać produkt?', 5);
    expect(callable.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ enableSearch: true, context: expect.stringContaining('Pełny tekst dokumentu') }));
    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ enableSearch: true }));
    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ enableSearch: false }));
    expect(
      mocks.setDocMock.mock.calls.some(([, payload]) => String(payload.content).includes('Doradca nie był w stanie przygotować analizy')),
    ).toBe(true);

    expect(result.current.error).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it('retries when the response matches a failed pattern', async () => {
    mocks.useCustomAdvisorsMock.mockReturnValue({ allAdvisors: [advisors[0]] });
    const getRelevantChunks = vi.fn();
    const getRelevantVaultChunks = vi.fn().mockResolvedValue([]);
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantChunks, getRelevantVaultChunks });

    const callable = vi.fn(async (payload: { temperature: number }) => {
      return payload.temperature === 0.7
        ? { data: { text: "I'm sorry " + 'x'.repeat(120) } }
        : { data: { text: 'E'.repeat(120) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunCouncil({ ...sessionBase, selectedAdvisors: ['contrarian'] } as never));

    await act(async () => {
      await result.current.runCouncil('Pytanie');
    });

    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.8 }));
    expect(
      mocks.setDocMock.mock.calls.some(([, payload]) => payload.content === 'E'.repeat(120)),
    ).toBe(true);
  });

  it('retries when the response has no letters', async () => {
    mocks.useCustomAdvisorsMock.mockReturnValue({ allAdvisors: [advisors[2]] });
    const getRelevantChunks = vi.fn();
    const getRelevantVaultChunks = vi.fn().mockResolvedValue([]);
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantChunks, getRelevantVaultChunks });

    const callable = vi.fn(async (payload: { temperature: number }) => {
      return payload.temperature === 0.7
        ? { data: { text: '1234567890'.repeat(12) } }
        : { data: { text: 'F'.repeat(120) } };
    });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunCouncil({ ...sessionBase, selectedAdvisors: ['executor'] } as never));

    await act(async () => {
      await result.current.runCouncil('Pytanie');
    });

    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.8 }));
    expect(
      mocks.setDocMock.mock.calls.some(([, payload]) => payload.content === 'F'.repeat(120)),
    ).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('falls back when both council responses are empty', async () => {
    mocks.useCustomAdvisorsMock.mockReturnValue({ allAdvisors: [advisors[0]] });
    const getRelevantChunks = vi.fn();
    const getRelevantVaultChunks = vi.fn().mockResolvedValue([]);
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantChunks, getRelevantVaultChunks });

    const callable = vi.fn().mockResolvedValue({ data: {} });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunCouncil({ ...sessionBase, selectedAdvisors: ['contrarian'] } as never));

    await act(async () => {
      await result.current.runCouncil('Pytanie');
    });

    expect(callable).toHaveBeenCalledTimes(2);
    expect(
      mocks.setDocMock.mock.calls.some(([, payload]) => String(payload.content).includes('Doradca nie był w stanie przygotować analizy')),
    ).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('handles rate limits and generic generation failures', async () => {
    const getRelevantChunks = vi.fn();
    const getRelevantVaultChunks = vi.fn().mockResolvedValue([]);
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantChunks, getRelevantVaultChunks });

    const rateLimitCallable = vi.fn().mockRejectedValue({ message: 'Rate limit exceeded' });
    mocks.httpsCallableMock.mockReturnValue(rateLimitCallable);
    const session = { ...sessionBase, selectedAdvisors: ['contrarian'] };

    const rateLimited = renderHook(() => useRunCouncil(session as never));
    await act(async () => {
      await rateLimited.result.current.runCouncil('Pytanie');
    });

    expect(mocks.toastError).toHaveBeenCalled();
    expect(rateLimited.result.current.error).toContain('limit zapyta');
    expect(rateLimited.result.current.isRunning).toBe(false);

    const genericCallable = vi.fn().mockRejectedValue({});
    mocks.httpsCallableMock.mockReturnValue(genericCallable);
    const genericFailure = renderHook(() => useRunCouncil(session as never));

    await act(async () => {
      await genericFailure.result.current.runCouncil('Pytanie');
    });

    expect(console.error).toHaveBeenCalled();
    expect(genericFailure.result.current.error).toContain('generowania odpowiedzi');
    expect(genericFailure.result.current.isRunning).toBe(false);
  });
});

describe('useRunPeerReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.useDocumentRAGMock.mockReturnValue({
      getRelevantVaultChunks: vi.fn().mockResolvedValue([]),
    });
    let docCounter = 0;
    mocks.docMock.mockImplementation((...args: unknown[]) => {
      const firstArg = args[0] as { kind?: string } | undefined;
      if (firstArg?.kind === 'collection') {
        docCounter += 1;
        return { id: `peer-message-${docCounter}` };
      }
      return { id: String(args[2]) };
    });
    mocks.setDocMock.mockResolvedValue(undefined);
    mocks.updateDocMock.mockResolvedValue(undefined);
  });

  it('returns early when user is missing', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    const { result } = renderHook(() => useRunPeerReview('session-1'));

    await act(async () => {
      await result.current.runPeerReview(peerMessages as never, 'Kontekst');
    });

    expect(mocks.setDocMock).not.toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
  });

  it('builds anonymized context with vault chunks and falls back when peer review text is empty', async () => {
    const getRelevantVaultChunks = vi.fn().mockResolvedValue([
      { documentName: 'Vault Peer', text: 'Fragment 1' },
      { documentName: 'Vault Peer', text: 'Fragment 2' },
    ]);
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantVaultChunks });

    const callable = vi.fn().mockResolvedValue({ data: {} });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const { result } = renderHook(() => useRunPeerReview('session-1'));

    await act(async () => {
      await result.current.runPeerReview(peerMessages as never, 'Pełny kontekst');
    });

    expect(getRelevantVaultChunks).toHaveBeenCalledWith('user-1', 'Pytanie usera', 3);
    expect(callable).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Odpowiedź A:'),
        systemInstruction: expect.stringContaining('bezstronnym'),
      }),
    );
    expect(callable.mock.calls[0][0].prompt).toContain('Vault Peer');
    expect(callable.mock.calls[0][0].prompt).toContain('Pełny kontekst');
    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'peer-message-1' },
      expect.objectContaining({
        role: 'peer_review',
        content: 'Brak odpowiedzi z Peer Review.',
        order: 6,
      }),
    );
    expect(mocks.updateDocMock).toHaveBeenCalledWith({ id: 'session-1' }, { status: 'peer_review_completed' });
    expect(result.current.error).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it('supports runs without a user question or additional context and falls back to numeric labels after Z', async () => {
    const getRelevantVaultChunks = vi.fn();
    mocks.useDocumentRAGMock.mockReturnValue({ getRelevantVaultChunks });

    const callable = vi.fn().mockResolvedValue({ data: { text: 'Peer review gotowy' } });
    mocks.httpsCallableMock.mockReturnValue(callable);

    const messagesWithoutUser = Array.from({ length: 27 }, (_, index) => ({
      id: 'advisor-' + (index + 1),
      sessionId: 'session-1',
      userId: 'user-1',
      role: 'advisor_' + (index + 1),
      content: 'Analiza ' + (index + 1),
      order: index + 1,
      timestamp: index + 2,
    }));

    const { result } = renderHook(() => useRunPeerReview('session-1'));

    await act(async () => {
      await result.current.runPeerReview(messagesWithoutUser as never);
    });

    expect(getRelevantVaultChunks).not.toHaveBeenCalled();
    expect(callable.mock.calls[0][0].prompt).not.toContain('Bazy Wiedzy');
    expect(callable.mock.calls[0][0].prompt).toContain('Odpowiedź A:');
    expect(callable.mock.calls[0][0].prompt).toContain('Odpowiedź 26:');
    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'peer-message-1' },
      expect.objectContaining({ content: 'Peer review gotowy' }),
    );
    expect(result.current.isRunning).toBe(false);
  });

  it('stores explicit and fallback peer review errors', async () => {
    const messageFailure = vi.fn().mockRejectedValue({ message: 'Peer review failed' });
    mocks.httpsCallableMock.mockReturnValue(messageFailure);
    const explicit = renderHook(() => useRunPeerReview('session-1'));

    await act(async () => {
      await explicit.result.current.runPeerReview(peerMessages as never, 'Kontekst');
    });

    expect(explicit.result.current.error).toBe('Peer review failed');
    expect(explicit.result.current.isRunning).toBe(false);

    const fallbackFailure = vi.fn().mockRejectedValue({});
    mocks.httpsCallableMock.mockReturnValue(fallbackFailure);
    const fallback = renderHook(() => useRunPeerReview('session-1'));

    await act(async () => {
      await fallback.result.current.runPeerReview(peerMessages as never);
    });

    expect(console.error).toHaveBeenCalled();
    expect(fallback.result.current.error).toContain('recenzji');
    expect(fallback.result.current.isRunning).toBe(false);
  });
});








