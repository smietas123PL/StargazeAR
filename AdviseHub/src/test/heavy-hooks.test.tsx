import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const navigateMock = vi.fn();
  const collectionMock = vi.fn((...args: unknown[]) => ({ kind: 'collection', args }));
  const docMock = vi.fn();
  const setDocMock = vi.fn();
  const getDocsMock = vi.fn();
  const deleteDocMock = vi.fn();
  const queryMock = vi.fn((...args: unknown[]) => ({ kind: 'query', args }));
  const whereMock = vi.fn((...args: unknown[]) => ({ kind: 'where', args }));
  const refMock = vi.fn((...args: unknown[]) => ({ kind: 'ref', args }));
  const uploadBytesMock = vi.fn();
  const getDownloadURLMock = vi.fn();
  const db = { name: 'db' };
  const storage = { name: 'storage' };

  return {
    useAuthMock,
    navigateMock,
    collectionMock,
    docMock,
    setDocMock,
    getDocsMock,
    deleteDocMock,
    queryMock,
    whereMock,
    refMock,
    uploadBytesMock,
    getDownloadURLMock,
    db,
    storage,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigateMock,
}));

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
  storage: mocks.storage,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mocks.collectionMock(...args),
  doc: (...args: unknown[]) => mocks.docMock(...args),
  setDoc: (...args: unknown[]) => mocks.setDocMock(...args),
  getDocs: (...args: unknown[]) => mocks.getDocsMock(...args),
  deleteDoc: (...args: unknown[]) => mocks.deleteDocMock(...args),
  query: (...args: unknown[]) => mocks.queryMock(...args),
  where: (...args: unknown[]) => mocks.whereMock(...args),
}));

vi.mock('firebase/storage', () => ({
  ref: (...args: unknown[]) => mocks.refMock(...args),
  uploadBytes: (...args: unknown[]) => mocks.uploadBytesMock(...args),
  getDownloadURL: (...args: unknown[]) => mocks.getDownloadURLMock(...args),
}));

vi.mock('../hooks/useAdvisors', () => ({
  DEFAULT_PROMPTS: {
    contrarian: 'Default contrarian',
    first_principles: 'Default first principles',
    expansionist: 'Default expansionist',
    outsider: 'Default outsider',
    executor: 'Default executor',
  },
  getAdvisorSystemPrompt: (role: string) => `Prompt for ${role}`,
}));

import { LAST_SELECTED_ADVISORS_KEY, useCreateSession } from '../hooks/useCreateSession';
import { useCustomAdvisors } from '../hooks/useCustomAdvisors';

const makeSnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  empty: docs.length === 0,
  docs: docs.map((doc) => ({
    id: doc.id,
    data: () => doc.data,
  })),
  forEach: (callback: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
    docs.forEach((doc) => callback({ id: doc.id, data: () => doc.data }));
  },
});

const makeAttachedFile = (name: string, extractedText: string, options: { isExtracting?: boolean; error?: string; size?: number } = {}) => ({
  file: new File(['content'], name, { type: 'text/plain' }),
  extractedText,
  isExtracting: options.isExtracting ?? false,
  error: options.error,
  size: options.size,
});

