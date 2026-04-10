import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const useUserSessionsMock = vi.fn();
  const updateProfileMock = vi.fn();
  const docMock = vi.fn();
  const updateDocMock = vi.fn();
  const generateContentMock = vi.fn();
  const googleCtorSpy = vi.fn();
  const toastSuccess = vi.fn();
  const toastWarning = vi.fn();
  const toastError = vi.fn();
  const auth = {
    currentUser: { uid: 'user-1' },
  };
  const db = { name: 'db' };

  class GoogleGenAIMock {
    models = {
      generateContent: generateContentMock,
    };

    constructor(config: unknown) {
      googleCtorSpy(config);
    }
  }

  return {
    useAuthMock,
    useUserSessionsMock,
    updateProfileMock,
    docMock,
    updateDocMock,
    generateContentMock,
    googleCtorSpy,
    toastSuccess,
    toastWarning,
    toastError,
    auth,
    db,
    GoogleGenAIMock,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../hooks/useUserSessions', () => ({
  useUserSessions: () => mocks.useUserSessionsMock(),
}));

vi.mock('firebase/auth', () => ({
  updateProfile: (...args: unknown[]) => mocks.updateProfileMock(...args),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mocks.docMock(...args),
  updateDoc: (...args: unknown[]) => mocks.updateDocMock(...args),
}));

