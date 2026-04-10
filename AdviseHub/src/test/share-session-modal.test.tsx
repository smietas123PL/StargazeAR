import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const collectionMock = vi.fn((...args: unknown[]) => ({ kind: 'collection', args }));
  const queryMock = vi.fn((...args: unknown[]) => ({ kind: 'query', args }));
  const whereMock = vi.fn((...args: unknown[]) => ({ kind: 'where', args }));
  const getDocsMock = vi.fn();
  const docMock = vi.fn();
  const setDocMock = vi.fn();
  const updateDocMock = vi.fn();
  const toastSuccess = vi.fn();
  const toastError = vi.fn();
  const db = { name: 'db' };

  return {
    useAuthMock,
    collectionMock,
    queryMock,
    whereMock,
    getDocsMock,
    docMock,
    setDocMock,
    updateDocMock,
    toastSuccess,
    toastError,
    db,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../lib/firebase', () => ({
  db: mocks.db,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mocks.collectionMock(...args),
  query: (...args: unknown[]) => mocks.queryMock(...args),
  where: (...args: unknown[]) => mocks.whereMock(...args),
  getDocs: (...args: unknown[]) => mocks.getDocsMock(...args),
  doc: (...args: unknown[]) => mocks.docMock(...args),
  setDoc: (...args: unknown[]) => mocks.setDocMock(...args),
  updateDoc: (...args: unknown[]) => mocks.updateDocMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

import { ShareSessionModal } from '../components/features/ShareSessionModal';

const makeSnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  empty: docs.length === 0,
  docs: docs.map((doc) => ({ id: doc.id, data: () => doc.data })),
});

const makeQueryDrivenGetDocs = (responses: Record<string, ReturnType<typeof makeSnapshot>>) => {
  return async (request: { args: Array<{ args?: unknown[] }> }) => {
    const collectionArg = request.args[0] as { args?: unknown[] };
    const path = String(collectionArg.args?.[1] ?? '');
    const conditions = request.args
      .slice(1)
      .map((clause) => (clause as { args?: unknown[] }).args ?? []);
    const uidCondition = conditions.find(([field]) => field === 'uid');
    const emailCondition = conditions.find(([field]) => field === 'email');
    const sessionCondition = conditions.find(([field]) => field === 'sessionId');

    if (path === 'invitations' && sessionCondition) {
      return responses.invitations ?? makeSnapshot([]);
    }
    if (path === 'users' && uidCondition) {
      return responses[`uid:${uidCondition[2]}`] ?? makeSnapshot([]);
    }
    if (path === 'users' && emailCondition) {
      return responses[`email:${emailCondition[2]}`] ?? makeSnapshot([]);
    }
    return makeSnapshot([]);
  };
};

const baseSession = {
  id: 'session-1',
  userId: 'owner-1',
  title: 'Sesja',
  question: 'Pytanie',
  status: 'completed',
  createdAt: 1,
  fileUrls: [],
  participants: ['owner-1', 'guest-1'],
};

