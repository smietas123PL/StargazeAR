import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const connectMock = vi.fn();
  const recorderStartMock = vi.fn();
  const recorderStopMock = vi.fn();
  const playerInitMock = vi.fn();
  const playerStopMock = vi.fn();
  const playerPlayBase64Mock = vi.fn();
  const aiCtorMock = vi.fn();

  return {
    connectMock,
    recorderStartMock,
    recorderStopMock,
    playerInitMock,
    playerStopMock,
    playerPlayBase64Mock,
    aiCtorMock,
  };
});

vi.mock('@google/genai', () => {
  class GoogleGenAI {
    live = {
      connect: (...args: unknown[]) => mocks.connectMock(...args),
    };

    constructor(options: unknown) {
      mocks.aiCtorMock(options);
    }
  }

  return {
    GoogleGenAI,
    Modality: {
      AUDIO: 'AUDIO',
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
    },
  };
});

vi.mock('../services/audio/AudioRecorder', () => {
  class AudioRecorder {
    start(...args: unknown[]) {
      return mocks.recorderStartMock(...args);
    }

    stop(...args: unknown[]) {
      return mocks.recorderStopMock(...args);
    }
  }

  return { AudioRecorder };
});

vi.mock('../services/audio/AudioPlayer', () => {
  class AudioPlayer {
    init(...args: unknown[]) {
      return mocks.playerInitMock(...args);
    }

    stop(...args: unknown[]) {
      return mocks.playerStopMock(...args);
    }

    playBase64(...args: unknown[]) {
      return mocks.playerPlayBase64Mock(...args);
    }
  }

  return { AudioPlayer };
});

import { LiveVoiceService } from '../services/ai/liveVoiceService';

const makeCallbacks = () => ({
  onTranscript: vi.fn(),
  onStateChange: vi.fn(),
  onError: vi.fn(),
  onFunctionCall: vi.fn(),
});

