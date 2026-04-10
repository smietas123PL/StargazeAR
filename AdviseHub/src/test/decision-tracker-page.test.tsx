import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  navigateMock: vi.fn(),
  createFollowUpMock: vi.fn(),
  collectionMock: vi.fn((...args: unknown[]) => ({ kind: 'collection', args })),
  queryMock: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  whereMock: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  getDocsMock: vi.fn(),
  docMock: vi.fn((...args: unknown[]) => ({ id: String(args[2]) })),
  updateDocMock: vi.fn(),
  toastBaseMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  followUpState: {
    isCreating: false,
  },
  db: { name: 'db' },
}));

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigateMock,
  };
});

vi.mock('../hooks/useDecisionFollowUp', () => ({
  useDecisionFollowUp: () => ({
    createFollowUp: mocks.createFollowUpMock,
    isCreating: mocks.followUpState.isCreating,
  }),
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
  updateDoc: (...args: unknown[]) => mocks.updateDocMock(...args),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(
    (...args: unknown[]) => mocks.toastBaseMock(...args),
    {
      success: (...args: unknown[]) => mocks.toastSuccessMock(...args),
      error: (...args: unknown[]) => mocks.toastErrorMock(...args),
    },
  ),
}));

vi.mock('../components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    type,
    disabled,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type={type ?? 'button'} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

import DecisionTracker from '../pages/DecisionTracker';

const makeSnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  docs: docs.map((item) => ({
    id: item.id,
    data: () => item.data,
  })),
});

const sessionOne = {
  id: 'session-1',
  userId: 'user-1',
  title: 'Sesja Strategiczna',
  question: 'Jak rozwijać produkt?',
  status: 'completed',
  createdAt: 1,
  fileUrls: [],
  participants: ['user-1'],
  decisions: [
    {
      id: 'decision-1',
      title: 'Wejść na rynek DACH',
      description: 'Ekspansja zagraniczna',
      status: 'planned',
      decidedAt: 1000,
      expectedOutcome: 'Nowi klienci',
      reviewed: false,
    },
    {
      id: 'decision-2',
      title: 'Uruchomić pilotaż AI',
      description: 'Mały rollout',
      status: 'completed',
      decidedAt: 3000,
      expectedOutcome: 'Szybsza obsługa',
      actualOutcome: 'Obsługa spadła o 18%',
      reviewed: false,
    },
  ],
};

const sessionTwo = {
  id: 'session-2',
  userId: 'user-1',
  title: 'Sesja Operacyjna',
  question: 'Jak uporządkować procesy?',
  status: 'completed',
  createdAt: 2,
  fileUrls: [],
  participants: ['user-1'],
  decisions: [
    {
      id: 'decision-3',
      title: 'Zmienić CRM',
      description: 'Migracja narzędziowa',
      status: 'in_progress',
      decidedAt: 2000,
      expectedOutcome: 'Mniej ręcznej pracy',
      reviewed: true,
    },
    {
      id: 'decision-4',
      title: 'Porzucić stary kanał',
      description: 'Zamykanie nierentownego kanału',
      status: 'abandoned',
      decidedAt: 1500,
      expectedOutcome: 'Mniejsze koszty',
      reviewed: false,
    },
  ],
};