describe('ShareSessionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'owner-1', email: 'owner@example.com' } });
    mocks.docMock.mockImplementation((...args: unknown[]) => {
      if (args.length === 1) return { id: 'generated-invitation' };
      return { id: String(args[2]) };
    });
    mocks.setDocMock.mockResolvedValue(undefined);
    mocks.updateDocMock.mockResolvedValue(undefined);
  });

  it('loads participants and invitations and allows closing the modal', async () => {
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([
          { id: 'inv-1', data: { invitedEmail: 'pending@example.com', status: 'pending', sessionId: 'session-1', invitedBy: 'owner@example.com', createdAt: 1 } },
          { id: 'inv-2', data: { invitedEmail: 'accepted@example.com', status: 'accepted', sessionId: 'session-1', invitedBy: 'owner@example.com', createdAt: 2 } },
        ]),
        'uid:owner-1': makeSnapshot([
          { id: 'profile-owner', data: { uid: 'owner-1', email: 'owner@example.com', displayName: 'Owner' } },
        ]),
        'uid:guest-1': makeSnapshot([
          { id: 'profile-guest', data: { uid: 'guest-1', email: 'guest@example.com', displayName: 'Guest' } },
        ]),
      }),
    );

    const onClose = vi.fn();
    render(<ShareSessionModal session={baseSession as never} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    expect(screen.getByText('accepted@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Właściciel/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Usuń/i)).toHaveLength(1);
    expect(screen.getAllByText(/Anuluj/i)).toHaveLength(1);

    fireEvent.click(screen.getByText('close').closest('button') as HTMLButtonElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles fetch failures and still leaves the modal interactive', async () => {
    mocks.getDocsMock.mockRejectedValueOnce(new Error('fetch failed'));

    render(<ShareSessionModal session={{ ...baseSession, participants: [] } as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });

  it('blocks self-invites and duplicate pending invites', async () => {
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([
          { id: 'inv-1', data: { invitedEmail: 'duplicate@example.com', status: 'pending', sessionId: 'session-1', invitedBy: 'owner@example.com', createdAt: 1 } },
        ]),
      }),
    );

    render(<ShareSessionModal session={{ ...baseSession, participants: [] } as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'owner@example.com' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(mocks.toastError).toHaveBeenCalled();
    expect(mocks.setDocMock).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'duplicate@example.com' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(mocks.toastError).toHaveBeenCalledTimes(2);
    expect(mocks.setDocMock).not.toHaveBeenCalled();
  });

  it('blocks inviting an existing participant and supports successful invites', async () => {
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([]),
        'uid:owner-1': makeSnapshot([
          { id: 'profile-owner', data: { uid: 'owner-1', email: 'owner@example.com', displayName: 'Owner' } },
        ]),
        'uid:guest-1': makeSnapshot([
          { id: 'profile-guest', data: { uid: 'guest-1', email: 'guest@example.com', displayName: 'Guest' } },
        ]),
        'email:guest@example.com': makeSnapshot([
          { id: 'user-existing', data: { uid: 'guest-1', email: 'guest@example.com' } },
        ]),
        'email:new@example.com': makeSnapshot([
          { id: 'user-new', data: { uid: 'guest-2', email: 'new@example.com' } },
        ]),
      }),
    );

    render(<ShareSessionModal session={baseSession as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'guest@example.com' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalled();
    });
    expect(mocks.setDocMock).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(mocks.setDocMock).toHaveBeenCalledTimes(1);
    });

    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'generated-invitation' },
      expect.objectContaining({
        id: 'generated-invitation',
        invitedBy: 'owner@example.com',
        invitedEmail: 'new@example.com',
        invitedUserId: 'guest-2',
        status: 'pending',
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalled();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
    expect(screen.getByText('new@example.com')).toBeInTheDocument();
  });

  it('uses the user uid as invitedBy fallback when email is missing', async () => {
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'owner-1', email: '' } });
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([]),
      }),
    );

    render(<ShareSessionModal session={{ ...baseSession, participants: [] } as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(mocks.setDocMock).toHaveBeenCalledTimes(1);
    });

    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { id: 'generated-invitation' },
      expect.objectContaining({
        invitedBy: 'owner-1',
        invitedEmail: 'new@example.com',
        invitedUserId: undefined,
      }),
    );
  });

  it('shows an error toast when sending an invite fails', async () => {
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([]),
      }),
    );
    mocks.setDocMock.mockRejectedValueOnce(new Error('invite failed'));

    render(<ShareSessionModal session={{ ...baseSession, participants: [] } as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalled();
    });
    expect(console.error).toHaveBeenCalled();
  });

  it('skips missing participant profiles and returns early when inviting without a user', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([]),
        'uid:ghost-user': makeSnapshot([]),
      }),
    );

    render(<ShareSessionModal session={{ ...baseSession, participants: ['ghost-user'] } as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText(/Uczestnicy/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('ghost-user')).not.toBeInTheDocument();

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'nobody@example.com' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(mocks.setDocMock).not.toHaveBeenCalled();
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('renders participant email fallback, declined invitations and ignores removal when user is missing', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([
          { id: 'inv-declined', data: { invitedEmail: 'declined@example.com', status: 'declined', sessionId: 'session-1', invitedBy: 'owner@example.com', createdAt: 1 } },
        ]),
        'uid:guest-1': makeSnapshot([
          { id: 'profile-guest', data: { uid: 'guest-1', email: 'guest@example.com' } },
        ]),
      }),
    );

    render(<ShareSessionModal session={{ ...baseSession, participants: ['guest-1'] } as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText('guest@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText(/Odrzucone/i)).toBeInTheDocument();
    expect(screen.queryByText(/Anuluj/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Usuń/i));
    expect(mocks.updateDocMock).not.toHaveBeenCalled();
  });

  it('removes participants and invitations on success', async () => {
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([
          { id: 'inv-1', data: { invitedEmail: 'pending@example.com', status: 'pending', sessionId: 'session-1', invitedBy: 'owner@example.com', createdAt: 1 } },
        ]),
        'uid:owner-1': makeSnapshot([
          { id: 'profile-owner', data: { uid: 'owner-1', email: 'owner@example.com', displayName: 'Owner' } },
        ]),
        'uid:guest-1': makeSnapshot([
          { id: 'profile-guest', data: { uid: 'guest-1', email: 'guest@example.com', displayName: 'Guest' } },
        ]),
      }),
    );

    render(<ShareSessionModal session={baseSession as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Usuń/i));

    await waitFor(() => {
      expect(mocks.updateDocMock).toHaveBeenCalledWith({ id: 'session-1' }, { participants: ['owner-1'] });
    });
    expect(mocks.toastSuccess).toHaveBeenCalled();
    expect(screen.queryByText('Guest')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Anuluj/i));

    await waitFor(() => {
      expect(mocks.updateDocMock).toHaveBeenCalledWith({ id: 'inv-1' }, { status: 'declined' });
    });
    expect(screen.queryByText('pending@example.com')).not.toBeInTheDocument();
  });

  it('surfaces update errors while removing participants and invitations', async () => {
    mocks.getDocsMock.mockImplementation(
      makeQueryDrivenGetDocs({
        invitations: makeSnapshot([
          { id: 'inv-1', data: { invitedEmail: 'pending@example.com', status: 'pending', sessionId: 'session-1', invitedBy: 'owner@example.com', createdAt: 1 } },
        ]),
        'uid:owner-1': makeSnapshot([
          { id: 'profile-owner', data: { uid: 'owner-1', email: 'owner@example.com', displayName: 'Owner' } },
        ]),
        'uid:guest-1': makeSnapshot([
          { id: 'profile-guest', data: { uid: 'guest-1', email: 'guest@example.com', displayName: 'Guest' } },
        ]),
      }),
    );
    mocks.updateDocMock
      .mockRejectedValueOnce(new Error('remove participant failed'))
      .mockRejectedValueOnce(new Error('remove invitation failed'));

    render(<ShareSessionModal session={baseSession as never} onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Usuń/i));
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText(/Anuluj/i));
    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledTimes(2);
    });
    expect(console.error).toHaveBeenCalled();
  });
});


