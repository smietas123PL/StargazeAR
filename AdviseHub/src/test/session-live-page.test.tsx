import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useParamsMock: vi.fn(),
  navigateMock: vi.fn(),
  useAuthMock: vi.fn(),
  useSessionMock: vi.fn(),
  runCouncilMock: vi.fn(),
  runPeerReviewMock: vi.fn(),
  runChairmanMock: vi.fn(),
  sendMessageMock: vi.fn(),
  peerReviewHookArgs: [] as Array<unknown>,
  chairmanHookArgs: [] as Array<unknown>,
  continueHookArgs: [] as Array<unknown>,
  runCouncilState: {
    isRunning: false,
    progress: { completed: 0, total: 1, current: 'Idle' },
    error: null as string | null,
  },
  runPeerReviewState: {
    isRunning: false,
  },
  runChairmanState: {
    isRunning: false,
  },
  continueConversationState: {
    isSending: false,
  },
  getDocMock: vi.fn(),
  docMock: vi.fn((...args: unknown[]) => ({ id: String(args[2]) })),
  toastInfoMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  advisorCardProps: [] as Array<Record<string, unknown>>,
  messageBubbleProps: [] as Array<Record<string, unknown>>,
  advisorPillProps: [] as Array<Record<string, unknown>>,
  exportPdfProps: [] as Array<Record<string, unknown>>,
  shareModalProps: [] as Array<Record<string, unknown>>,
  scrollIntoViewMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => mocks.useParamsMock(),
    useNavigate: () => mocks.navigateMock,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../hooks/useSession', () => ({
  useSession: (...args: unknown[]) => mocks.useSessionMock(...args),
}));

vi.mock('../hooks/useRunCouncil', () => ({
  useRunCouncil: () => ({
    runCouncil: mocks.runCouncilMock,
    isRunning: mocks.runCouncilState.isRunning,
    progress: mocks.runCouncilState.progress,
    error: mocks.runCouncilState.error,
  }),
}));

vi.mock('../hooks/useRunPeerReview', () => ({
  useRunPeerReview: (sessionId: string) => {
    mocks.peerReviewHookArgs.push(sessionId);
    return {
      runPeerReview: mocks.runPeerReviewMock,
      isRunning: mocks.runPeerReviewState.isRunning,
    };
  },
}));

vi.mock('../hooks/useRunChairman', () => ({
  useRunChairman: (sessionId: string) => {
    mocks.chairmanHookArgs.push(sessionId);
    return {
      runChairman: mocks.runChairmanMock,
      isRunning: mocks.runChairmanState.isRunning,
    };
  },
}));

vi.mock('../hooks/useContinueConversation', () => ({
  useContinueConversation: (sessionId: string) => {
    mocks.continueHookArgs.push(sessionId);
    return {
      sendMessage: mocks.sendMessageMock,
      isSending: mocks.continueConversationState.isSending,
    };
  },
}));

vi.mock('../hooks/useCustomAdvisors', () => ({
  useCustomAdvisors: () => ({
    allAdvisors: [
      { id: 'advisor-1', namePl: 'Doradca 1', role: 'contrarian' },
      { id: 'advisor-2', namePl: 'Doradca 2', role: 'executor' },
    ],
  }),
}));

