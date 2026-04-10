import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const collectionMock = vi.fn();
  const docMock = vi.fn();
  const setDocMock = vi.fn();
  const httpsCallableMock = vi.fn();
  const toastError = vi.fn();
  const toastLoading = vi.fn();
  const toastSuccess = vi.fn();
  const createRootMock = vi.fn();
  const renderMock = vi.fn();
  const unmountMock = vi.fn();
  const html2canvasMock = vi.fn();
  const pdfSaveMock = vi.fn();
  const pdfAddImageMock = vi.fn();
  const pdfAddPageMock = vi.fn();
  const jsPDFCtorSpy = vi.fn();
  const db = { name: 'db' };
  const functions = { name: 'functions' };

  class JsPDFMock {
    internal = {
      pageSize: {
        getWidth: () => 200,
        getHeight: () => 300,
      },
    };

    constructor(options: unknown) {
      jsPDFCtorSpy(options);
    }

    getImageProperties() {
      return { width: 100, height: 400 };
    }

    addImage = pdfAddImageMock;
    addPage = pdfAddPageMock;
    save = pdfSaveMock;
  }

  return {
    useAuthMock,
    collectionMock,
    docMock,
    setDocMock,
    httpsCallableMock,
    toastError,
    toastLoading,
    toastSuccess,
    createRootMock,
    renderMock,
    unmountMock,
    html2canvasMock,
    pdfSaveMock,
    pdfAddImageMock,
    pdfAddPageMock,
    jsPDFCtorSpy,
    db,
    functions,
    JsPDFMock,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
  functions: mocks.functions,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mocks.collectionMock(...args),
  doc: (...args: unknown[]) => mocks.docMock(...args),
  setDoc: (...args: unknown[]) => mocks.setDocMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => mocks.httpsCallableMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mocks.toastError(...args),
    loading: (...args: unknown[]) => mocks.toastLoading(...args),
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
  },
}));

vi.mock('react-dom/client', () => ({
  createRoot: (...args: unknown[]) => mocks.createRootMock(...args),
}));

vi.mock('html2canvas', () => ({
  default: (...args: unknown[]) => mocks.html2canvasMock(...args),
}));

vi.mock('jspdf', () => ({
  default: mocks.JsPDFMock,
}));

vi.mock('../components/features/SessionPDFTemplate', () => ({
  SessionPDFTemplate: () => <div>PDF Template</div>,
}));

import { useContinueConversation } from '../hooks/useContinueConversation';
import { useExportPDF } from '../hooks/useExportPDF';

const session = {
  id: 'session-1',
  userId: 'user-1',
  title: 'Sesja',
  question: 'Pytanie',
  status: 'completed',
  createdAt: 1,
  fileUrls: [],
};

const messages = [
  { id: 'm1', sessionId: 'session-1', userId: 'user-1', role: 'user', content: 'Pierwsza wiadomoÅ›Ä‡', order: 1, timestamp: 1 },
  { id: 'm2', sessionId: 'session-1', userId: 'user-1', role: 'chairman', content: 'OdpowiedÅº', order: 2, timestamp: 2 },
];

const advisors = [
  {
    id: 'advisor-1',
    namePl: 'Doradca',
    nameEn: 'Advisor',
    role: 'advisor',
    description: 'Opis',
    systemPrompt: 'Prompt',
    icon: 'gavel',
    color: 'bg-red-500',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    textClass: 'text-red-500',
    isCustom: false,
  },
];

