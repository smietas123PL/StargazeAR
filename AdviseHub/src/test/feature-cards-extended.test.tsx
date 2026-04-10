import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  onClickMock: vi.fn(),
  onUseAdvisorTemplateMock: vi.fn(),
  onUseMarketplaceTemplateMock: vi.fn(),
  onCloseMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigateMock,
  };
});

import { AdvisorSelectionCard } from '../components/features/AdvisorSelectionCard';
import { AdvisorTemplateCard, type AdvisorTemplate } from '../components/features/AdvisorTemplateCard';
import { MarketplaceTemplateCard, type MarketplaceTemplate } from '../components/features/MarketplaceTemplateCard';
import { UpgradeModal } from '../components/features/UpgradeModal';

const advisor = {
  id: 'advisor-1',
  namePl: 'Doradca',
  nameEn: 'Advisor',
  role: 'advisor',
  description: 'Opis doradcy',
  systemPrompt: 'Prompt',
  icon: 'gavel',
  color: 'bg-red-500',
  bgClass: 'bg-red-500/10',
  borderClass: 'border-red-500/20',
  textClass: 'text-red-500',
  isCustom: false,
};

const advisorTemplate: AdvisorTemplate = {
  id: 'template-1',
  name: 'Szablon Rady',
  description: 'Opis szablonu',
  advisors: [
    {
      namePl: 'Doradca 1',
      nameEn: 'Advisor 1',
      role: 'advisor1',
      description: 'Pierwszy doradca',
      systemPrompt: 'Prompt 1',
      icon: 'rocket_launch',
      color: 'bg-blue-500',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/20',
      textClass: 'text-blue-500',
    },
    {
      namePl: 'Doradca 2',
      nameEn: 'Advisor 2',
      role: 'advisor2',
      description: 'Drugi doradca',
      systemPrompt: 'Prompt 2',
      icon: 'gavel',
      color: 'bg-red-500',
      bgClass: 'bg-red-500/10',
      borderClass: 'border-red-500/20',
      textClass: 'text-red-500',
      avatarUrl: 'https://example.com/avatar.png',
    },
  ],
};

const marketplaceTemplate: MarketplaceTemplate = {
  id: 'market-1',
  name: 'Marketplace Template',
  description: 'Marketplace description',
  advisorsCount: 4,
  rating: 4.7,
  downloads: 123,
  type: 'official',
  author: 'OpenAI',
  advisors: [],
};

describe('feature cards and modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['bg-red-500', '#ef4444'],
    ['bg-blue-500', '#3b82f6'],
    ['bg-purple-500', '#a855f7'],
    ['bg-emerald-500', '#10b981'],
    ['bg-amber-500', '#f59e0b'],
    ['bg-cyan-500', '#06b6d4'],
    ['bg-pink-500', '#ec4899'],
    ['bg-primary', '#00fc9b'],
  ])('renders AdvisorSelectionCard color branch %s', (color, hex) => {
    render(
      <AdvisorSelectionCard
        advisor={{ ...advisor, color }}
        isSelected={false}
        onClick={mocks.onClickMock}
      />,
    );

    const icon = screen.getByText('gavel');
    expect(icon).toHaveStyle({ color: hex });
  });

  it('renders selected AdvisorSelectionCard state and handles clicks', () => {
    render(
      <AdvisorSelectionCard
        advisor={advisor}
        isSelected
        onClick={mocks.onClickMock}
      />,
    );

    expect(screen.getByText('check')).toBeInTheDocument();
    expect(screen.getByText('Doradca').closest('[data-slot="card"]')).toHaveClass('border-2');

    fireEvent.click(screen.getByText('Opis doradcy'));
    expect(mocks.onClickMock).toHaveBeenCalledTimes(1);
  });

  it('renders avatar in AdvisorSelectionCard when present', () => {
    render(
      <AdvisorSelectionCard
        advisor={{ ...advisor, avatarUrl: 'https://example.com/avatar.png' }}
        isSelected={false}
        onClick={mocks.onClickMock}
      />,
    );

    expect(screen.getByRole('img', { name: 'Doradca' })).toHaveAttribute('src', 'https://example.com/avatar.png');
    expect(screen.queryByText('gavel')).not.toBeInTheDocument();
  });

  it('renders AdvisorTemplateCard and calls onUseTemplate', () => {
    render(
      <AdvisorTemplateCard
        template={advisorTemplate}
        onUseTemplate={mocks.onUseAdvisorTemplateMock}
        isApplying={false}
      />,
    );

    expect(screen.getByText('Szablon Rady')).toBeInTheDocument();
    expect(screen.getByText(/Skład Rady \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('Doradca 1')).toBeInTheDocument();
    expect(screen.getByText('Drugi doradca')).toBeInTheDocument();
    expect(screen.getByText('Użyj tego szablonu')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Użyj tego szablonu/i }));
    expect(mocks.onUseAdvisorTemplateMock).toHaveBeenCalledWith(advisorTemplate);
  });

  it('renders AdvisorTemplateCard applying state', () => {
    render(
      <AdvisorTemplateCard
        template={advisorTemplate}
        onUseTemplate={mocks.onUseAdvisorTemplateMock}
        isApplying
      />,
    );

    expect(screen.getByText('Przygotowywanie...')).toBeInTheDocument();
    expect(screen.getByText('autorenew')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders official MarketplaceTemplateCard and handles use action', () => {
    render(
      <MarketplaceTemplateCard
        template={marketplaceTemplate}
        onUseTemplate={mocks.onUseMarketplaceTemplateMock}
        isApplying={false}
      />,
    );

    expect(screen.getByText('Oficjalny')).toBeInTheDocument();
    expect(screen.getByText('od OpenAI')).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.getByText('4 doradców')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Użyj szablonu/i }));
    expect(mocks.onUseMarketplaceTemplateMock).toHaveBeenCalledWith(marketplaceTemplate);
  });

  it('renders community MarketplaceTemplateCard applying state', () => {
    render(
      <MarketplaceTemplateCard
        template={{ ...marketplaceTemplate, type: 'community', author: 'Community' }}
        onUseTemplate={mocks.onUseMarketplaceTemplateMock}
        isApplying
      />,
    );

    expect(screen.getByText('Społeczność')).toBeInTheDocument();
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders UpgradeModal and handles cancel', () => {
    render(
      <UpgradeModal
        isOpen
        onClose={mocks.onCloseMock}
        featureName="Dokumenty"
      />,
    );

    expect(screen.getByText('Przejdź na plan Pro')).toBeInTheDocument();
    expect(screen.getByText('Dokumenty')).toBeInTheDocument();
    expect(screen.getByText('Nielimitowana liczba sesji')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Anuluj/i }));
    expect(mocks.onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('navigates to pricing from UpgradeModal upgrade CTA', () => {
    render(
      <UpgradeModal
        isOpen
        onClose={mocks.onCloseMock}
        featureName="Własny doradca"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Ulepsz konto/i }));

    expect(mocks.onCloseMock).toHaveBeenCalledTimes(1);
    expect(mocks.navigateMock).toHaveBeenCalledWith('/pricing');
  });
});
