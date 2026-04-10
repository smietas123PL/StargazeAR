import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useLocationMock: vi.fn(),
  navigateMock: vi.fn(),
  useVoiceChatMock: vi.fn(),
  connectMock: vi.fn(),
  disconnectMock: vi.fn(),
  scrollIntoViewMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => mocks.useLocationMock(),
    useNavigate: () => mocks.navigateMock,
  };
});

vi.mock('../hooks/useVoiceChat', () => ({
  useVoiceChat: () => mocks.useVoiceChatMock(),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

import VoiceChat from '../pages/VoiceChat';

describe('VoiceChat page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useLocationMock.mockReturnValue({ state: undefined });
    mocks.useVoiceChatMock.mockReturnValue({
      state: 'idle',
      error: null,
      messages: [],
      connect: mocks.connectMock,
      disconnect: mocks.disconnectMock,
    });
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: mocks.scrollIntoViewMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the empty disconnected state and navigates to voice setup', () => {
    render(<VoiceChat />);

    expect(screen.getByText('Real-time AI Voice Chat')).toBeInTheDocument();
    expect(screen.getByText(/Naciśnij przycisk poniżej/)).toBeInTheDocument();
    expect(screen.getByText('Rozłączono')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rozpocznij rozmowę/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Zmień ustawienia/i }));

    expect(mocks.navigateMock).toHaveBeenCalledWith('/voice-setup');
  });

  it('uses voice settings from location state when starting a conversation', () => {
    mocks.useLocationMock.mockReturnValue({
      state: { voiceName: 'Nova', systemInstruction: 'Mów krótko' },
    });

    render(<VoiceChat />);

    expect(screen.getByText('Nova')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Rozpocznij rozmowę/i }));

    expect(mocks.connectMock).toHaveBeenCalledWith('Nova', 'Mów krótko');
  });

  it('renders error state and disables connecting while the session is connecting', () => {
    mocks.useVoiceChatMock.mockReturnValue({
      state: 'connecting',
      error: 'Połączenie nieudane',
      messages: [],
      connect: mocks.connectMock,
      disconnect: mocks.disconnectMock,
    });

    render(<VoiceChat />);

    expect(screen.getByText('Wystąpił błąd')).toBeInTheDocument();
    expect(screen.getByText('Połączenie nieudane')).toBeInTheDocument();
    expect(screen.getByText('Łączenie...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rozpocznij rozmowę/i })).toBeDisabled();
  });

  it('renders transcript messages, visualizer and disconnect action when connected', () => {
    mocks.useVoiceChatMock.mockReturnValue({
      state: 'connected',
      error: null,
      messages: [
        { id: '1', text: 'Cześć', isUser: true, timestamp: 1 },
        { id: '2', text: 'Hej, w czym pomóc?', isUser: false, timestamp: 2 },
      ],
      connect: mocks.connectMock,
      disconnect: mocks.disconnectMock,
    });

    render(<VoiceChat />);

    expect(screen.getByText('Połączono')).toBeInTheDocument();
    expect(screen.getByText('Cześć')).toBeInTheDocument();
    expect(screen.getByText('Hej, w czym pomóc?')).toBeInTheDocument();
    expect(screen.getByText('Ty')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(document.querySelectorAll('.w-2.bg-primary.rounded-full')).toHaveLength(5);

    fireEvent.click(screen.getByRole('button', { name: /Zakończ rozmowę/i }));

    expect(mocks.disconnectMock).toHaveBeenCalledTimes(1);
  });

  it('scrolls to the end when messages are present', () => {
    mocks.useVoiceChatMock.mockReturnValue({
      state: 'connected',
      error: null,
      messages: [{ id: '1', text: 'Nowa wiadomość', isUser: false, timestamp: 1 }],
      connect: mocks.connectMock,
      disconnect: mocks.disconnectMock,
    });

    render(<VoiceChat />);

    expect(mocks.scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
