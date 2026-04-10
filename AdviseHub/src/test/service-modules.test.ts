import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  googleCtorSpy: vi.fn(),
  generateContentMock: vi.fn(),
  collectionMock: vi.fn(),
  addDocMock: vi.fn(),
  serverTimestampMock: vi.fn(),
  queryMock: vi.fn(),
  orderByMock: vi.fn(),
  getDocsMock: vi.fn(),
  whereMock: vi.fn(),
  db: { name: 'db' },
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    config: unknown;
    models = {
      generateContent: mocks.generateContentMock,
    };

    constructor(config: unknown) {
      this.config = config;
      mocks.googleCtorSpy(config);
    }
  },
}));

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mocks.collectionMock(...args),
  addDoc: (...args: unknown[]) => mocks.addDocMock(...args),
  serverTimestamp: () => mocks.serverTimestampMock(),
  query: (...args: unknown[]) => mocks.queryMock(...args),
  orderBy: (...args: unknown[]) => mocks.orderByMock(...args),
  getDocs: (...args: unknown[]) => mocks.getDocsMock(...args),
  where: (...args: unknown[]) => mocks.whereMock(...args),
}));

describe('service modules', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    vi.unstubAllEnvs();
    mocks.collectionMock.mockReturnValue({ ref: 'collection-ref' });
    mocks.serverTimestampMock.mockReturnValue('server-time');
    mocks.queryMock.mockReturnValue({ ref: 'query-ref' });
    mocks.orderByMock.mockReturnValue({ ref: 'order-ref' });
    mocks.whereMock.mockReturnValue({ ref: 'where-ref' });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('creates Gemini clients from local storage or available env values', async () => {
    localStorage.setItem('advisehub_gemini_api_key', 'local-key');

    const gemini = await import('../services/gemini');
    const client = gemini.getGeminiClient();

    expect(mocks.googleCtorSpy).toHaveBeenCalledWith({ apiKey: 'local-key' });
    expect(client).toBeTruthy();

    localStorage.clear();
    vi.resetModules();

    const envGemini = await import('../services/gemini');
    envGemini.getGeminiClient();

    expect(mocks.googleCtorSpy).toHaveBeenLastCalledWith(expect.objectContaining({ apiKey: expect.any(String) }));
  });

  it('resolves Gemini models from local storage and the default fallback', async () => {
    const gemini = await import('../services/gemini');
    const initialModel = gemini.getGeminiModel();

    expect(typeof initialModel).toBe('string');
    expect(initialModel.length).toBeGreaterThan(0);

    localStorage.setItem('advisehub_gemini_model', 'local-model');
    expect(gemini.getGeminiModel()).toBe('local-model');

    localStorage.clear();
    vi.resetModules();

    const defaultGemini = await import('../services/gemini');
    expect(defaultGemini.getGeminiModel()).toBe(initialModel || 'gemini-3.1-pro-preview');
  });

  it('searches the web through Gemini and uses a fallback response when empty', async () => {
    localStorage.setItem('advisehub_gemini_api_key', 'env-key');
    localStorage.setItem('advisehub_gemini_model', 'flash-model');
    mocks.generateContentMock.mockResolvedValueOnce({ text: 'Found result' });
    mocks.generateContentMock.mockResolvedValueOnce({ text: '' });

    const gemini = await import('../services/gemini');

    await expect(gemini.searchWeb('advisehub')).resolves.toBe('Found result');
    await expect(gemini.searchWeb('empty')).resolves.toContain('Brak wynik');

    expect(mocks.generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'flash-model',
      contents: 'advisehub',
      config: { tools: [{ googleSearch: {} }] },
    }));
  });

  it('generates advisor responses with and without search', async () => {
    localStorage.setItem('advisehub_gemini_api_key', 'env-key');
    localStorage.setItem('advisehub_gemini_model', 'pro-model');
    mocks.generateContentMock.mockResolvedValueOnce({ text: 'Advisor reply' });
    mocks.generateContentMock.mockResolvedValueOnce({ text: '' });

    const gemini = await import('../services/gemini');

    await expect(gemini.generateAdvisorResponse('', 'Question')).rejects.toThrow('Brak instrukcji systemowej');
    await expect(gemini.generateAdvisorResponse('System', 'Question', 'Context', true)).resolves.toBe('Advisor reply');
    await expect(gemini.generateAdvisorResponse('System', 'Question')).resolves.toContain('Brak odpowiedzi');

    expect(mocks.generateContentMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'pro-model',
      config: expect.objectContaining({
        systemInstruction: 'System',
        tools: [{ googleSearch: {} }],
      }),
    }));
  });

  it('saves voice chat messages and returns the saved document id', async () => {
    mocks.addDocMock.mockResolvedValue({ id: 'saved-id' });

    const { voiceChatDb } = await import('../services/firebase/voiceChatDb');
    const result = await voiceChatDb.saveMessage('user-1', {
      text: 'Hello',
      isUser: true,
      timestamp: 123,
    });

    expect(mocks.collectionMock).toHaveBeenCalledWith(mocks.db, 'voice_chats');
    expect(mocks.addDocMock).toHaveBeenCalledWith(
      { ref: 'collection-ref' },
      expect.objectContaining({
        userId: 'user-1',
        text: 'Hello',
        isUser: true,
        timestamp: 123,
        createdAt: 'server-time',
      }),
    );
    expect(result).toBe('saved-id');
  });

  it('rethrows save errors from voice chat persistence', async () => {
    const error = new Error('save failed');
    mocks.addDocMock.mockRejectedValue(error);

    const { voiceChatDb } = await import('../services/firebase/voiceChatDb');

    await expect(voiceChatDb.saveMessage('user-1', {
      text: 'Hello',
      isUser: true,
      timestamp: 123,
    })).rejects.toThrow(error);
    expect(console.error).toHaveBeenCalled();
  });

  it('loads and maps voice chat history', async () => {
    mocks.getDocsMock.mockResolvedValue({
      docs: [
        { id: '1', data: () => ({ text: 'A', isUser: true, timestamp: 1 }) },
        { id: '2', data: () => ({ text: 'B', isUser: false, timestamp: 2 }) },
      ],
    });

    const { voiceChatDb } = await import('../services/firebase/voiceChatDb');
    const result = await voiceChatDb.getHistory('user-1');

    expect(mocks.whereMock).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(mocks.orderByMock).toHaveBeenCalledWith('timestamp', 'asc');
    expect(result).toEqual([
      { id: '1', text: 'A', isUser: true, timestamp: 1 },
      { id: '2', text: 'B', isUser: false, timestamp: 2 },
    ]);
  });

  it('returns an empty history array when Firestore history loading fails', async () => {
    mocks.getDocsMock.mockRejectedValue(new Error('history failed'));

    const { voiceChatDb } = await import('../services/firebase/voiceChatDb');

    await expect(voiceChatDb.getHistory('user-1')).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('loads empty barrel modules without side effects', async () => {
    const uiIndex = await import('../components/ui');
    const featureIndex = await import('../components/features');
    const serviceIndex = await import('../services');

    expect(Object.keys(uiIndex)).toEqual([]);
    expect(Object.keys(featureIndex)).toEqual([]);
    expect(Object.keys(serviceIndex)).toEqual([]);
  });
});
