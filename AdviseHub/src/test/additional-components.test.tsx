import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../components/layout/Header', () => ({
  Header: ({ onMenuClick }: { onMenuClick: () => void }) => (
    <button onClick={onMenuClick}>Open Menu</button>
  ),
}));

vi.mock('../components/layout/Sidebar', () => ({
  Sidebar: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="sidebar" data-open={String(isOpen)}>
      <button onClick={onClose}>Close Sidebar</button>
    </div>
  ),
}));

import { AdvisorPill } from '../components/features/AdvisorPill';
import { FinalVerdictCard } from '../components/features/FinalVerdictCard';
import { MainLayout } from '../components/layout/MainLayout';

const baseAdvisor = {
  id: 'advisor-1',
  namePl: 'Doradca',
  nameEn: 'Advisor',
  role: 'advisor',
  description: 'desc',
  systemPrompt: 'prompt',
  icon: 'gavel',
  color: 'bg-red-500',
  bgClass: 'bg-red-500/10',
  borderClass: 'border-red-500/20',
  textClass: 'text-red-500',
  isCustom: false,
};

describe('additional components', () => {
  it('renders MainLayout, outlet content and toggles the sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>Outlet Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Outlet Content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false');
    expect(screen.getByRole('link', { name: 'Moja Rada' })).toHaveAttribute('href', '/board');
    expect(screen.getByRole('link', { name: 'Historia' })).toHaveAttribute('href', '/history');

    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Close Sidebar' }));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false');
  });

  it('renders FinalVerdictCard headings, markdown blocks and hides the duplicate verdict heading', () => {
    render(
      <FinalVerdictCard
        content={[
          '**Werdykt Przewodniczącego**',
          '',
          'Akapit z **pogrubieniem**.',
          '',
          '**Kluczowe Wnioski**',
          '',
          '- Pierwszy punkt',
          '',
          '**Następny Krok: Uruchom**',
          '',
          '> Działaj teraz',
        ].join('\n')}
      />,
    );

    expect(screen.getAllByText(/Werdykt/i)).toHaveLength(1);
    expect(screen.getByText('Kluczowe Wnioski')).toBeInTheDocument();
    expect(screen.getByText('Następny Krok: Uruchom')).toBeInTheDocument();
    expect(screen.getByText('pogrubieniem')).toBeInTheDocument();
    expect(screen.getByText('Pierwszy punkt')).toBeInTheDocument();
    expect(screen.getByText('Działaj teraz')).toBeInTheDocument();
    expect(screen.getByText('arrow_forward')).toBeInTheDocument();
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
  ])('maps advisor color %s to %s when rendering the icon fallback', (color, hex) => {
    render(
      <AdvisorPill
        advisor={{
          ...baseAdvisor,
          color,
        }}
        className="extra-pill"
      />,
    );

    const icon = screen.getByText('gavel');
    expect(icon).toHaveStyle({ color: hex });
    expect(screen.getByText('Doradca').parentElement).toHaveClass('extra-pill');
  });

  it('renders the avatar image when advisor has avatarUrl', () => {
    render(
      <AdvisorPill
        advisor={{
          ...baseAdvisor,
          avatarUrl: 'https://example.com/avatar.png',
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Doradca' })).toHaveAttribute('src', 'https://example.com/avatar.png');
    expect(screen.queryByText('gavel')).not.toBeInTheDocument();
  });
});