describe('useExportPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.toastLoading.mockReturnValue('toast-id');
    mocks.createRootMock.mockReturnValue({ render: mocks.renderMock, unmount: mocks.unmountMock });
    mocks.html2canvasMock.mockImplementation(async (_element, options) => {
      const clonedEl = document.createElement('div');
      clonedEl.style.backgroundColor = 'oklch(1 0 0)';
      clonedEl.style.color = 'oklab(1 0 0)';
      const cleanEl = document.createElement('div');
      cleanEl.style.backgroundColor = 'rgb(0, 0, 0)';
      cleanEl.style.color = 'rgb(255, 255, 255)';
      const clonedDoc = {
        getElementsByTagName: () => [clonedEl, cleanEl],
      } as unknown as Document;
      options.onclone?.(clonedDoc);
      return {
        toDataURL: () => 'data:image/png;base64,123',
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exports a multipage pdf and cleans up on success', async () => {
    const { result } = renderHook(() => useExportPDF());

    await act(async () => {
      const promise = result.current.exportPDF(session as never, messages as never, advisors as never);
      await vi.runAllTimersAsync();
      await promise;
    });

    expect(mocks.toastLoading).toHaveBeenCalledWith('Generowanie raportu PDF...');
    expect(mocks.createRootMock).toHaveBeenCalledTimes(1);
    expect(mocks.renderMock).toHaveBeenCalledTimes(1);
    expect(mocks.jsPDFCtorSpy).toHaveBeenCalledWith({ orientation: 'portrait', unit: 'px', format: 'a4' });
    expect(mocks.pdfAddImageMock).toHaveBeenCalledTimes(3);
    expect(mocks.pdfAddPageMock).toHaveBeenCalledTimes(2);
    expect(mocks.pdfSaveMock).toHaveBeenCalledWith(expect.stringMatching(/^AdviseHub_Raport_\d{4}-\d{2}-\d{2}\.pdf$/));
    expect(mocks.unmountMock).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalledWith(expect.stringContaining('Raport PDF'), { id: 'toast-id' });
    expect(result.current.isExporting).toBe(false);
  });

  it('handles export errors and resets loading state', async () => {
    mocks.html2canvasMock.mockRejectedValueOnce(new Error('canvas failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useExportPDF());

    await act(async () => {
      const promise = result.current.exportPDF(session as never, messages as never, advisors as never);
      await vi.runAllTimersAsync();
      await promise;
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('generowania PDF'), { id: 'toast-id' });
    expect(result.current.isExporting).toBe(false);
  });
});

describe('useContinueConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1' } });
    mocks.collectionMock.mockImplementation((_dbArg, path: string) => ({ path }));
    mocks.docMock
      .mockReturnValueOnce({ id: 'user-msg-ref' })
      .mockReturnValueOnce({ id: 'chairman-msg-ref' });
    mocks.setDocMock.mockResolvedValue(undefined);
    const callable = vi.fn().mockResolvedValue({ data: { text: 'Chairman answer' } });
    mocks.httpsCallableMock.mockReturnValue(callable);
  });

  it('returns early when user is missing or text is blank', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    const noUser = renderHook(() => useContinueConversation('session-1'));

    await act(async () => {
      await noUser.result.current.sendMessage('Hello', messages as never);
    });
    expect(mocks.setDocMock).not.toHaveBeenCalled();

    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1' } });
    const blankText = renderHook(() => useContinueConversation('session-1'));

    await act(async () => {
      await blankText.result.current.sendMessage('   ', messages as never);
    });
    expect(mocks.setDocMock).not.toHaveBeenCalled();
  });

  it('saves user and chairman messages and clears errors on success', async () => {
    const { result } = renderHook(() => useContinueConversation('session-1'));

    await act(async () => {
      await result.current.sendMessage('Nowa wiadomoÅ›Ä‡', messages as never);
    });

    expect(mocks.docMock).toHaveBeenCalledTimes(2);
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(1, { id: 'user-msg-ref' }, expect.objectContaining({ order: 3, role: 'user' }));
    expect(mocks.httpsCallableMock).toHaveBeenCalledWith(mocks.functions, 'generateAdvisorResponse');
    const callable = mocks.httpsCallableMock.mock.results[0].value;
    expect(callable).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.stringContaining('[USER]: Nowa wiadomoÅ›Ä‡') }));
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(2, { id: 'chairman-msg-ref' }, expect.objectContaining({ order: 4, role: 'chairman', content: 'Chairman answer' }));
    expect(result.current.error).toBeNull();
    expect(result.current.isSending).toBe(false);
  });

  it('uses order 1 when there are no existing messages', async () => {
    const callable = vi.fn().mockResolvedValue({ data: { text: 'Chairman answer' } });
    mocks.httpsCallableMock.mockReturnValue(callable);
    mocks.docMock.mockReset();
    mocks.docMock
      .mockReturnValueOnce({ id: 'user-msg-ref' })
      .mockReturnValueOnce({ id: 'chairman-msg-ref' });

    const { result } = renderHook(() => useContinueConversation('session-1'));

    await act(async () => {
      await result.current.sendMessage('Start', [] as never);
    });

    expect(mocks.setDocMock).toHaveBeenNthCalledWith(1, { id: 'user-msg-ref' }, expect.objectContaining({ order: 1 }));
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(2, { id: 'chairman-msg-ref' }, expect.objectContaining({ order: 2 }));
  });

  it('handles rate limit errors', async () => {
    const callable = vi.fn().mockRejectedValue({ code: 'functions/resource-exhausted' });
    mocks.httpsCallableMock.mockReturnValue(callable);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useContinueConversation('session-1'));

    await act(async () => {
      await result.current.sendMessage('Limit', messages as never);
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalled();
    expect(result.current.error).toContain('limit zapyta');
    expect(result.current.isSending).toBe(false);
  });

  it('uses a fallback response when callable returns empty text', async () => {
    const callable = vi.fn().mockResolvedValue({ data: {} });
    mocks.httpsCallableMock.mockReturnValue(callable);
    mocks.docMock.mockReset();
    mocks.docMock
      .mockReturnValueOnce({ id: 'user-msg-ref' })
      .mockReturnValueOnce({ id: 'chairman-msg-ref' });

    const { result } = renderHook(() => useContinueConversation('session-1'));

    await act(async () => {
      await result.current.sendMessage('Fallback', messages as never);
    });

    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      2,
      { id: 'chairman-msg-ref' },
      expect.objectContaining({ content: 'Brak odpowiedzi.' }),
    );
    expect(result.current.error).toBeNull();
  });

  it('handles generic communication errors', async () => {
    const callable = vi.fn().mockRejectedValue({ message: 'Generic failure' });
    mocks.httpsCallableMock.mockReturnValue(callable);
    const { result } = renderHook(() => useContinueConversation('session-1'));

    await act(async () => {
      await result.current.sendMessage('Oops', messages as never);
    });

    expect(result.current.error).toBe('Generic failure');
    expect(result.current.isSending).toBe(false);
  });

  it('uses a fallback error message when the thrown error has no message', async () => {
    const callable = vi.fn().mockRejectedValue({});
    mocks.httpsCallableMock.mockReturnValue(callable);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useContinueConversation('session-1'));

    await act(async () => {
      await result.current.sendMessage('Oops', messages as never);
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current.error).toBe('Wystąpił błąd podczas komunikacji.');
    expect(result.current.isSending).toBe(false);
  });
});


