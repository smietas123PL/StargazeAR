import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const useUserSessionsMock = vi.fn();
  const createFollowUpMock = vi.fn();
  const getHistoryMock = vi.fn();
  const saveMessageMock = vi.fn();
  const docMock = vi.fn((...args: unknown[]) => ({ id: String(args[2]) }));
  const updateDocMock = vi.fn();
  const db = { name: 'db' };
  const instances: Array<{
    options: {
      onStateChange: (state: 'idle' | 'connecting' | 'connected' | 'error') => void;
      onError: (error: string) => void;
      onFunctionCall: (name: string, args: any) => Promise<any>;
      onTranscript: (text: string, isUser: boolean) => void;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];

  class LiveVoiceServiceMock {
    options: {
      onStateChange: (state: 'idle' | 'connecting' | 'connected' | 'error') => void;
      onError: (error: string) => void;
      onFunctionCall: (name: string, args: any) => Promise<any>;
      onTranscript: (text: string, isUser: boolean) => void;
    };
    connect = vi.fn();
    disconnect = vi.fn();

    constructor(options: {
      onStateChange: (state: 'idle' | 'connecting' | 'connected' | 'error') => void;
      onError: (error: string) => void;
      onFunctionCall: (name: string, args: any) => Promise<any>;
      onTranscript: (text: string, isUser: boolean) => void;
    }) {
      this.options = options;
      instances.push(this);
    }
  }

  return {
    useAuthMock,
    useUserSessionsMock,
    createFollowUpMock,
    getHistoryMock,
    saveMessageMock,
    docMock,
    updateDocMock,
    db,
    instances,
    LiveVoiceServiceMock,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../hooks/useUserSessions', () => ({
  useUserSessions: () => mocks.useUserSessionsMock(),
}));

vi.mock('../hooks/useDecisionFollowUp', () => ({
  useDecisionFollowUp: () => ({
    createFollowUp: mocks.createFollowUpMock,
  }),
}));

vi.mock('../services/firebase/voiceChatDb', () => ({
  voiceChatDb: {
    getHistory: (...args: unknown[]) => mocks.getHistoryMock(...args),
    saveMessage: (...args: unknown[]) => mocks.saveMessageMock(...args),
  },
}));

vi.mock('../services/ai/liveVoiceService', () => ({
  LiveVoiceService: mocks.LiveVoiceServiceMock,
}));

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mocks.docMock(...args),
  updateDoc: (...args: unknown[]) => mocks.updateDocMock(...args),
  getDoc: vi.fn(),
}));

import { useVoiceChat } from '../hooks/useVoiceChat';

const sessions = [
  {
    id: 'session-1',
    title: 'Sesja 1',
    decisions: [
      {
        id: 'decision-1',
        title: 'Decyzja 1',
        description: 'Opis',
        expectedOutcome: 'Efekt',
        status: 'planned',
        decidedAt: 1,
      },
    ],
  },
  {
    id: 'session-2',
    title: 'Sesja 2',
    decisions: [
      {
        id: 'decision-2',
        title: 'Decyzja 2',
        description: 'Opis 2',
        expectedOutcome: 'Efekt 2',
        status: 'in_progress',
        decidedAt: 2,
      },
    ],
  },
] as const;