describe('LiveVoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    mocks.connectMock.mockReset();
    mocks.recorderStartMock.mockReset();
    mocks.recorderStopMock.mockReset();
    mocks.playerInitMock.mockReset();
    mocks.playerStopMock.mockReset();
    mocks.playerPlayBase64Mock.mockReset();
  });

  it('throws when the Gemini API key is missing', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const callbacks = makeCallbacks();

    expect(() => new LiveVoiceService(callbacks)).toThrow('Brak klucza API Gemini');
  });

  it('connects with defaults, starts audio streaming and forwards realtime input', async () => {
    const callbacks = makeCallbacks();
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValue(session);
    const service = new LiveVoiceService(callbacks);

    await service.connect();

    expect(mocks.aiCtorMock).toHaveBeenCalledWith({ apiKey: 'test-key' });
    expect(callbacks.onStateChange).toHaveBeenCalledWith('connecting');
    const config = mocks.connectMock.mock.calls[0][0];
    expect(config.model).toBe('gemini-3.1-flash-live-preview');
    expect(config.config.responseModalities).toEqual(['AUDIO']);
    expect(config.config.speechConfig).toEqual({
      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
    });
    expect(config.config.systemInstruction).toContain('pomocnym asystentem głosowym');
    expect(config.config.tools[0].functionDeclarations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'createDecision' }),
        expect.objectContaining({ name: 'updateDecisionStatus' }),
        expect.objectContaining({ name: 'createFollowUpSession' }),
      ]),
    );
    await config.callbacks.onopen();

    expect(callbacks.onStateChange).toHaveBeenCalledWith('connected');
    expect(mocks.playerInitMock).toHaveBeenCalledTimes(1);
    expect(mocks.recorderStartMock).toHaveBeenCalledTimes(1);

    const realtimeCb = mocks.recorderStartMock.mock.calls[0][0];
    realtimeCb('pcm-data');
    await Promise.resolve();

    expect(session.sendRealtimeInput).toHaveBeenCalledWith({
      audio: { data: 'pcm-data', mimeType: 'audio/pcm;rate=16000' },
    });
  });

  it('supports custom voice and system instruction values', async () => {
    const callbacks = makeCallbacks();
    mocks.connectMock.mockResolvedValue({
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    });
    const service = new LiveVoiceService(callbacks);

    await service.connect('Nova', 'Custom instruction');

    expect(mocks.connectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Nova' } },
          },
          systemInstruction: 'Custom instruction',
        }),
      }),
    );
  });

  it('handles microphone startup errors during onopen', async () => {
    const callbacks = makeCallbacks();
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValue(session);
    mocks.recorderStartMock.mockRejectedValue(new Error('mic blocked'));
    const service = new LiveVoiceService(callbacks);

    await service.connect();
    const config = mocks.connectMock.mock.calls[0][0];

    await config.callbacks.onopen();

    expect(callbacks.onError).toHaveBeenCalledWith('mic blocked');
    expect(mocks.recorderStopMock).toHaveBeenCalledTimes(1);
    expect(mocks.playerStopMock).toHaveBeenCalledTimes(1);
    expect(session.close).toHaveBeenCalledTimes(1);
    expect(callbacks.onStateChange).toHaveBeenLastCalledWith('idle');
  });

  it('falls back to a generic microphone error when startup fails without a message', async () => {
    const callbacks = makeCallbacks();
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValue(session);
    mocks.recorderStartMock.mockRejectedValue({});
    const service = new LiveVoiceService(callbacks);

    await service.connect();
    const config = mocks.connectMock.mock.calls[0][0];

    await config.callbacks.onopen();

    expect(callbacks.onError).toHaveBeenCalledWith('Błąd mikrofonu');
  });

  it('handles server messages for audio, interruptions, transcripts and function calls', async () => {
    const callbacks = makeCallbacks();
    callbacks.onFunctionCall
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error('tool failed'));
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValue(session);
    const service = new LiveVoiceService(callbacks);

    await service.connect();
    const config = mocks.connectMock.mock.calls[0][0];

    await config.callbacks.onmessage({
      serverContent: {
        interrupted: true,
        modelTurn: {
          parts: [
            { inlineData: { data: 'audio-base64' } },
            { text: 'Transkrypt AI' },
          ],
        },
      },
      toolCall: {
        functionCalls: [
          { id: '1', name: 'createDecision', args: { title: 'Decyzja' } },
          { id: '2', name: 'badTool', args: {} },
        ],
      },
    });

    expect(mocks.playerPlayBase64Mock).toHaveBeenCalledWith('audio-base64');
    expect(mocks.playerStopMock).toHaveBeenCalled();
    expect(mocks.playerInitMock).toHaveBeenCalled();
    expect(callbacks.onTranscript).toHaveBeenCalledWith('Transkrypt AI', false);
    expect(callbacks.onFunctionCall).toHaveBeenNthCalledWith(1, 'createDecision', { title: 'Decyzja' });
    expect(callbacks.onFunctionCall).toHaveBeenNthCalledWith(2, 'badTool', {});
    expect(session.sendToolResponse).toHaveBeenCalledWith({
      functionResponses: [
        { id: '1', name: 'createDecision', response: { ok: true } },
        { id: '2', name: 'badTool', response: { error: 'tool failed' } },
      ],
    });
  });

  it('does not send tool responses before the current session is ready', async () => {
    const callbacks = makeCallbacks();
    let resolveSession: ((value: {
      sendRealtimeInput: ReturnType<typeof vi.fn>;
      sendToolResponse: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    }) => void) | undefined;
    const deferred = new Promise<{
      sendRealtimeInput: ReturnType<typeof vi.fn>;
      sendToolResponse: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    }>((resolve) => {
      resolveSession = resolve;
    });
    mocks.connectMock.mockImplementation(() => deferred);
    const service = new LiveVoiceService(callbacks);

    const connectPromise = service.connect();
    const config = mocks.connectMock.mock.calls[0][0];

    await config.callbacks.onmessage({
      toolCall: {
        functionCalls: [{ id: '1', name: 'createDecision', args: {} }],
      },
    });

    expect(callbacks.onFunctionCall).toHaveBeenCalledTimes(1);

    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    resolveSession?.(session);
    await connectPromise;

    expect(session.sendToolResponse).not.toHaveBeenCalled();
  });

  it('ignores empty toolCall payloads', async () => {
    const callbacks = makeCallbacks();
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValue(session);
    const service = new LiveVoiceService(callbacks);

    await service.connect();
    const config = mocks.connectMock.mock.calls[0][0];

    await config.callbacks.onmessage({ toolCall: {} });
    await config.callbacks.onmessage({ toolCall: { functionCalls: [] } });

    expect(callbacks.onFunctionCall).not.toHaveBeenCalled();
    expect(session.sendToolResponse).not.toHaveBeenCalled();
  });

  it('ignores messages without tool calls', async () => {
    const callbacks = makeCallbacks();
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValue(session);
    const service = new LiveVoiceService(callbacks);

    await service.connect();
    const config = mocks.connectMock.mock.calls[0][0];

    await config.callbacks.onmessage({});

    expect(callbacks.onFunctionCall).not.toHaveBeenCalled();
    expect(session.sendToolResponse).not.toHaveBeenCalled();
  });

  it('handles Live API errors and closes cleanly', async () => {
    const callbacks = makeCallbacks();
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValue(session);
    const service = new LiveVoiceService(callbacks);

    await service.connect();
    const config = mocks.connectMock.mock.calls[0][0];

    config.callbacks.onerror(new Error('socket'));
    expect(console.error).toHaveBeenCalled();
    expect(callbacks.onError).toHaveBeenCalledWith('Błąd połączenia z serwerem AI.');
    expect(callbacks.onStateChange).toHaveBeenCalledWith('error');

    config.callbacks.onclose();
    expect(session.close).toHaveBeenCalledTimes(1);
    expect(callbacks.onStateChange).toHaveBeenCalledWith('idle');
  });

  it('surfaces connect failures and recorder send errors', async () => {
    const callbacks = makeCallbacks();
    mocks.connectMock.mockRejectedValueOnce(new Error('connect failed'));
    const service = new LiveVoiceService(callbacks);

    await service.connect();

    expect(console.error).toHaveBeenCalled();
    expect(callbacks.onError).toHaveBeenCalledWith('connect failed');
    expect(callbacks.onStateChange).toHaveBeenCalledWith('error');

    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValueOnce(session);
    const secondService = new LiveVoiceService(callbacks);
    await secondService.connect();
    const config = mocks.connectMock.mock.calls[1][0];
    await config.callbacks.onopen();

    session.sendRealtimeInput.mockImplementation(() => {
      throw new Error('send failed');
    });
    const realtimeCb = mocks.recorderStartMock.mock.calls[0][0];
    realtimeCb('pcm-data');
    await Promise.resolve();

    expect(console.error).toHaveBeenCalled();
  });

  it('uses the default connection error message when connect fails without a message', async () => {
    const callbacks = makeCallbacks();
    mocks.connectMock.mockRejectedValueOnce({});
    const service = new LiveVoiceService(callbacks);

    await service.connect();

    expect(callbacks.onError).toHaveBeenCalledWith('Nie udało się nawiązać połączenia.');
    expect(callbacks.onStateChange).toHaveBeenCalledWith('error');
  });

  it('does not send audio after disconnect clears the pending session promise', async () => {
    const callbacks = makeCallbacks();
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(),
    };
    mocks.connectMock.mockResolvedValue(session);
    const service = new LiveVoiceService(callbacks);

    await service.connect();
    const config = mocks.connectMock.mock.calls[0][0];
    await config.callbacks.onopen();

    const realtimeCb = mocks.recorderStartMock.mock.calls[0][0];
    service.disconnect();
    realtimeCb('pcm-after-disconnect');
    await Promise.resolve();

    expect(session.sendRealtimeInput).not.toHaveBeenCalled();
  });

  it('disconnects safely even when closing the session throws', async () => {
    const callbacks = makeCallbacks();
    const session = {
      sendRealtimeInput: vi.fn(),
      sendToolResponse: vi.fn(),
      close: vi.fn(() => {
        throw new Error('close failed');
      }),
    };
    mocks.connectMock.mockResolvedValue(session);
    const service = new LiveVoiceService(callbacks);

    await service.connect();
    service.disconnect();
    service.disconnect();

    expect(mocks.recorderStopMock).toHaveBeenCalledTimes(2);
    expect(mocks.playerStopMock).toHaveBeenCalledTimes(2);
    expect(callbacks.onStateChange).toHaveBeenLastCalledWith('idle');
  });
});