describe('useCustomAdvisors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.getDocsMock.mockResolvedValue(makeSnapshot([]));
    mocks.docMock.mockImplementation((...args: unknown[]) => {
      if (args.length === 1) return { id: 'generated-id' };
      return { id: String(args[2]) };
    });
    mocks.setDocMock.mockResolvedValue(undefined);
    mocks.deleteDocMock.mockResolvedValue(undefined);
  });

  it('returns base advisors and no persistence actions for anonymous users', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });

    const { result } = renderHook(() => useCustomAdvisors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.customAdvisors).toEqual([]);
    expect(result.current.allAdvisors).toHaveLength(5);
    expect(result.current.allAdvisors.map((advisor) => advisor.role)).toEqual([
      'contrarian',
      'first_principles',
      'expansionist',
      'outsider',
      'executor',
    ]);

    await act(async () => {
      expect(await result.current.saveCustomAdvisor({
        namePl: 'Nowy',
        nameEn: 'New',
        description: 'Opis',
        systemPrompt: 'Prompt',
        icon: 'person',
        color: 'bg-primary',
        bgClass: 'bg-primary/10',
        borderClass: 'border-primary/20',
        textClass: 'text-primary',
      } as never)).toBeUndefined();
      expect(await result.current.deleteCustomAdvisor('custom-1')).toBeUndefined();
    });

    expect(mocks.getDocsMock).not.toHaveBeenCalled();
    expect(mocks.setDocMock).not.toHaveBeenCalled();
    expect(mocks.deleteDocMock).not.toHaveBeenCalled();
  });

  it('fetches custom advisors and applies fallback fields', async () => {
    mocks.getDocsMock.mockResolvedValueOnce(makeSnapshot([
      {
        id: 'custom-1',
        data: {
          namePl: 'Strateg',
          description: 'Opis stratega',
          systemPrompt: 'Prompt stratega',
        },
      },
    ]));

    const { result } = renderHook(() => useCustomAdvisors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.customAdvisors).toEqual([
      expect.objectContaining({
        id: 'custom-1',
        namePl: 'Strateg',
        role: 'custom-1',
        icon: 'person',
        color: 'bg-primary',
        bgClass: 'bg-primary/10',
        borderClass: 'border-primary/20',
        textClass: 'text-primary',
        isCustom: true,
      }),
    ]);
    expect(result.current.allAdvisors).toHaveLength(6);
  });

  it('stores fetch errors and clears loading', async () => {
    mocks.getDocsMock.mockRejectedValueOnce(new Error('fetch failed'));

    const { result } = renderHook(() => useCustomAdvisors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(console.error).toHaveBeenCalled();
    expect(result.current.error).toBe('fetch failed');
    expect(result.current.customAdvisors).toEqual([]);
  });

  it('creates and updates custom advisors', async () => {
    let generatedId = 'new-advisor';
    mocks.docMock.mockImplementation((...args: unknown[]) => {
      if (args.length === 1) return { id: generatedId };
      return { id: String(args[2]) };
    });

    const { result } = renderHook(() => useCustomAdvisors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createdId: string | undefined;
    await act(async () => {
      createdId = await result.current.saveCustomAdvisor({
        namePl: 'Nowy Doradca',
        nameEn: 'New Advisor',
        description: 'Opis',
        systemPrompt: 'Prompt',
        icon: 'bolt',
        color: 'bg-cyan-500',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-500/20',
        textClass: 'text-cyan-500',
      } as never);
    });

    expect(createdId).toBe('new-advisor');
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      1,
      { id: 'new-advisor' },
      expect.objectContaining({
        userId: 'user-1',
        role: 'custom_new-advisor',
        avatarUrl: null,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      }),
      { merge: true },
    );
    expect(result.current.customAdvisors[0]).toEqual(expect.objectContaining({ id: 'new-advisor', namePl: 'Nowy Doradca' }));

    generatedId = 'ignored-id';
    await act(async () => {
      await result.current.saveCustomAdvisor({
        id: 'new-advisor',
        role: 'custom_new-advisor',
        namePl: 'Edytowany Doradca',
        nameEn: 'Edited Advisor',
        description: 'Nowy opis',
        systemPrompt: 'Nowy prompt',
        icon: 'star',
        color: 'bg-pink-500',
        bgClass: 'bg-pink-500/10',
        borderClass: 'border-pink-500/20',
        textClass: 'text-pink-500',
        avatarUrl: 'https://example.com/avatar.png',
      } as never);
    });

    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      2,
      { id: 'new-advisor' },
      expect.objectContaining({
        role: 'custom_new-advisor',
        avatarUrl: 'https://example.com/avatar.png',
        updatedAt: expect.any(Number),
      }),
      { merge: true },
    );
    expect(mocks.setDocMock.mock.calls[1][1]).not.toHaveProperty('createdAt');
    expect(result.current.customAdvisors[0]).toEqual(expect.objectContaining({ namePl: 'Edytowany Doradca', icon: 'star' }));
  });

  it('updates existing advisors without explicit role and preserves untouched entries', async () => {
    mocks.getDocsMock.mockResolvedValueOnce(makeSnapshot([
      {
        id: 'custom-1',
        data: {
          namePl: 'Pierwszy',
          nameEn: 'First',
          role: 'custom_1',
          description: 'Opis 1',
          systemPrompt: 'Prompt 1',
          icon: 'person',
          color: 'bg-primary',
          bgClass: 'bg-primary/10',
          borderClass: 'border-primary/20',
          textClass: 'text-primary',
        },
      },
      {
        id: 'custom-2',
        data: {
          namePl: 'Drugi',
          nameEn: 'Second',
          role: 'custom_2',
          description: 'Opis 2',
          systemPrompt: 'Prompt 2',
          icon: 'star',
          color: 'bg-pink-500',
          bgClass: 'bg-pink-500/10',
          borderClass: 'border-pink-500/20',
          textClass: 'text-pink-500',
        },
      },
    ]));
    mocks.docMock.mockImplementation((...args: unknown[]) => {
      if (args.length === 1) return { id: 'generated-id' };
      return { id: String(args[2]) };
    });

    const { result } = renderHook(() => useCustomAdvisors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveCustomAdvisor({
        id: 'custom-1',
        namePl: 'Pierwszy Edytowany',
        nameEn: 'First Updated',
        description: 'Opis 1+',
        systemPrompt: 'Prompt 1+',
        icon: 'bolt',
        color: 'bg-cyan-500',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-500/20',
        textClass: 'text-cyan-500',
      } as never);
    });

    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'custom-1' },
      expect.objectContaining({ role: 'custom_custom-1' }),
      { merge: true },
    );
    expect(result.current.customAdvisors).toEqual([
      expect.objectContaining({ id: 'custom-1', namePl: 'Pierwszy Edytowany', role: 'custom_custom-1' }),
      expect.objectContaining({ id: 'custom-2', namePl: 'Drugi', role: 'custom_2' }),
    ]);
  });

  it('rethrows save errors from custom advisor persistence', async () => {
    const { result } = renderHook(() => useCustomAdvisors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mocks.setDocMock.mockRejectedValueOnce(new Error('cannot save'));

    await expect(result.current.saveCustomAdvisor({
      namePl: 'Awaryjny Doradca',
      nameEn: 'Fallback Advisor',
      description: 'Opis',
      systemPrompt: 'Prompt',
      icon: 'person',
      color: 'bg-primary',
      bgClass: 'bg-primary/10',
      borderClass: 'border-primary/20',
      textClass: 'text-primary',
    } as never)).rejects.toThrow('cannot save');

    expect(console.error).toHaveBeenCalled();
  });

  it('deletes advisors and rethrows delete errors', async () => {
    mocks.getDocsMock.mockResolvedValueOnce(makeSnapshot([
      {
        id: 'custom-1',
        data: {
          namePl: 'Strateg',
          nameEn: 'Strategist',
          role: 'custom_1',
          description: 'Opis',
          systemPrompt: 'Prompt',
          icon: 'person',
          color: 'bg-primary',
          bgClass: 'bg-primary/10',
          borderClass: 'border-primary/20',
          textClass: 'text-primary',
        },
      },
    ]));

    const { result } = renderHook(() => useCustomAdvisors());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.customAdvisors).toHaveLength(1);

    await act(async () => {
      await result.current.deleteCustomAdvisor('custom-1');
    });

    expect(mocks.deleteDocMock).toHaveBeenCalledWith({ id: 'custom-1' });
    expect(result.current.customAdvisors).toEqual([]);

    mocks.deleteDocMock.mockRejectedValueOnce(new Error('cannot delete'));

    await expect(result.current.deleteCustomAdvisor('custom-2')).rejects.toThrow('cannot delete');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('useCreateSession', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.docMock
      .mockReturnValueOnce({ id: 'session-1' })
      .mockReturnValueOnce({ id: 'message-1' });
    mocks.setDocMock.mockResolvedValue(undefined);
    mocks.uploadBytesMock.mockResolvedValue(undefined);
    mocks.getDownloadURLMock.mockResolvedValue('https://example.com/file.txt');
    mocks.refMock.mockImplementation((...args: unknown[]) => ({ kind: 'ref', args, path: args[1] }));
  });

  it('validates missing user, empty question and invalid files before creation', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    const noUser = renderHook(() => useCreateSession());

    await act(async () => {
      await noUser.result.current.createSession('Pytanie', [], []);
    });
    expect(noUser.result.current.error).toContain('zalogowany');

    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    const emptyQuestion = renderHook(() => useCreateSession());

    await act(async () => {
      await emptyQuestion.result.current.createSession('   ', [], []);
    });
    expect(emptyQuestion.result.current.error).toContain('puste');

    const extractingFiles = renderHook(() => useCreateSession());
    await act(async () => {
      await extractingFiles.result.current.createSession('Pytanie', [makeAttachedFile('draft.txt', 'tekst', { isExtracting: true })] as never, []);
    });
    expect(extractingFiles.result.current.error).toContain('analizy');

    const erroredFiles = renderHook(() => useCreateSession());
    await act(async () => {
      await erroredFiles.result.current.createSession('Pytanie', [makeAttachedFile('broken.txt', 'tekst', { error: 'broken' })] as never, []);
    });
    expect(erroredFiles.result.current.error).toContain('pliki');
  });

  it('creates a session without attachments and navigates to it', async () => {
    const { result } = renderHook(() => useCreateSession());

    await act(async () => {
      await result.current.createSession('Krótki temat', [] as never, ['contrarian', 'executor']);
    });

    expect(localStorage.getItem(LAST_SELECTED_ADVISORS_KEY)).toBe(JSON.stringify(['contrarian', 'executor']));
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      1,
      { id: 'session-1' },
      expect.objectContaining({
        id: 'session-1',
        userId: 'user-1',
        title: 'Krótki temat',
        fileUrls: [],
        attachedFiles: [],
        selectedAdvisors: ['contrarian', 'executor'],
        documentTexts: '',
        fullContext: 'Krótki temat',
        participants: ['user-1'],
      }),
    );
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      2,
      { id: 'message-1' },
      expect.objectContaining({
        sessionId: 'session-1',
        content: 'Krótki temat',
        order: 0,
        role: 'user',
      }),
    );
    expect(mocks.navigateMock).toHaveBeenCalledWith('/session/session-1');
    expect(result.current.error).toBeNull();
    expect(result.current.isCreating).toBe(false);
  });

  it('uploads attachments, builds context and truncates the session title', async () => {
    mocks.docMock.mockReset();
    mocks.docMock
      .mockReturnValueOnce({ id: 'session-2' })
      .mockReturnValueOnce({ id: 'message-2' });
    mocks.getDownloadURLMock
      .mockResolvedValueOnce('https://example.com/a.txt')
      .mockResolvedValueOnce('https://example.com/b.txt');

    const longQuestion = 'To jest bardzo długie pytanie, które powinno zostać przycięte po pięćdziesięciu znakach podczas tworzenia tytułu sesji.';
    const files = [
      makeAttachedFile('brief.txt', 'Pierwszy dokument'),
      makeAttachedFile('notes.md', 'Drugi dokument'),
    ];

    const { result } = renderHook(() => useCreateSession());

    await act(async () => {
      await result.current.createSession(longQuestion, files as never, ['contrarian']);
    });

    expect(mocks.refMock).toHaveBeenNthCalledWith(1, mocks.storage, 'uploads/user-1/session-2/brief.txt');
    expect(mocks.refMock).toHaveBeenNthCalledWith(2, mocks.storage, 'uploads/user-1/session-2/notes.md');
    expect(mocks.uploadBytesMock).toHaveBeenCalledTimes(2);
    expect(mocks.setDocMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      title: `${longQuestion.substring(0, 50)}...`,
      fileUrls: ['https://example.com/a.txt', 'https://example.com/b.txt'],
      attachedFiles: [
        { name: 'brief.txt', url: 'https://example.com/a.txt' },
        { name: 'notes.md', url: 'https://example.com/b.txt' },
      ],
    }));
    expect(mocks.setDocMock.mock.calls[0][1].documentTexts).toContain('brief.txt');
    expect(mocks.setDocMock.mock.calls[0][1].documentTexts).toContain('Drugi dokument');
    expect(mocks.setDocMock.mock.calls[0][1].fullContext).toContain('Załączone dokumenty');
    expect(mocks.setDocMock.mock.calls[1][1].content).toBe(mocks.setDocMock.mock.calls[0][1].fullContext);
    expect(result.current.isCreating).toBe(false);
  });

  it('surfaces explicit creation errors', async () => {
    mocks.uploadBytesMock.mockRejectedValueOnce(new Error('upload failed'));
    const { result } = renderHook(() => useCreateSession());

    await act(async () => {
      await result.current.createSession('Pytanie', [makeAttachedFile('brief.txt', 'Treść')] as never, []);
    });

    expect(console.error).toHaveBeenCalled();
    expect(result.current.error).toBe('upload failed');
    expect(result.current.isCreating).toBe(false);
  });

  it('falls back to the default error message when creation throws a value without message', async () => {
    mocks.setDocMock.mockRejectedValueOnce({});
    const { result } = renderHook(() => useCreateSession());

    await act(async () => {
      await result.current.createSession('Pytanie', [] as never, []);
    });

    expect(result.current.error).toContain('tworzenia sesji');
    expect(result.current.isCreating).toBe(false);
  });
});



