import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  saveCustomAdvisorMock: vi.fn(),
  allAdvisorsState: [] as Array<Record<string, unknown>>,
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
  templateCardProps: [] as Array<Record<string, unknown>>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigateMock,
  };
});

vi.mock('../hooks/useCustomAdvisors', () => ({
  useCustomAdvisors: () => ({
    allAdvisors: mocks.allAdvisorsState,
    saveCustomAdvisor: mocks.saveCustomAdvisorMock,
  }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(
    (...args: unknown[]) => mocks.toastInfoMock(...args),
    {
      success: (...args: unknown[]) => mocks.toastSuccessMock(...args),
      error: (...args: unknown[]) => mocks.toastErrorMock(...args),
      info: (...args: unknown[]) => mocks.toastInfoMock(...args),
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

vi.mock('../components/features/MarketplaceTemplateCard', () => ({
  MarketplaceTemplateCard: (props: Record<string, unknown>) => {
    mocks.templateCardProps.push(props);
    const template = props.template as {
      id: string;
      name: string;
      type: string;
    };
    const onUseTemplate = props.onUseTemplate as ((template: unknown) => void) | undefined;
    return (
      <div>
        <div>{`Template:${template.id}:${template.type}:${String(props.isApplying)}`}</div>
        <div>{template.name}</div>
        <button type="button" onClick={() => onUseTemplate?.(template)}>
          {`Use:${template.id}`}
        </button>
      </div>
    );
  },
}));

import Marketplace from '../pages/Marketplace';

describe('Marketplace page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.templateCardProps.length = 0;
    mocks.allAdvisorsState = [];
    mocks.saveCustomAdvisorMock.mockResolvedValue(undefined);
  });

  it('renders all templates by default and filters them by tab', () => {
    render(<Marketplace />);

    expect(screen.getByText('Advisor Marketplace')).toBeInTheDocument();
    expect(screen.getAllByText(/^Template:/)).toHaveLength(4);
    expect(screen.getByText('Template:saas_board:official:false')).toBeInTheDocument();
    expect(screen.getByText('Template:marketing_agency_board:community:false')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Oficjalne' }));

    expect(screen.getAllByText(/^Template:/)).toHaveLength(2);
    expect(screen.getByText('Template:saas_board:official:false')).toBeInTheDocument();
    expect(screen.queryByText('Template:indie_hacker_board:community:false')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Społecznościowe' }));

    expect(screen.getAllByText(/^Template:/)).toHaveLength(2);
    expect(screen.getByText('Template:indie_hacker_board:community:false')).toBeInTheDocument();
    expect(screen.queryByText('Template:saas_board:official:false')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Wszystkie' }));

    expect(screen.getAllByText(/^Template:/)).toHaveLength(4);
  });

  it('shows the publish info toast', () => {
    render(<Marketplace />);

    fireEvent.click(screen.getByRole('button', { name: /Opublikuj swój szablon/i }));

    expect(mocks.toastInfoMock).toHaveBeenCalledWith('Funkcja w przygotowaniu', {
      description: 'Wkrótce będziesz mógł publikować własne szablony dla społeczności.',
    });
  });

  it('applies a template using direct ids, existing advisors and newly saved custom advisors', async () => {
    mocks.allAdvisorsState = [
      { id: 'existing-sales', role: 'b2b_sales' },
    ];
    mocks.saveCustomAdvisorMock
      .mockResolvedValueOnce('saved-hr')
      .mockResolvedValueOnce(undefined);

    render(<Marketplace />);

    fireEvent.click(screen.getByRole('button', { name: 'Use:marketing_agency_board' }));

    await waitFor(() => {
      expect(mocks.toastSuccessMock).toHaveBeenCalledWith('Szablon został załadowany.');
    });

    expect(mocks.saveCustomAdvisorMock).toHaveBeenCalledTimes(2);
    expect(mocks.navigateMock).toHaveBeenCalledWith('/', {
      state: {
        selectedAdvisors: ['existing-sales', 'saved-hr', 'contrarian'],
      },
    });
  });

  it('shows applying state while a template is being processed', async () => {
    let resolveSave: ((value: string) => void) | undefined;
    mocks.saveCustomAdvisorMock.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveSave = resolve;
        }),
    );

    render(<Marketplace />);

    fireEvent.click(screen.getByRole('button', { name: 'Use:indie_hacker_board' }));

    await waitFor(() => {
      expect(screen.getByText('Template:indie_hacker_board:community:true')).toBeInTheDocument();
    });

    resolveSave?.('saved-bootstrapper');
    mocks.saveCustomAdvisorMock.mockResolvedValue('saved-next');

    await waitFor(() => {
      expect(screen.getByText('Template:indie_hacker_board:community:false')).toBeInTheDocument();
    });
  });

  it('shows an error toast and resets applying state when template loading fails', async () => {
    mocks.saveCustomAdvisorMock.mockRejectedValue(new Error('save failed'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<Marketplace />);

    fireEvent.click(screen.getByRole('button', { name: 'Use:saas_board' }));

    await waitFor(() => {
      expect(mocks.toastErrorMock).toHaveBeenCalledWith('Wystąpił błąd podczas ładowania szablonu.');
    });

    expect(mocks.navigateMock).not.toHaveBeenCalled();
    expect(screen.getByText('Template:saas_board:official:false')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});
