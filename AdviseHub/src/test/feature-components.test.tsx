import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  onButtonClick: vi.fn(),
  onMenuClick: vi.fn(),
}));

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

import { MessageBubble } from '../components/features/MessageBubble';
import { PeerReviewCard } from '../components/features/PeerReviewCard';
import { PricingCard } from '../components/features/PricingCard';
import { Header } from '../components/layout/Header';

describe('feature and layout components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthMock.mockReturnValue({
      profile: {
        displayName: 'Ada',
        plan: 'premium',
        email: 'ada@example.com',
      },
    });
  });

  it('renders header with profile data and handles menu clicks', () => {
    render(<Header onMenuClick={mocks.onMenuClick} />);

    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Plan Premium')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(mocks.onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('renders header fallbacks for anonymous free users', () => {
    mocks.useAuthMock.mockReturnValue({
      profile: {
        displayName: '',
        plan: 'free',
        email: '',
      },
    });

    render(<Header onMenuClick={mocks.onMenuClick} />);

    expect(screen.getByText('Użytkownik')).toBeInTheDocument();
    expect(screen.getByText('Plan Free')).toBeInTheDocument();
    expect(screen.getByText('person')).toBeInTheDocument();
  });

  it('renders user message bubbles including the first-message label', () => {
    render(<MessageBubble role="user" content="**Hello**" isFirstUserMsg />);

    expect(screen.getByText('Twój Kontekst')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders non-initial user message bubbles', () => {
    render(<MessageBubble role="user" content="Short reply" />);

    expect(screen.getByText('Ty')).toBeInTheDocument();
    expect(screen.getByText('Short reply')).toBeInTheDocument();
  });

  it('renders chairman message bubbles', () => {
    render(<MessageBubble role="chairman" content="Chairman response" />);

    expect(screen.getByText('The Chairman')).toBeInTheDocument();
    expect(screen.getByText('Chairman response')).toBeInTheDocument();
  });

  it('renders peer review content', () => {
    render(<PeerReviewCard content="Peer review notes" />);

    expect(screen.getByText('Anonimowy Peer Review')).toBeInTheDocument();
    expect(screen.getByText('Peer review notes')).toBeInTheDocument();
  });

  it('renders a pro pricing card and handles CTA clicks', () => {
    render(
      <PricingCard
        title="Pro"
        price="99 zl"
        description="Best plan"
        features={['Feature A', 'Feature B']}
        isPro
        buttonText="Upgrade"
        onButtonClick={mocks.onButtonClick}
      />,
    );

    expect(screen.getByText('Najczęściej wybierany')).toBeInTheDocument();
    expect(screen.getByText('/ miesiąc')).toBeInTheDocument();
    expect(screen.getByText('Feature A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));

    expect(mocks.onButtonClick).toHaveBeenCalledTimes(1);
  });

  it('renders a free pricing card without the monthly period', () => {
    render(
      <PricingCard
        title="Free"
        price="Darmowy"
        description="Starter"
        features={['Feature X']}
        buttonText="Start"
        onButtonClick={mocks.onButtonClick}
      />,
    );

    expect(screen.queryByText('/ miesiąc')).not.toBeInTheDocument();
    expect(screen.queryByText('Najczęściej wybierany')).not.toBeInTheDocument();
  });
});
