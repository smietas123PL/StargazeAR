import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useExportPDFMock: vi.fn(),
}));

vi.mock('../hooks/useExportPDF', () => ({
  useExportPDF: () => mocks.useExportPDFMock(),
}));

import { ExportPDFButton } from '../components/features/ExportPDFButton';

const session = {
  id: 'session-1',
  userId: 'user-1',
  title: 'Sesja',
  question: 'Pytanie',
  status: 'completed',
  createdAt: 1,
  fileUrls: [],
};

const messages = [
  { id: 'm1', sessionId: 'session-1', userId: 'user-1', role: 'user', content: 'Pierwsza wiadomość', order: 1, timestamp: 1 },
];

const advisors = [
  {
    id: 'advisor-1',
    namePl: 'Doradca',
    nameEn: 'Advisor',
    role: 'advisor',
    description: 'Opis',
    systemPrompt: 'Prompt',
    icon: 'gavel',
    color: 'bg-red-500',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    textClass: 'text-red-500',
    isCustom: false,
  },
];

describe('ExportPDFButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useExportPDFMock.mockReturnValue({ exportPDF: vi.fn(), isExporting: false });
  });

  it('renders enabled export button and calls exportPDF while stopping propagation', () => {
    const exportPDF = vi.fn();
    mocks.useExportPDFMock.mockReturnValue({ exportPDF, isExporting: false });

    render(
      <ExportPDFButton
        session={session as never}
        messages={messages as never}
        advisors={advisors as never}
      />,
    );

    const button = screen.getByRole('button', { name: /Eksportuj PDF/i });
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });
    button.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(exportPDF).toHaveBeenCalledWith(session, messages, advisors);
    expect(screen.getByText('picture_as_pdf')).toBeInTheDocument();
  });

  it('renders loading state and hides label when requested', () => {
    mocks.useExportPDFMock.mockReturnValue({ exportPDF: vi.fn(), isExporting: true });

    render(
      <ExportPDFButton
        session={session as never}
        messages={messages as never}
        advisors={advisors as never}
        showLabel={false}
        variant="ghost"
        size="icon"
      />,
    );

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('autorenew')).toBeInTheDocument();
    expect(screen.queryByText('Eksportuj PDF')).not.toBeInTheDocument();
  });

  it('disables export for incomplete sessions', () => {
    render(
      <ExportPDFButton
        session={{ ...session, status: 'draft' } as never}
        messages={messages as never}
        advisors={advisors as never}
      />,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