vi.mock('../lib/firebase', () => ({
  auth: mocks.auth,
  db: mocks.db,
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: mocks.GoogleGenAIMock,
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    warning: (...args: unknown[]) => mocks.toastWarning(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

import { DEFAULT_PROMPTS, getAdvisorSystemPrompt, useAdvisors } from '../hooks/useAdvisors';
import { useSettings } from '../hooks/useSettings';
import { useUserPlan } from '../hooks/useUserPlan';

describe('useAdvisors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('returns saved advisor prompts when present', () => {
    localStorage.setItem('advisehub_advisors_prompts', JSON.stringify({ contrarian: 'Custom prompt' }));

    expect(getAdvisorSystemPrompt('contrarian')).toBe('Custom prompt');
  });

  it('falls back to default prompts when storage exists without the requested role', () => {
    localStorage.setItem('advisehub_advisors_prompts', JSON.stringify({ outsider: 'Other prompt' }));

    expect(getAdvisorSystemPrompt('executor')).toBe(DEFAULT_PROMPTS.executor);
  });

  it('returns an empty string for unknown roles and falls back when nothing is stored', () => {
    expect(getAdvisorSystemPrompt('unknown_role')).toBe('');
    expect(getAdvisorSystemPrompt('contrarian')).toBe(DEFAULT_PROMPTS.contrarian);
  });

  it('falls back to default prompts and logs parse errors for invalid storage', () => {
    localStorage.setItem('advisehub_advisors_prompts', '{invalid-json');

    expect(getAdvisorSystemPrompt('executor')).toBe(DEFAULT_PROMPTS.executor);
    expect(console.error).toHaveBeenCalled();
  });

  it('keeps default prompts when there is no saved storage in the hook', async () => {
    const { result } = renderHook(() => useAdvisors());

    await waitFor(() => {
      expect(result.current.prompts.contrarian).toBe(DEFAULT_PROMPTS.contrarian);
    });
  });

  it('loads prompts from localStorage and supports update, save and reset', async () => {
    localStorage.setItem('advisehub_advisors_prompts', JSON.stringify({ contrarian: 'Custom contrarian' }));

    const { result } = renderHook(() => useAdvisors());

    await waitFor(() => {
      expect(result.current.prompts.contrarian).toBe('Custom contrarian');
    });
    expect(result.current.prompts.executor).toBe(DEFAULT_PROMPTS.executor);

    act(() => {
      result.current.updatePrompt('executor', 'Nowy prompt');
    });
    expect(result.current.prompts.executor).toBe('Nowy prompt');

    act(() => {
      result.current.savePrompts();
    });
    expect(localStorage.getItem('advisehub_advisors_prompts')).toContain('Nowy prompt');

    act(() => {
      result.current.resetToDefault('executor');
    });
    expect(result.current.prompts.executor).toBe(DEFAULT_PROMPTS.executor);
    expect(localStorage.getItem('advisehub_advisors_prompts')).toContain(DEFAULT_PROMPTS.executor ?? '');
  });

  it('keeps defaults when saved prompts in the hook are invalid', async () => {
    localStorage.setItem('advisehub_advisors_prompts', '{broken-json');

    const { result } = renderHook(() => useAdvisors());

    await waitFor(() => {
      expect(result.current.prompts.contrarian).toBe(DEFAULT_PROMPTS.contrarian);
    });
    expect(console.error).toHaveBeenCalled();
  });
});

describe('useUserPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthMock.mockReturnValue({ profile: null });
    mocks.useUserSessionsMock.mockReturnValue({ sessions: [] });
  });

  it('returns free plan limits and blocks premium-only features', () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 5).getTime();

    mocks.useUserSessionsMock.mockReturnValue({
      sessions: [
        { status: 'completed', createdAt: currentMonth },
      ],
    });

    const { result } = renderHook(() => useUserPlan());

    expect(result.current.plan).toBe('free');
    expect(result.current.isPro).toBe(false);
    expect(result.current.completedSessionsThisMonth).toBe(1);
    expect(result.current.maxFreeSessions).toBe(2);
    expect(result.current.rateLimit).toBe(20);
    expect(result.current.checkFeatureAccess('documents')).toBe(false);
    expect(result.current.checkFeatureAccess('customAdvisors')).toBe(false);
    expect(result.current.checkFeatureAccess('unlimitedSessions')).toBe(true);
  });

  it('blocks unlimited sessions for free users after reaching the limit', () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 3).getTime();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 20).getTime();

    mocks.useUserSessionsMock.mockReturnValue({
      sessions: [
        { status: 'completed', createdAt: currentMonth },
        { status: 'completed', createdAt: currentMonth + 1 },
        { status: 'draft', createdAt: currentMonth + 2 },
        { status: 'completed', createdAt: previousMonth },
      ],
    });

    const { result } = renderHook(() => useUserPlan());

    expect(result.current.completedSessionsThisMonth).toBe(2);
    expect(result.current.checkFeatureAccess('unlimitedSessions')).toBe(false);
  });

  it('grants pro access for premium and pro plans', () => {
    mocks.useAuthMock.mockReturnValue({ profile: { plan: 'premium' } });

    const premiumHook = renderHook(() => useUserPlan());
    expect(premiumHook.result.current.isPro).toBe(true);
    expect(premiumHook.result.current.rateLimit).toBe(150);
    expect(premiumHook.result.current.checkFeatureAccess('documents')).toBe(true);

    mocks.useAuthMock.mockReturnValue({ profile: { plan: 'pro' } });
    const proHook = renderHook(() => useUserPlan());
    expect(proHook.result.current.isPro).toBe(true);
    expect(proHook.result.current.checkFeatureAccess('customAdvisors')).toBe(true);
  });

  it('falls back to false for unexpected feature keys at runtime', () => {
    const { result } = renderHook(() => useUserPlan());

    expect(result.current.checkFeatureAccess('unknown' as never)).toBe(false);
  });
});

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.auth.currentUser = { uid: 'user-1' };
    mocks.useAuthMock.mockReturnValue({
      profile: {
        uid: 'user-1',
        displayName: 'Ada',
      },
    });
    mocks.docMock.mockReturnValue({ ref: 'user-ref' });
    mocks.updateProfileMock.mockResolvedValue(undefined);
    mocks.updateDocMock.mockResolvedValue(undefined);
    mocks.generateContentMock.mockResolvedValue({ text: 'Sukces' });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('initializes from storage and updates local settings', async () => {
    localStorage.setItem('advisehub_gemini_api_key', 'stored-key');
    localStorage.setItem('advisehub_gemini_model', 'stored-model');

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.geminiKey).toBe('stored-key');
    });
    expect(result.current.geminiModel).toBe('stored-model');
    expect(result.current.displayName).toBe('Ada');

    act(() => {
      result.current.saveGeminiKey('new-key');
      result.current.saveGeminiModel('new-model');
      result.current.setDisplayName('Grace');
    });

    expect(localStorage.getItem('advisehub_gemini_api_key')).toBe('new-key');
    expect(localStorage.getItem('advisehub_gemini_model')).toBe('new-model');
    expect(result.current.displayName).toBe('Grace');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Zmieniono model AI', { description: 'Wybrano model: new-model' });
  });

  it('validates missing Gemini key before testing the connection', async () => {
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.testConnection();
    });

    expect(mocks.toastError).toHaveBeenCalledWith('Wprowadź klucz API przed testowaniem.');
    expect(result.current.isTesting).toBe(false);
  });

  it('handles successful Gemini connection tests', async () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.saveGeminiKey('gem-key');
      result.current.saveGeminiModel('gem-model');
    });

    await act(async () => {
      await result.current.testConnection();
    });

    expect(mocks.googleCtorSpy).toHaveBeenCalledWith({ apiKey: 'gem-key' });
    expect(mocks.generateContentMock).toHaveBeenCalledWith({
      model: 'gem-model',
      contents: 'Odpowiedz dokładnie jednym słowem: "Sukces".',
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Połączenie nawiązane pomyślnie!');
    expect(result.current.isTesting).toBe(false);
  });

  it('shows warning and error toasts for unexpected or failed Gemini tests', async () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.saveGeminiKey('gem-key');
    });

    mocks.generateContentMock.mockResolvedValueOnce({ text: 'Inna odpowiedź' });
    await act(async () => {
      await result.current.testConnection();
    });
    expect(mocks.toastWarning).toHaveBeenCalled();

    mocks.generateContentMock.mockRejectedValueOnce({});
    await act(async () => {
      await result.current.testConnection();
    });
    expect(console.error).toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('Błąd połączenia z API Gemini. Sprawdź klucz.');
  });

  it('returns early from profile updates when auth or profile is missing', async () => {
    mocks.auth.currentUser = null;
    mocks.useAuthMock.mockReturnValue({ profile: null });

    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.updateDisplayName();
    });

    expect(mocks.updateProfileMock).not.toHaveBeenCalled();
    expect(mocks.updateDocMock).not.toHaveBeenCalled();
    expect(result.current.isSavingProfile).toBe(false);
  });

  it('updates the display name in auth and firestore', async () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setDisplayName('Grace Hopper');
    });

    await act(async () => {
      await result.current.updateDisplayName();
    });

    expect(mocks.updateProfileMock).toHaveBeenCalledWith(mocks.auth.currentUser, { displayName: 'Grace Hopper' });
    expect(mocks.docMock).toHaveBeenCalledWith(mocks.db, 'users', 'user-1');
    expect(mocks.updateDocMock).toHaveBeenCalledWith({ ref: 'user-ref' }, { displayName: 'Grace Hopper' });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Profil został zaktualizowany.');
    expect(result.current.isSavingProfile).toBe(false);
  });

  it('handles profile update errors', async () => {
    mocks.updateProfileMock.mockRejectedValueOnce(new Error('save failed'));

    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.updateDisplayName();
    });

    expect(console.error).toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('Wystąpił błąd podczas aktualizacji profilu.');
    expect(result.current.isSavingProfile).toBe(false);
  });
});
