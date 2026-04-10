import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useLocationMock: vi.fn(),
  createSessionMock: vi.fn(),
  createSessionState: {
    isCreating: false,
    error: null as string | null,
  },
  customAdvisorsState: {
    allAdvisors: [
      { id: 'advisor-1', namePl: 'Doradca 1' },
      { id: 'advisor-2', namePl: 'Doradca 2' },
      { id: 'advisor-3', namePl: 'Doradca 3' },
    ],
    loading: false,
  },
  userPlanState: {
    isPro: true,
    maxFreeSessions: 2,
    completedSessionsThisMonth: 0,
    checkFeatureAccess: vi.fn<(feature: string) => boolean>().mockImplementation(() => true),
  },
  documentUploadProps: [] as Array<Record<string, unknown>>,
  advisorSelectionProps: [] as Array<Record<string, unknown>>,
  upgradeModalProps: [] as Array<Record<string, unknown>>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => mocks.useLocationMock(),
  };
});

vi.mock('../hooks/useCreateSession', () => ({
  LAST_SELECTED_ADVISORS_KEY: 'last-selected-advisors',
  useCreateSession: () => ({
    createSession: mocks.createSessionMock,
    isCreating: mocks.createSessionState.isCreating,
    error: mocks.createSessionState.error,
  }),
}));

vi.mock('../hooks/useCustomAdvisors', () => ({
  useCustomAdvisors: () => ({
    allAdvisors: mocks.customAdvisorsState.allAdvisors,
    loading: mocks.customAdvisorsState.loading,
  }),
}));

