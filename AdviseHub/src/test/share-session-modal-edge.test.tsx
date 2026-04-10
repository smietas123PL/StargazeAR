import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useStateMock = vi.fn();
  const useEffectMock = vi.fn();
  const useAuthMock = vi.fn();
  const docMock = vi.fn();
  const updateDocMock = vi.fn();
  const toastSuccess = vi.fn();
  const toastError = vi.fn();
  const db = { name: 'db' };

  return {
    useStateMock,
    useEffectMock,
    useAuthMock,
    docMock,
    updateDocMock,
    toastSuccess,
    toastError,
    db,
  };
});

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    default: actual,
    useState: (...args: unknown[]) => mocks.useStateMock(...args),
    useEffect: (...args: unknown[]) => mocks.useEffectMock(...args),
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  doc: (...args: unknown[]) => mocks.docMock(...args),
  setDoc: vi.fn(),
  updateDoc: (...args: unknown[]) => mocks.updateDocMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

import { ShareSessionModal } from '../components/features/ShareSessionModal';

const session = {
  id: 'session-1',
  userId: 'owner-1',
  title: 'Sesja',
  question: 'Pytanie',
  status: 'completed',
  createdAt: 1,
  fileUrls: [],
};

describe('ShareSessionModal edge branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'owner-1', email: 'owner@example.com' } });
    mocks.useEffectMock.mockImplementation(() => undefined);
    mocks.docMock.mockReturnValue({ id: 'session-1' });
    mocks.updateDocMock.mockResolvedValue(undefined);

    let stateCall = 0;
    mocks.useStateMock.mockImplementation((initial: unknown) => {
      stateCall += 1;
      if (stateCall === 1) return ['', vi.fn()];
      if (stateCall === 2) return [false, vi.fn()];
      if (stateCall === 3) return [[], vi.fn()];
      if (stateCall === 4) {
        return [[{ uid: 'guest-1', email: 'guest@example.com' }], vi.fn()];
      }
      if (stateCall === 5) return [false, vi.fn()];
      return [initial, vi.fn()];
    });
  });

  it('falls back to an empty participants list when removing from a session without participants metadata', async () => {
    render(<ShareSessionModal session={session as never} onClose={() => undefined} />);

    fireEvent.click(screen.getByText(/Usuń/i));

    await waitFor(() => {
      expect(mocks.docMock).toHaveBeenCalledWith(mocks.db, 'sessions', 'session-1');
      expect(mocks.updateDocMock).toHaveBeenCalledWith({ id: 'session-1' }, { participants: [] });
    });
  });
});