vi.mock('../lib/firebase', () => ({
  db: { name: 'db' },
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mocks.docMock(...args),
  getDoc: (...args: unknown[]) => mocks.getDocMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    info: (...args: unknown[]) => mocks.toastInfoMock(...args),
    success: (...args: unknown[]) => mocks.toastSuccessMock(...args),
  },
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('../components/features/AdvisorCard', () => ({
  AdvisorCard: (props: Record<string, unknown>) => {
    mocks.advisorCardProps.push(props);
    return <div>{`AdvisorCard:${props.role}:${props.content}`}</div>;
  },
}));

vi.mock('../components/features/MessageBubble', () => ({
  MessageBubble: (props: Record<string, unknown>) => {
    mocks.messageBubbleProps.push(props);
    return <div>{`MessageBubble:${props.role}:${props.content}`}</div>;
  },
}));

vi.mock('../components/features/FinalVerdictCard', () => ({
  FinalVerdictCard: ({ content }: { content: string }) => <div>{`FinalVerdict:${content}`}</div>,
}));

vi.mock('../components/features/PeerReviewCard', () => ({
  PeerReviewCard: ({ content }: { content: string }) => <div>{`PeerReview:${content}`}</div>,
}));

vi.mock('../components/features/AdvisorPill', () => ({
  AdvisorPill: (props: Record<string, unknown>) => {
    mocks.advisorPillProps.push(props);
    const advisor = props.advisor as { id: string };
    return <div>{`AdvisorPill:${advisor.id}`}</div>;
  },
}));

vi.mock('../components/features/ExportPDFButton', () => ({
  ExportPDFButton: (props: Record<string, unknown>) => {
    mocks.exportPdfProps.push(props);
    return <button type="button">Eksport PDF</button>;
  },
}));

vi.mock('../components/features/ShareSessionModal', () => ({
  ShareSessionModal: (props: Record<string, unknown>) => {
    mocks.shareModalProps.push(props);
    const onClose = props.onClose as (() => void) | undefined;
    return (
      <div>
        <div>ShareModal</div>
        <button type="button" onClick={() => onClose?.()}>
          CloseShare
        </button>
      </div>
    );
  },
}));

import SessionLive from '../pages/SessionLive';

const createUserDoc = (exists: boolean, data: Record<string, unknown> = {}) => ({
  exists: () => exists,
  data: () => data,
});

const baseSession = {
  id: 'session-1',
  userId: 'owner-1',
  title: 'Sesja Doradcza',
  question: 'Jak rozwijać produkt?',
  status: 'running',
  createdAt: 1,
  fullContext: 'Pełny kontekst',
  documentTexts: 'Treść dokumentów',
  fileUrls: [],
  attachedFiles: [
    { name: 'brief.pdf', url: 'https://example.com/brief.pdf' },
    { name: 'notes.txt', url: 'https://example.com/notes.txt' },
  ],
  selectedAdvisors: ['advisor-1'],
  participants: ['owner-1'],
};

const baseMessages = [
  {
    id: 'msg-user',
    sessionId: 'session-1',
    userId: 'owner-1',
    role: 'user',
    content: 'Jak rozwijać produkt?',
    order: 0,
    timestamp: 1,
  },
];

describe('SessionLive page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.advisorCardProps.length = 0;
    mocks.messageBubbleProps.length = 0;
    mocks.advisorPillProps.length = 0;
    mocks.exportPdfProps.length = 0;
    mocks.shareModalProps.length = 0;
    mocks.peerReviewHookArgs.length = 0;
    mocks.chairmanHookArgs.length = 0;
    mocks.continueHookArgs.length = 0;
    mocks.useParamsMock.mockReturnValue({ sessionId: 'session-1' });
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'owner-1', email: 'owner@example.com' } });
    mocks.useSessionMock.mockReturnValue({
      session: baseSession,
      messages: baseMessages,
      loading: false,
      error: null,
    });
    mocks.runCouncilState.isRunning = false;
    mocks.runCouncilState.progress = { completed: 0, total: 1, current: 'Idle' };
    mocks.runCouncilState.error = null;
    mocks.runPeerReviewState.isRunning = false;
    mocks.runChairmanState.isRunning = false;
    mocks.continueConversationState.isSending = false;
    mocks.getDocMock.mockResolvedValue(createUserDoc(true, { displayName: 'User Name', email: 'user@example.com' }));
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: mocks.scrollIntoViewMock,
    });
  });

  it('renders the loading state', () => {
    mocks.useSessionMock.mockReturnValue({
      session: null,
      messages: [],
      loading: true,
      error: null,
    });

    render(<SessionLive />);

    expect(screen.getByText(/Ładowanie sesji/)).toBeInTheDocument();
  });

  it('renders error and missing-session states', () => {
    mocks.useSessionMock.mockReturnValueOnce({
      session: null,
      messages: [],
      loading: false,
      error: 'boom',
    });

    const { rerender } = render(<SessionLive />);
    expect(screen.getByText(/Wystąpił błąd/)).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();

    mocks.useSessionMock.mockReturnValueOnce({
      session: null,
      messages: [],
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    expect(screen.getByText(/Nie znaleziono sesji/)).toBeInTheDocument();
  });

  it('blocks access for users outside the session', () => {
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'stranger', email: 's@example.com' } });
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, participants: ['owner-1', 'other-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });

    render(<SessionLive />);

    expect(screen.getByText(/Brak dostępu/)).toBeInTheDocument();
  });

  it('passes an empty string to dependent hooks when session id is missing', () => {
    mocks.useParamsMock.mockReturnValue({});

    render(<SessionLive />);

    expect(mocks.peerReviewHookArgs.at(-1)).toBe('');
    expect(mocks.chairmanHookArgs.at(-1)).toBe('');
    expect(mocks.continueHookArgs.at(-1)).toBe('');
  });

  it('renders the owner running state and supports core owner actions', async () => {
    render(<SessionLive />);

    expect(screen.getByText('Sesja Doradcza')).toBeInTheDocument();
    expect(screen.getByText('AdvisorPill:advisor-1')).toBeInTheDocument();
    expect(screen.getByText(/MessageBubble:user:Jak rozwijać produkt/)).toBeInTheDocument();
    expect(screen.getByText('brief.pdf')).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Uruchom Radę Doradców/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Udostępnij/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zmień radę/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Uruchom Radę Doradców/i }));
    expect(mocks.runCouncilMock).toHaveBeenCalledWith('Jak rozwijać produkt?', 'Treść dokumentów');

    fireEvent.click(screen.getByRole('button', { name: /Zmień radę/i }));
    expect(mocks.navigateMock).toHaveBeenCalledWith('/', { state: { question: 'Jak rozwijać produkt?' } });

    fireEvent.click(screen.getByRole('button', { name: /Udostępnij/i }));
    expect(screen.getByText('ShareModal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'CloseShare' }));
    await waitFor(() => {
      expect(screen.queryByText('ShareModal')).not.toBeInTheDocument();
    });
  });

  it('shows the waiting state for non-owners before the council starts', () => {
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'guest-1', email: 'guest@example.com' } });
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, participants: ['owner-1', 'guest-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });

    render(<SessionLive />);

    expect(screen.getByText(/Oczekiwanie na uruchomienie rady/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Uruchom Radę Doradców/i })).not.toBeInTheDocument();
  });

  it('auto-runs peer review and chairman when statuses advance', () => {
    const messages = [
      ...baseMessages,
      { id: 'advisor-1', sessionId: 'session-1', userId: 'owner-1', role: 'contrarian', content: 'Rada 1', order: 1, timestamp: 2 },
    ];

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'advisors_completed' },
      messages,
      loading: false,
      error: null,
    });

    const { rerender } = render(<SessionLive />);

    expect(mocks.runPeerReviewMock).toHaveBeenCalledWith(messages, 'Pełny kontekst');

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'peer_review_completed' },
      messages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    expect(mocks.runChairmanMock).toHaveBeenCalledWith(messages, 'Jak rozwijać produkt?', 'Pełny kontekst');
    expect(screen.getByText(/Chairman analizuje obrady/)).toBeInTheDocument();
  });

  it('renders the completed state, conversation flow and follow-up actions', async () => {
    const messages = [
      ...baseMessages,
      { id: 'advisor-1', sessionId: 'session-1', userId: 'owner-1', role: 'contrarian', content: 'Rada 1', order: 1, timestamp: 2 },
      { id: 'peer-1', sessionId: 'session-1', userId: 'owner-1', role: 'peer_review', content: 'Peer review', order: 2, timestamp: 3 },
      { id: 'chair-1', sessionId: 'session-1', userId: 'owner-1', role: 'chairman', content: 'Werdykt', order: 3, timestamp: 4 },
      { id: 'conv-user', sessionId: 'session-1', userId: 'guest-1', role: 'user', content: 'Dopytanie', order: 4, timestamp: 5 },
      { id: 'conv-chair', sessionId: 'session-1', userId: 'owner-1', role: 'chairman', content: 'Doprecyzowanie', order: 5, timestamp: 6 },
    ];

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'completed', participants: ['owner-1', 'guest-1'] },
      messages,
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockResolvedValue(createUserDoc(true, { displayName: 'Gość', email: 'guest@example.com' }));

    render(<SessionLive />);

    expect(screen.getByText('PeerReview:Peer review')).toBeInTheDocument();
    expect(screen.getByText('FinalVerdict:Werdykt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zobacz decyzje w Trackerze/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Eksport PDF/i })).toBeInTheDocument();
    expect(screen.getByText(/Dyskusja z Przewodniczącym/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Gość')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Dopytaj o werdykt/);
    fireEvent.change(input, { target: { value: 'Nowe pytanie' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(mocks.sendMessageMock).toHaveBeenCalledWith('Nowe pytanie', messages);

    fireEvent.click(screen.getByRole('button', { name: /Zobacz decyzje w Trackerze/i }));
    expect(mocks.navigateMock).toHaveBeenCalledWith('/tracker');
  });

  it('emits status and participant toasts when the session advances', async () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'draft', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1', 'guest-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalled();
    });

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'completed', participants: ['owner-1', 'guest-1'] },
      messages: [
        ...baseMessages,
        { id: 'chair-1', sessionId: 'session-1', userId: 'owner-1', role: 'chairman', content: 'Werdykt', order: 1, timestamp: 2 },
      ],
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastSuccessMock).toHaveBeenCalledWith('Rada zakończyła obrady – werdykt gotowy');
    });
  });

  it('shows running progress, chairman typing and continuation loading states', () => {
    mocks.runCouncilState.isRunning = true;
    mocks.runCouncilState.progress = { completed: 1, total: 2, current: 'Analiza doradcy' };
    mocks.runCouncilState.error = 'run failed';
    mocks.runChairmanState.isRunning = true;
    mocks.continueConversationState.isSending = true;
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'peer_review_completed' },
      messages: baseMessages,
      loading: false,
      error: null,
    });

    render(<SessionLive />);

    expect(screen.getByText(/Przewodniczący syntetyzuje werdykt/)).toBeInTheDocument();
    expect(screen.getByText('Analiza doradcy')).toBeInTheDocument();
    expect(screen.getByText('run failed')).toBeInTheDocument();
    expect(screen.getByText(/Przewodniczący pisze odpowiedź/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Poczekaj na zakończenie obrad/)).toBeDisabled();
  });

  it('falls back to generic participant labels and the full advisor list', async () => {
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'guest-2', email: 'guest2@example.com' } });
    mocks.useSessionMock.mockReturnValue({
      session: {
        ...baseSession,
        title: '',
        status: 'completed',
        selectedAdvisors: [],
        participants: ['owner-1', 'guest-1', 'guest-2'],
      },
      messages: [
        { ...baseMessages[0], userId: 'owner-1' },
        { id: 'chair-1', sessionId: 'session-1', userId: 'owner-1', role: 'chairman', content: 'Werdykt', order: 1, timestamp: 2 },
        { id: 'conv-user', sessionId: 'session-1', userId: 'guest-1', role: 'user', content: 'Pytanie od gościa', order: 2, timestamp: 3 },
      ],
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockImplementation((ref: { id: string }) => {
      if (ref.id === 'guest-1') {
        return Promise.reject(new Error('lookup failed'));
      }

      return Promise.resolve(createUserDoc(false));
    });

    render(<SessionLive />);

    expect(screen.getByText('Sesja Doradcza')).toBeInTheDocument();
    expect(screen.getByText('AdvisorPill:advisor-1')).toBeInTheDocument();
    expect(screen.getByText('AdvisorPill:advisor-2')).toBeInTheDocument();
    expect(screen.getByText('Właściciel')).toBeInTheDocument();
    expect(screen.getByText('Inny uczestnik')).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.getDocMock).toHaveBeenCalled();
    });
  });

  it('uses email and participant fallbacks when fetched names are incomplete', async () => {
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'guest-2', email: 'guest2@example.com' } });
    mocks.useSessionMock.mockReturnValue({
      session: {
        ...baseSession,
        status: 'completed',
        participants: ['owner-1', 'guest-1', 'guest-2'],
      },
      messages: [
        { ...baseMessages[0], userId: 'owner-1' },
        { id: 'chair-1', sessionId: 'session-1', userId: 'owner-1', role: 'chairman', content: 'Werdykt', order: 1, timestamp: 2 },
        { id: 'conv-user', sessionId: 'session-1', userId: 'guest-1', role: 'user', content: 'Pytanie od gościa', order: 2, timestamp: 3 },
      ],
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockImplementation((ref: { id: string }) => {
      if (ref.id === 'owner-1') {
        return Promise.resolve(createUserDoc(true, { displayName: '', email: '' }));
      }

      if (ref.id === 'guest-1') {
        return Promise.resolve(createUserDoc(true, { displayName: '', email: 'guest1@example.com' }));
      }

      return Promise.resolve(createUserDoc(true, { displayName: 'Guest 2', email: 'guest2@example.com' }));
    });

    render(<SessionLive />);

    await waitFor(() => {
      expect(screen.getByText('Uczestnik')).toBeInTheDocument();
    });

    expect(screen.getByText('guest1@example.com')).toBeInTheDocument();
  });

  it('submits on Enter, but keeps Shift+Enter as a multiline action', () => {
    const messages = [
      ...baseMessages,
      { id: 'chair-1', sessionId: 'session-1', userId: 'owner-1', role: 'chairman', content: 'Werdykt', order: 1, timestamp: 2 },
    ];

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'completed' },
      messages,
      loading: false,
      error: null,
    });

    render(<SessionLive />);

    const input = screen.getByPlaceholderText(/Dopytaj o werdykt/);
    fireEvent.change(input, { target: { value: 'Pytanie enterem' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mocks.sendMessageMock).toHaveBeenCalledWith('Pytanie enterem', messages);
    expect(screen.getByPlaceholderText(/Dopytaj o werdykt/)).toHaveValue('');

    fireEvent.change(input, { target: { value: 'Pytanie ze shiftem' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mocks.sendMessageMock).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText(/Dopytaj o werdykt/)).toHaveValue('Pytanie ze shiftem');
  });

  it('does not send an empty follow-up when Enter is pressed', () => {
    const messages = [
      ...baseMessages,
      { id: 'chair-1', sessionId: 'session-1', userId: 'owner-1', role: 'chairman', content: 'Werdykt', order: 1, timestamp: 2 },
    ];

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'completed' },
      messages,
      loading: false,
      error: null,
    });

    render(<SessionLive />);

    fireEvent.keyDown(screen.getByPlaceholderText(/Dopytaj o werdykt/), { key: 'Enter', code: 'Enter' });

    expect(mocks.sendMessageMock).not.toHaveBeenCalled();
  });

  it('falls back to the initial message content when session question is empty', () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, question: '' },
      messages: [{ ...baseMessages[0], content: 'Treść z pierwszej wiadomości' }],
      loading: false,
      error: null,
    });

    render(<SessionLive />);

    expect(screen.getByText('MessageBubble:user:Treść z pierwszej wiadomości')).toBeInTheDocument();
  });

  it('ignores messages without ids while initializing rendered content', () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'completed' },
      messages: [
        { ...baseMessages[0], id: undefined },
        { id: 'chair-1', sessionId: 'session-1', userId: 'owner-1', role: 'chairman', content: 'Werdykt', order: 1, timestamp: 2 },
      ],
      loading: false,
      error: null,
    });

    render(<SessionLive />);

    expect(screen.getByText('FinalVerdict:Werdykt')).toBeInTheDocument();
  });

  it('shows generic start toast and council progress fallback text', async () => {
    mocks.runCouncilState.isRunning = true;
    mocks.runCouncilState.progress = { completed: 0, total: 2, current: '' };
    mocks.runPeerReviewState.isRunning = true;
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'draft', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockResolvedValue(createUserDoc(false));

    const { rerender } = render(<SessionLive />);

    expect(screen.getByText(/Trwa anonimowa recenzja/)).toBeInTheDocument();
    expect(screen.getByText('Inicjalizacja...')).toBeInTheDocument();

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalledWith('Rada została uruchomiona');
    });
  });

  it('uses email in the start toast when display name is missing', async () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'draft', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockResolvedValue(createUserDoc(true, { displayName: '', email: 'owner@example.com' }));

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalledWith('Rada została uruchomiona przez owner@example.com');
    });
  });

  it('uses the owner fallback in the start toast when name data is empty', async () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'draft', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockResolvedValue(createUserDoc(true, { displayName: '', email: '' }));

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalledWith('Rada została uruchomiona przez właściciela');
    });
  });

  it('falls back to a generic start toast when owner lookup fails', async () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'draft', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockRejectedValue(new Error('owner lookup failed'));

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalledWith('Rada została uruchomiona');
    });
  });

  it('falls back to a generic participant join toast when user data is missing', async () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockResolvedValue(createUserDoc(false));

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1', 'guest-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalledWith('Nowy uczestnik dołączył do sesji');
    });
  });

  it('uses participant email in the join toast and skips toast for the joining user', async () => {
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'guest-1', email: 'guest@example.com' } });
    mocks.getDocMock.mockImplementation((ref: { id: string }) => {
      if (ref.id === 'guest-2') {
        return Promise.resolve(createUserDoc(true, { displayName: '', email: 'guest2@example.com' }));
      }

      return Promise.resolve(createUserDoc(true, { displayName: 'Owner', email: 'owner@example.com' }));
    });
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1', 'guest-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1', 'guest-1', 'guest-2'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalledWith('guest2@example.com dołączył do sesji');
    });

    expect(mocks.toastInfoMock).not.toHaveBeenCalledWith('guest@example.com dołączył do sesji');
  });

  it('uses the participant fallback label in the join toast when fetched data is empty', async () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockResolvedValue(createUserDoc(true, { displayName: '', email: '' }));

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1', 'guest-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalledWith('Nowy uczestnik dołączył do sesji');
    });
  });

  it('does not show a join toast when the newly added participant is the current user', async () => {
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'guest-1', email: 'guest1@example.com' } });
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, userId: 'guest-1', status: 'running', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, userId: 'guest-1', status: 'running', participants: ['owner-1', 'guest-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).not.toHaveBeenCalled();
    });
  });

  it('falls back to a generic participant join toast when lookup fails', async () => {
    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    mocks.getDocMock.mockRejectedValue(new Error('network'));

    const { rerender } = render(<SessionLive />);

    mocks.useSessionMock.mockReturnValue({
      session: { ...baseSession, status: 'running', participants: ['owner-1', 'guest-1'] },
      messages: baseMessages,
      loading: false,
      error: null,
    });
    rerender(<SessionLive />);

    await waitFor(() => {
      expect(mocks.toastInfoMock).toHaveBeenCalledWith('Nowy uczestnik dołączył do sesji');
    });
  });
});