vi.mock('../hooks/useUserPlan', () => ({
  useUserPlan: () => ({
    checkFeatureAccess: mocks.userPlanState.checkFeatureAccess,
    maxFreeSessions: mocks.userPlanState.maxFreeSessions,
    completedSessionsThisMonth: mocks.userPlanState.completedSessionsThisMonth,
    isPro: mocks.userPlanState.isPro,
  }),
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('../components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type={type ?? 'button'} data-disabled={disabled ? 'true' : 'false'} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../components/ui/textarea', () => ({
  Textarea: ({
    children,
    ...props
  }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props}>{children}</textarea>,
}));

vi.mock('../components/ui/card', () => ({
  Card: ({
    children,
    onClick,
    className,
  }: {
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    className?: string;
  }) => (
    <button type="button" className={className} onClick={() => onClick?.({} as never)}>
      {children}
    </button>
  ),
}));

vi.mock('../components/features/DocumentUpload', () => ({
  DocumentUpload: (props: Record<string, unknown>) => {
    mocks.documentUploadProps.push(props);
    const onChange = props.onChange as ((files: Array<Record<string, unknown>>) => void) | undefined;
    const onUpgradeRequest = props.onUpgradeRequest as (() => void) | undefined;
    return (
      <div>
        <div>{`DocumentUpload:${String(props.disabled)}`}</div>
        <button
          type="button"
          onClick={() => onChange?.([{ file: { name: 'brief.txt' }, extractedText: 'Zawartość dokumentu' }])}
        >
          AddDocument
        </button>
        <button type="button" onClick={() => onUpgradeRequest?.()}>
          RequestDocumentUpgrade
        </button>
      </div>
    );
  },
}));

vi.mock('../components/features/AdvisorSelectionCard', () => ({
  AdvisorSelectionCard: (props: Record<string, unknown>) => {
    mocks.advisorSelectionProps.push(props);
    const advisor = props.advisor as { id: string; namePl: string };
    const isSelected = Boolean(props.isSelected);
    const onClick = props.onClick as (() => void) | undefined;
    return (
      <button type="button" onClick={() => onClick?.()}>
        {`Advisor:${advisor.id}:${advisor.namePl}:${isSelected ? 'selected' : 'idle'}`}
      </button>
    );
  },
}));

vi.mock('../components/features/UpgradeModal', () => ({
  UpgradeModal: (props: Record<string, unknown>) => {
    mocks.upgradeModalProps.push(props);
    const onClose = props.onClose as (() => void) | undefined;
    if (!props.isOpen) return null;
    return (
      <div>
        <div>{`UpgradeModal:${String(props.featureName)}`}</div>
        <button type="button" onClick={() => onClose?.()}>
          CloseUpgrade
        </button>
      </div>
    );
  },
}));

import Home from '../pages/Home';

const getMainTextarea = () => screen.getByPlaceholderText('Opisz kontekst swojej decyzji...');

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.documentUploadProps.length = 0;
    mocks.advisorSelectionProps.length = 0;
    mocks.upgradeModalProps.length = 0;
    mocks.useLocationMock.mockReturnValue({ state: undefined });
    mocks.createSessionState.isCreating = false;
    mocks.createSessionState.error = null;
    mocks.customAdvisorsState.loading = false;
    mocks.customAdvisorsState.allAdvisors = [
      { id: 'advisor-1', namePl: 'Doradca 1' },
      { id: 'advisor-2', namePl: 'Doradca 2' },
      { id: 'advisor-3', namePl: 'Doradca 3' },
    ];
    mocks.userPlanState.isPro = true;
    mocks.userPlanState.maxFreeSessions = 2;
    mocks.userPlanState.completedSessionsThisMonth = 0;
    mocks.userPlanState.checkFeatureAccess.mockImplementation(() => true);
  });

  it('loads all advisors by default and lets the user pick an example question', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 3 z 3 doradców');
    });

    expect(screen.getByText('DocumentUpload:false')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Strategia rozwoju produktu'));

    expect(getMainTextarea()).toHaveValue('Strategia rozwoju produktu');
    expect(screen.getByText('Advisor:advisor-1:Doradca 1:selected')).toBeInTheDocument();
    expect(screen.getByText('Advisor:advisor-2:Doradca 2:selected')).toBeInTheDocument();
    expect(screen.getByText('Advisor:advisor-3:Doradca 3:selected')).toBeInTheDocument();
  });

  it('renders loading advisors plus creating and error states', () => {
    mocks.customAdvisorsState.loading = true;
    mocks.createSessionState.isCreating = true;
    mocks.createSessionState.error = 'create failed';

    render(<Home />);

    expect(screen.getByText(/Ładowanie doradców/)).toBeInTheDocument();
    expect(screen.getByText('Inicjalizacja...')).toBeInTheDocument();
    expect(getMainTextarea()).toBeDisabled();
    expect(screen.getByText('create failed')).toBeInTheDocument();
  });

  it('supports document upgrade gating for free users', async () => {
    mocks.userPlanState.isPro = false;
    mocks.userPlanState.checkFeatureAccess.mockImplementation((feature: string) => feature !== 'documents');

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('DocumentUpload:true')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'RequestDocumentUpgrade' }));

    expect(screen.getByText('UpgradeModal:Analiza własnych dokumentów')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'CloseUpgrade' }));

    await waitFor(() => {
      expect(screen.queryByText(/UpgradeModal:/)).not.toBeInTheDocument();
    });
  });

  it('shows the session limit banner and opens the upgrade modal from it', async () => {
    mocks.userPlanState.isPro = false;
    mocks.userPlanState.maxFreeSessions = 2;
    mocks.userPlanState.completedSessionsThisMonth = 2;

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Wykorzystano limit sesji')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Ulepsz konto do Pro/i }));

    expect(screen.getByText('UpgradeModal:Nielimitowana liczba sesji')).toBeInTheDocument();
  });

  it('shows the last free session notice for free users below the limit', async () => {
    mocks.userPlanState.isPro = false;
    mocks.userPlanState.maxFreeSessions = 2;
    mocks.userPlanState.completedSessionsThisMonth = 1;

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Ostatnia bezpłatna sesja/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Wykorzystano 1 z 2 bezpłatnych sesji/)).toBeInTheDocument();
  });

  it('restores a saved board and allows using the saved advisor subset', async () => {
    mocks.customAdvisorsState.allAdvisors = [
      { id: 'advisor-1', namePl: 'Doradca 1' },
      { id: 'advisor-2', namePl: 'Doradca 2' },
      { id: 'advisor-3', namePl: 'Doradca 3' },
      { id: 'advisor-4', namePl: 'Doradca 4' },
    ];
    localStorage.setItem('last-selected-advisors', JSON.stringify(['advisor-1', 'advisor-3', 'advisor-4']));

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Użyj ostatniej rady/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 4 z 4 doradców');

    fireEvent.click(screen.getByRole('button', { name: /Użyj ostatniej rady/i }));

    expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 3 z 4 doradców');
    expect(screen.getByText('Advisor:advisor-2:Doradca 2:idle')).toBeInTheDocument();
  });

  it('falls back safely when the saved board is malformed', async () => {
    localStorage.setItem('last-selected-advisors', '{not-json');

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 3 z 3 doradców');
    });

    expect(screen.queryByRole('button', { name: /Użyj ostatniej rady/i })).not.toBeInTheDocument();
  });

  it('keeps explicit location state values, including an empty selected board', async () => {
    mocks.useLocationMock.mockReturnValue({
      state: { question: 'Pytanie z routera', selectedAdvisors: [] },
    });

    render(<Home />);

    await waitFor(() => {
      expect(getMainTextarea()).toHaveValue('Pytanie z routera');
    });

    expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 0 z 3 doradców');
    expect(screen.getByText('Rozpocznij Sesję Doradczą')).toHaveAttribute('data-disabled', 'true');
  });

  it('preserves a non-empty board passed through location state', async () => {
    mocks.customAdvisorsState.allAdvisors = [
      { id: 'advisor-1', namePl: 'Doradca 1' },
      { id: 'advisor-2', namePl: 'Doradca 2' },
      { id: 'advisor-3', namePl: 'Doradca 3' },
      { id: 'advisor-4', namePl: 'Doradca 4' },
    ];
    mocks.useLocationMock.mockReturnValue({
      state: { question: 'Board z routera', selectedAdvisors: ['advisor-2', 'advisor-4'] },
    });

    render(<Home />);

    await waitFor(() => {
      expect(getMainTextarea()).toHaveValue('Board z routera');
    });

    expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 2 z 4 doradców');
    expect(screen.getByText('Advisor:advisor-2:Doradca 2:selected')).toBeInTheDocument();
    expect(screen.getByText('Advisor:advisor-4:Doradca 4:selected')).toBeInTheDocument();
    expect(screen.getByText('Advisor:advisor-1:Doradca 1:idle')).toBeInTheDocument();
  });

  it('toggles advisors and keeps the wizard closed when fewer than three remain', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 3 z 3 doradców');
    });

    fireEvent.click(screen.getByText('Advisor:advisor-3:Doradca 3:selected'));

    expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 2 z 3 doradców');

    fireEvent.click(screen.getByText('Rozpocznij Sesję Doradczą'));

    expect(screen.queryByText(/Krok 1 z 3/)).not.toBeInTheDocument();
    expect(mocks.createSessionMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Advisor:advisor-3:Doradca 3:idle'));

    expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 3 z 3 doradców');
  });

  it('opens the upgrade modal when unlimited sessions are unavailable', async () => {
    mocks.userPlanState.isPro = false;
    mocks.userPlanState.checkFeatureAccess.mockImplementation((feature: string) => feature !== 'unlimitedSessions');

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 3 z 3 doradców');
    });

    fireEvent.change(getMainTextarea(), { target: { value: 'Jaką decyzję podjąć?' } });
    fireEvent.click(screen.getByText('Rozpocznij Sesję Doradczą'));

    expect(screen.getByText('UpgradeModal:Nielimitowana liczba sesji')).toBeInTheDocument();
  });

  it('runs the wizard next flow and creates a session with attached files', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 3 z 3 doradców');
    });

    fireEvent.change(getMainTextarea(), { target: { value: 'Czy wejść na nowy rynek?' } });
    fireEvent.click(screen.getByRole('button', { name: 'AddDocument' }));
    fireEvent.click(screen.getByText('Rozpocznij Sesję Doradczą'));

    expect(screen.getByText(/Krok 1 z 3/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Mój główny cel to...'), { target: { value: 'a'.repeat(350) } });
    expect(screen.getByPlaceholderText('Mój główny cel to...')).toHaveValue('a'.repeat(300));

    fireEvent.click(screen.getByText('Dalej'));
    fireEvent.change(screen.getByPlaceholderText('Obecnie wiem, że...'), { target: { value: 'Mamy pierwsze dane z rynku.' } });
    fireEvent.click(screen.getByText('Dalej'));
    fireEvent.change(screen.getByPlaceholderText('Blokuje mnie...'), { target: { value: 'Ryzyko wejścia i koszty.' } });
    fireEvent.click(screen.getByText('Zakończ i wyślij'));

    await waitFor(() => {
      expect(mocks.createSessionMock).toHaveBeenCalledTimes(1);
    });

    expect(mocks.createSessionMock).toHaveBeenCalledWith(
      `Czy wejść na nowy rynek?\n\n--- Dodatkowy kontekst ---\nCel: ${'a'.repeat(300)}\nObecna wiedza: Mamy pierwsze dane z rynku.\nBlokery: Ryzyko wejścia i koszty.`,
      [{ file: { name: 'brief.txt' }, extractedText: 'Zawartość dokumentu' }],
      ['advisor-1', 'advisor-2', 'advisor-3'],
    );
  });

  it('supports closing the wizard and the full skip flow with fallbacks', async () => {
    fireEvent.change = fireEvent.change; // keep TS happy in some editors
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 3 z 3 doradców');
    });

    fireEvent.change(getMainTextarea(), { target: { value: 'Czy zmienić model biznesowy?' } });
    fireEvent.click(screen.getByText('Rozpocznij Sesję Doradczą'));

    fireEvent.click(screen.getByText('close'));
    await waitFor(() => {
      expect(screen.queryByText(/Krok 1 z 3/)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rozpocznij Sesję Doradczą'));
    fireEvent.click(screen.getByText('Pomiń ten krok'));
    fireEvent.click(screen.getByText('Pomiń ten krok'));
    fireEvent.click(screen.getByText('Pomiń ten krok'));

    await waitFor(() => {
      expect(mocks.createSessionMock).toHaveBeenCalledWith(
        'Czy zmienić model biznesowy?\n\n--- Dodatkowy kontekst ---\nCel: Nie podano\nObecna wiedza: Nie podano\nBlokery: Nie podano',
        [],
        ['advisor-1', 'advisor-2', 'advisor-3'],
      );
    });
  });

  it('leaves the current selection unchanged when the saved board becomes too small', async () => {
    mocks.customAdvisorsState.allAdvisors = [
      { id: 'advisor-1', namePl: 'Doradca 1' },
      { id: 'advisor-2', namePl: 'Doradca 2' },
      { id: 'advisor-3', namePl: 'Doradca 3' },
      { id: 'advisor-4', namePl: 'Doradca 4' },
    ];
    localStorage.setItem('last-selected-advisors', JSON.stringify(['advisor-1', 'advisor-2', 'advisor-3']));

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Użyj ostatniej rady/i })).toBeInTheDocument();
    });

    localStorage.setItem('last-selected-advisors', JSON.stringify(['advisor-1', 'advisor-2']));
    fireEvent.click(screen.getByRole('button', { name: /Użyj ostatniej rady/i }));

    expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 4 z 4 doradców');
  });

  it('leaves the current selection unchanged when no saved board is available on click', async () => {
    mocks.customAdvisorsState.allAdvisors = [
      { id: 'advisor-1', namePl: 'Doradca 1' },
      { id: 'advisor-2', namePl: 'Doradca 2' },
      { id: 'advisor-3', namePl: 'Doradca 3' },
      { id: 'advisor-4', namePl: 'Doradca 4' },
    ];
    localStorage.setItem('last-selected-advisors', JSON.stringify(['advisor-1', 'advisor-2', 'advisor-3']));

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Użyj ostatniej rady/i })).toBeInTheDocument();
    });

    localStorage.removeItem('last-selected-advisors');
    fireEvent.click(screen.getByRole('button', { name: /Użyj ostatniej rady/i }));

    expect(screen.getByText(/Wybrano/)).toHaveTextContent('Wybrano 4 z 4 doradców');
  });
});