describe('useVoiceChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.instances.length = 0;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.useUserSessionsMock.mockReturnValue({ sessions });
    mocks.createFollowUpMock.mockResolvedValue('follow-up-1');
    mocks.getHistoryMock.mockResolvedValue([]);
    mocks.saveMessageMock.mockResolvedValue(undefined);
    mocks.updateDocMock.mockResolvedValue(undefined);
  });

  it('loads existing history for authenticated users', async () => {
    const history = [
      { id: 'msg-1', text: 'Cześć', isUser: true, timestamp: 1 },
      { id: 'msg-2', text: 'Hej', isUser: false, timestamp: 2 },
    ];
    mocks.getHistoryMock.mockResolvedValue(history);

    const { result } = renderHook(() => useVoiceChat());

    await waitFor(() => {
      expect(result.current.messages).toEqual(history);
    });

    expect(mocks.getHistoryMock).toHaveBeenCalledWith('user-1');
  });

  it('skips history loading and message persistence for anonymous users', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    const { result } = renderHook(() => useVoiceChat());

    expect(mocks.getHistoryMock).not.toHaveBeenCalled();

    act(() => {
      result.current.connect('Voice');
    });

    const instance = mocks.instances[0];
    act(() => {
      instance.options.onTranscript('Anon message', true);
    });

    expect(result.current.messages).toEqual([
      expect.objectContaining({ text: 'Anon message', isUser: true }),
    ]);
    expect(mocks.saveMessageMock).not.toHaveBeenCalled();
  });

  it('connects once, updates state and errors, merges transcripts and disconnects on unmount', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1500)
      .mockReturnValueOnce(5000);

    const { result, unmount } = renderHook(() => useVoiceChat());

    act(() => {
      result.current.connect('Voice A', 'System A');
      result.current.connect('Voice B', 'System B');
    });

    expect(mocks.instances).toHaveLength(1);
    expect(mocks.instances[0].connect).toHaveBeenNthCalledWith(1, 'Voice A', 'System A');
    expect(mocks.instances[0].connect).toHaveBeenNthCalledWith(2, 'Voice B', 'System B');

    act(() => {
      mocks.instances[0].options.onStateChange('connected');
      mocks.instances[0].options.onError('boom');
      mocks.instances[0].options.onTranscript('Hello', true);
      mocks.instances[0].options.onTranscript(' world', true);
      mocks.instances[0].options.onTranscript('Reply', false);
    });

    expect(result.current.state).toBe('connected');
    expect(result.current.error).toBe('boom');
    expect(result.current.messages).toEqual([
      { id: '1000', text: 'Hello world', isUser: true, timestamp: 1500 },
      { id: '5000', text: 'Reply', isUser: false, timestamp: 5000 },
    ]);
    expect(mocks.saveMessageMock).toHaveBeenCalledTimes(2);
    expect(mocks.saveMessageMock).toHaveBeenNthCalledWith(
      1,
      'user-1',
      expect.objectContaining({ text: 'Hello', isUser: true }),
    );
    expect(mocks.saveMessageMock).toHaveBeenNthCalledWith(
      2,
      'user-1',
      expect.objectContaining({ text: 'Reply', isUser: false }),
    );

    unmount();

    expect(mocks.instances[0].disconnect).toHaveBeenCalledTimes(1);
    nowSpy.mockRestore();
  });

  it('returns an error when createDecision is called without active sessions', async () => {
    mocks.useUserSessionsMock.mockReturnValue({ sessions: [] });

    const { result } = renderHook(() => useVoiceChat());

    act(() => {
      result.current.connect();
    });

    const emptyResult = await mocks.instances[0].options.onFunctionCall('createDecision', {
      title: 'Nowa',
      description: 'Opis',
      expectedOutcome: 'Efekt',
    });
    expect(emptyResult).toEqual(
      expect.objectContaining({ success: false, error: expect.stringContaining('Brak aktywnej sesji') }),
    );
  });

  it('creates decisions in the newest session', async () => {
    mocks.useUserSessionsMock.mockReturnValue({ sessions });

    const { result } = renderHook(() => useVoiceChat());
    act(() => {
      result.current.connect();
    });

    const response = await mocks.instances[0].options.onFunctionCall('createDecision', {
      title: 'Nowa decyzja',
      description: 'Opis',
      expectedOutcome: 'Efekt',
    });

    expect(mocks.updateDocMock).toHaveBeenCalledWith(
      { id: 'session-1' },
      expect.objectContaining({
        decisions: [
          expect.objectContaining({ id: 'decision-1' }),
          expect.objectContaining({
            title: 'Nowa decyzja',
            description: 'Opis',
            expectedOutcome: 'Efekt',
            status: 'planned',
          }),
        ],
      }),
    );
    expect(response).toEqual(expect.objectContaining({ success: true, message: expect.stringContaining('utworzona') }));
  });

  it('creates decisions when the current session has no existing decisions', async () => {
    mocks.useUserSessionsMock.mockReturnValue({
      sessions: [
        {
          id: 'session-empty',
          title: 'Pusta sesja',
        },
      ],
    });

    const { result } = renderHook(() => useVoiceChat());
    act(() => {
      result.current.connect();
    });

    const response = await mocks.instances[0].options.onFunctionCall('createDecision', {
      title: 'Pierwsza decyzja',
      description: 'Opis',
      expectedOutcome: 'Efekt',
    });

    expect(mocks.updateDocMock).toHaveBeenCalledWith(
      { id: 'session-empty' },
      {
        decisions: [
          expect.objectContaining({
            title: 'Pierwsza decyzja',
            description: 'Opis',
            expectedOutcome: 'Efekt',
            status: 'planned',
          }),
        ],
      },
    );
    expect(response).toEqual(expect.objectContaining({ success: true }));
  });

  it('updates decision status and reports missing decisions', async () => {
    mocks.useUserSessionsMock.mockReturnValue({
      sessions: [
        {
          id: 'session-2',
          title: 'Sesja 2',
          decisions: [
            {
              id: 'decision-2',
              title: 'Decyzja 2',
              description: 'Opis 2',
              expectedOutcome: 'Efekt 2',
              status: 'in_progress',
              decidedAt: 2,
            },
            {
              id: 'decision-3',
              title: 'Decyzja 3',
              description: 'Opis 3',
              expectedOutcome: 'Efekt 3',
              status: 'planned',
              decidedAt: 3,
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useVoiceChat());

    act(() => {
      result.current.connect();
    });

    const success = await mocks.instances[0].options.onFunctionCall('updateDecisionStatus', {
      decisionId: 'decision-2',
      status: 'completed',
    });

    expect(mocks.updateDocMock).toHaveBeenCalledWith(
      { id: 'session-2' },
      {
        decisions: [
          expect.objectContaining({ id: 'decision-2', status: 'completed' }),
          expect.objectContaining({ id: 'decision-3', status: 'planned' }),
        ],
      },
    );
    expect(success).toEqual(expect.objectContaining({ success: true, message: expect.stringContaining('completed') }));

    const missing = await mocks.instances[0].options.onFunctionCall('updateDecisionStatus', {
      decisionId: 'missing',
      status: 'abandoned',
    });

    expect(missing).toEqual(expect.objectContaining({ success: false, error: expect.stringContaining('Nie znaleziono') }));
  });

  it('creates follow-up sessions, handles failures and missing targets', async () => {
    const { result } = renderHook(() => useVoiceChat());

    act(() => {
      result.current.connect();
    });

    const success = await mocks.instances[0].options.onFunctionCall('createFollowUpSession', {
      decisionId: 'decision-1',
    });

    expect(mocks.createFollowUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'decision-1',
        sessionId: 'session-1',
        sessionTitle: 'Sesja 1',
      }),
    );
    expect(success).toEqual(expect.objectContaining({ success: true, newSessionId: 'follow-up-1' }));

    mocks.createFollowUpMock.mockResolvedValueOnce(null);
    const failed = await mocks.instances[0].options.onFunctionCall('createFollowUpSession', {
      decisionId: 'decision-1',
    });
    expect(failed).toEqual(expect.objectContaining({ success: false, error: expect.stringContaining('follow-up') }));

    const missing = await mocks.instances[0].options.onFunctionCall('createFollowUpSession', {
      decisionId: 'missing',
    });
    expect(missing).toEqual(expect.objectContaining({ success: false, error: expect.stringContaining('Nie znaleziono') }));
  });

  it('returns unknown function errors and catches thrown handler failures', async () => {
    const { result } = renderHook(() => useVoiceChat());

    act(() => {
      result.current.connect();
    });

    const unknown = await mocks.instances[0].options.onFunctionCall('otherFunction', {});
    expect(unknown).toEqual(expect.objectContaining({ success: false, error: expect.stringContaining('Nieznana funkcja') }));

    mocks.updateDocMock.mockRejectedValueOnce(new Error('write failed'));
    const failed = await mocks.instances[0].options.onFunctionCall('createDecision', {
      title: 'Nowa decyzja',
      description: 'Opis',
      expectedOutcome: 'Efekt',
    });

    expect(console.error).toHaveBeenCalled();
    expect(failed).toEqual({ success: false, error: 'write failed' });
  });

  it('logs saveMessage persistence failures without breaking transcript updates', async () => {
    mocks.saveMessageMock.mockRejectedValueOnce(new Error('save failed'));
    const { result } = renderHook(() => useVoiceChat());

    act(() => {
      result.current.connect();
    });

    act(() => {
      mocks.instances[0].options.onTranscript('Hello', true);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    expect(result.current.messages).toEqual([
      expect.objectContaining({ text: 'Hello', isUser: true }),
    ]);
  });

  it('disconnects safely when no service was created', () => {
    const { result } = renderHook(() => useVoiceChat());

    act(() => {
      result.current.disconnect();
    });

    expect(mocks.instances).toHaveLength(0);
  });
});