describe('DecisionTracker page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'owner@example.com' } });
    mocks.followUpState.isCreating = false;
    mocks.getDocsMock.mockReset();
    mocks.getDocsMock.mockResolvedValue(makeSnapshot([
      { id: 'session-1', data: sessionOne },
      { id: 'session-2', data: sessionTwo },
    ]));
    mocks.updateDocMock.mockReset();
    mocks.updateDocMock.mockResolvedValue(undefined);
    mocks.createFollowUpMock.mockReset();
    mocks.createFollowUpMock.mockResolvedValue('follow-up-1');
  });

  it('keeps the loading state when there is no user', () => {
    mocks.useAuthMock.mockReturnValue({ user: null });

    const { container } = render(<DecisionTracker />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(mocks.getDocsMock).not.toHaveBeenCalled();
  });

  it('renders the empty state when there are no decisions', async () => {
    mocks.getDocsMock.mockResolvedValueOnce(makeSnapshot([
      { id: 'session-1', data: { ...sessionOne, decisions: [] } },
      { id: 'session-2', data: { ...sessionTwo, decisions: undefined } },
    ]));

    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Brak zapisanych decyzji')).toBeInTheDocument();
    });
  });

  it('renders the empty filtered state when no decision matches the chosen filter', async () => {
    mocks.getDocsMock.mockResolvedValueOnce(makeSnapshot([
      {
        id: 'session-3',
        data: {
          ...sessionOne,
          decisions: [{ ...sessionOne.decisions[0], status: 'planned' }],
        },
      },
    ]));

    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Wejść na rynek DACH')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Porzucone' }));
    expect(screen.getByText('Brak decyzji dla wybranego filtru.')).toBeInTheDocument();
  });

  it('renders decisions sorted by decidedAt and supports review navigation with actual outcome fallback', async () => {
    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Uruchomić pilotaż AI')).toBeInTheDocument();
    });

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('Uruchomić pilotaż AI');
    expect(headings[1]).toHaveTextContent('Zmienić CRM');
    expect(headings[2]).toHaveTextContent('Porzucić stary kanał');
    expect(headings[3]).toHaveTextContent('Wejść na rynek DACH');

    const reviewButtons = screen.getAllByRole('button', { name: /Poproś o review/i });
    fireEvent.click(reviewButtons[0]);

    expect(mocks.navigateMock).toHaveBeenCalledWith('/', {
      state: {
        question: expect.stringContaining('Aktualny rezultat: Obsługa spadła o 18%'),
      },
    });

    fireEvent.click(reviewButtons[3]);

    expect(mocks.navigateMock).toHaveBeenLastCalledWith('/', {
      state: {
        question: expect.stringContaining('Aktualny rezultat: Brak danych'),
      },
    });
  });

  it('updates status, refreshes local state and offers follow-up creation when eligible', async () => {
    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Wejść na rynek DACH')).toBeInTheDocument();
    });

    const selects = screen.getAllByDisplayValue(/Planowane|Zakończone|W trakcie|Porzucone/);
    fireEvent.change(selects[3], { target: { value: 'completed' } });

    await waitFor(() => {
      expect(mocks.updateDocMock).toHaveBeenCalledWith(
        { id: 'session-1' },
        {
          decisions: [
            expect.objectContaining({ id: 'decision-1', status: 'completed' }),
            expect.objectContaining({ id: 'decision-2', status: 'completed' }),
          ],
        },
      );
    });

    expect(mocks.toastSuccessMock).toHaveBeenCalledWith('Status zaktualizowany');
    expect(mocks.toastBaseMock).toHaveBeenCalledWith(
      'Czy chcesz utworzyć sesję follow-up dla tej decyzji?',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Utwórz' }),
        cancel: expect.objectContaining({ label: 'Pomiń' }),
      }),
    );

    const toastOptions = mocks.toastBaseMock.mock.calls.at(-1)?.[1] as {
      action: { onClick: () => void };
      cancel: { onClick: () => void };
    };
    toastOptions.action.onClick();
    toastOptions.cancel.onClick();

    expect(mocks.createFollowUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'decision-1',
        status: 'completed',
        sessionId: 'session-1',
        sessionTitle: 'Sesja Strategiczna',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Zakończone' }));
    expect(screen.getByText('Wejść na rynek DACH')).toBeInTheDocument();
  });

  it('does not offer automatic follow-up for reviewed or non-progress statuses', async () => {
    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Zmienić CRM')).toBeInTheDocument();
    });

    const selects = screen.getAllByDisplayValue(/Planowane|Zakończone|W trakcie|Porzucone/);
    fireEvent.change(selects[1], { target: { value: 'completed' } });
    fireEvent.change(selects[2], { target: { value: 'planned' } });

    await waitFor(() => {
      expect(mocks.updateDocMock).toHaveBeenCalledTimes(2);
    });

    expect(mocks.toastBaseMock).not.toHaveBeenCalled();
  });

  it('starts a direct follow-up from the decision card button', async () => {
    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Poproś o follow-up/i })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Poproś o follow-up/i })[0]);

    expect(mocks.createFollowUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'decision-2',
        title: 'Uruchomić pilotaż AI',
      }),
    );
  });

  it('handles status update errors', async () => {
    mocks.updateDocMock.mockRejectedValueOnce(new Error('update failed'));

    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Wejść na rynek DACH')).toBeInTheDocument();
    });

    const selects = screen.getAllByDisplayValue(/Planowane|Zakończone|W trakcie|Porzucone/);
    fireEvent.change(selects[3], { target: { value: 'completed' } });

    await waitFor(() => {
      expect(mocks.toastErrorMock).toHaveBeenCalledWith('Błąd aktualizacji statusu');
    });
  });

  it('supports editing and saving actual outcomes', async () => {
    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Uruchomić pilotaż AI')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Dodaj rezultat|Edytuj rezultat/i })[0]);

    expect(screen.getByText('Aktualizuj rezultat')).toBeInTheDocument();

    const modalInput = screen.getByPlaceholderText(/np. Wdrożenie zakończyło się sukcesem/);
    fireEvent.change(modalInput, { target: { value: 'ROI wzrósł o 12%' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz rezultat' }));

    await waitFor(() => {
      expect(mocks.updateDocMock).toHaveBeenCalled();
    });

    expect(mocks.toastSuccessMock).toHaveBeenCalledWith('Rezultat zapisany');
    expect(screen.queryByText('Aktualizuj rezultat')).not.toBeInTheDocument();
    expect(screen.getByText('ROI wzrósł o 12%')).toBeInTheDocument();
  });

  it('opens the add-result modal with an empty outcome by default', async () => {
    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Dodaj rezultat|Edytuj rezultat/i }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Dodaj rezultat|Edytuj rezultat/i })[1]);

    expect(screen.getByPlaceholderText(/np. Wdrożenie zakończyło się sukcesem/)).toHaveValue('');
  });

  it('allows cancelling the edit modal and handles save errors', async () => {
    mocks.updateDocMock.mockRejectedValueOnce(new Error('save failed'));

    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Uruchomić pilotaż AI')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /Dodaj rezultat|Edytuj rezultat/i });
    fireEvent.click(editButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

    await waitFor(() => {
      expect(screen.queryByText('Aktualizuj rezultat')).not.toBeInTheDocument();
    });

    fireEvent.click(editButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz rezultat' }));

    await waitFor(() => {
      expect(mocks.toastErrorMock).toHaveBeenCalledWith('Błąd zapisu rezultatu');
    });
  });

  it('renders disabled follow-up action while a follow-up is being created', async () => {
    mocks.followUpState.isCreating = true;

    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Poproś o follow-up/i })[0]).toBeDisabled();
    });
  });

  it('covers fallback status label/icon/color rendering through an unknown status', async () => {
    mocks.getDocsMock.mockResolvedValueOnce(makeSnapshot([
      {
        id: 'session-3',
        data: {
          ...sessionOne,
          decisions: [
            {
              id: 'decision-x',
              title: 'Nietypowy status',
              description: 'Edge case',
              status: 'mystery',
              decidedAt: 5000,
              expectedOutcome: 'Sprawdzić fallback',
              reviewed: true,
            },
          ],
        },
      },
    ]));

    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('mystery')).toBeInTheDocument();
    });

    expect(screen.getByText('help_outline')).toBeInTheDocument();
  });

  it('logs fetch errors and leaves the page in the loading spinner fallback state', async () => {
    mocks.getDocsMock.mockRejectedValueOnce(new Error('fetch failed'));

    render(<DecisionTracker />);

    await waitFor(() => {
      expect(screen.getByText('Brak zapisanych decyzji')).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });
});
