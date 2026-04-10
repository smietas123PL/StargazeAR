import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const useAuthMock = vi.fn();
  const processAndSaveDocumentMock = vi.fn();
  const rootClickMock = vi.fn();
  const getDocumentMock = vi.fn();
  const dropzoneState: { options: any; isDragActive: boolean } = {
    options: null,
    isDragActive: false,
  };
  const pdfWorkerOptions = { workerSrc: '' };
  const alertMock = vi.fn();

  return {
    useAuthMock,
    processAndSaveDocumentMock,
    rootClickMock,
    getDocumentMock,
    dropzoneState,
    pdfWorkerOptions,
    alertMock,
  };
});

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mocks.useAuthMock(),
}));

vi.mock('../hooks/useDocumentRAG', () => ({
  useDocumentRAG: () => ({
    processAndSaveDocument: mocks.processAndSaveDocumentMock,
  }),
}));

vi.mock('react-dropzone', () => ({
  useDropzone: (options: any) => {
    mocks.dropzoneState.options = options;
    return {
      getRootProps: () => ({
        'data-testid': 'dropzone-root',
        onClick: mocks.rootClickMock,
      }),
      getInputProps: () => ({
        'data-testid': 'dropzone-input',
      }),
      isDragActive: mocks.dropzoneState.isDragActive,
    };
  },
}));

vi.mock('pdfjs-dist', () => ({
  version: '4.0.0',
  GlobalWorkerOptions: mocks.pdfWorkerOptions,
  getDocument: (...args: unknown[]) => mocks.getDocumentMock(...args),
}));

import { DocumentUpload, type AttachedFile } from '../components/features/DocumentUpload';

const makeFile = (name: string, content: string, type: string) => new File([content], name, { type });

const setFileSize = (file: File, size: number) => {
  Object.defineProperty(file, 'size', { configurable: true, value: size });
  return file;
};

describe('DocumentUpload', () => {
  const OriginalFileReader = globalThis.FileReader;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.alertMock.mockReset();
    vi.stubGlobal('alert', mocks.alertMock);
    mocks.useAuthMock.mockReturnValue({ user: { uid: 'user-1', email: 'ada@example.com' } });
    mocks.processAndSaveDocumentMock.mockResolvedValue(undefined);
    mocks.dropzoneState.options = null;
    mocks.dropzoneState.isDragActive = false;
    mocks.getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'PDF page' }],
          }),
        }),
      }),
    });

    class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      onerror: (() => void) | null = null;

      readAsText(file: File) {
        if (file.name.includes('reader-error')) {
          this.onerror?.();
          return;
        }

        file.text().then((text) => {
          this.onload?.({ target: { result: text } });
        });
      }
    }

    Object.defineProperty(globalThis, 'FileReader', {
      configurable: true,
      writable: true,
      value: MockFileReader,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'FileReader', {
      configurable: true,
      writable: true,
      value: OriginalFileReader,
    });
  });

  it('renders existing files, formats sizes and removes an item', () => {
    const pdfFile = setFileSize(makeFile('deck.pdf', '', 'application/pdf'), 0);
    const textFile = setFileSize(makeFile('notes.txt', 'a'.repeat(1024), 'text/plain'), 1024);
    const markdownFile = setFileSize(makeFile('plan.md', 'a'.repeat(1536), 'text/markdown'), 1536);
    const onChange = vi.fn();

    const files: AttachedFile[] = [
      { file: pdfFile, extractedText: '', isExtracting: true },
      { file: textFile, extractedText: '', isExtracting: false, error: 'boom' },
      { file: markdownFile, extractedText: 'done', isExtracting: false },
    ];

    render(<DocumentUpload files={files} onChange={onChange} />);

    expect(mocks.pdfWorkerOptions.workerSrc).toContain('pdf.worker.min.mjs');
    expect(screen.getByText('0 Bytes')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    expect(screen.getByText('Analizowanie...')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.getByText('Gotowe')).toBeInTheDocument();
    expect(screen.getByText('picture_as_pdf')).toBeInTheDocument();
    expect(screen.getAllByText('description')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onChange).toHaveBeenCalledWith(files.slice(1));
  });

  it('shows drag-active state and forwards root clicks when enabled', () => {
    mocks.dropzoneState.isDragActive = true;
    const onChange = vi.fn();

    render(<DocumentUpload files={[]} onChange={onChange} />);

    const root = screen.getByTestId('dropzone-root');
    expect(root.className).toContain('border-primary');
    expect(screen.getByText(/Upu/)).toBeInTheDocument();

    fireEvent.click(root);
    expect(mocks.rootClickMock).toHaveBeenCalledTimes(1);
  });

  it('handles disabled clicks and drops with and without an upgrade callback', async () => {
    const onChange = vi.fn();
    const onUpgradeRequest = vi.fn();
    const file = makeFile('doc.txt', 'tekst', 'text/plain');

    const { rerender } = render(
      <DocumentUpload files={[]} onChange={onChange} disabled onUpgradeRequest={onUpgradeRequest} />,
    );

    const root = screen.getByTestId('dropzone-root');
    expect(root.className).toContain('opacity-50');
    fireEvent.click(root);
    expect(onUpgradeRequest).toHaveBeenCalledTimes(1);
    expect(mocks.rootClickMock).not.toHaveBeenCalled();

    await act(async () => {
      await mocks.dropzoneState.options.onDrop([file]);
    });
    expect(onUpgradeRequest).toHaveBeenCalledTimes(2);
    expect(onChange).not.toHaveBeenCalled();

    rerender(<DocumentUpload files={[]} onChange={onChange} disabled />);

    fireEvent.click(screen.getByTestId('dropzone-root'));
    await act(async () => {
      await mocks.dropzoneState.options.onDrop([file]);
    });

    expect(mocks.rootClickMock).not.toHaveBeenCalled();
  });

  it('alerts when the max file count is exceeded', async () => {
    const existingFile = makeFile('existing.txt', 'tekst', 'text/plain');
    const extraFile = makeFile('extra.txt', 'tekst', 'text/plain');
    const onChange = vi.fn();

    render(
      <DocumentUpload
        files={[{ file: existingFile, extractedText: 'done', isExtracting: false }]}
        onChange={onChange}
        maxFiles={1}
      />,
    );

    expect(mocks.dropzoneState.options.disabled).toBe(true);

    await act(async () => {
      await mocks.dropzoneState.options.onDrop([extraFile]);
    });

    expect(mocks.alertMock).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('skips oversized files and processes text files into the knowledge store', async () => {
    const bigFile = setFileSize(makeFile('big.txt', 'x', 'text/plain'), 2 * 1024 * 1024);
    const goodFile = makeFile('notes.txt', 'Notatki z klientem', 'text/plain');
    const onChange = vi.fn();

    render(<DocumentUpload files={[]} onChange={onChange} maxSizeMB={1} />);

    await act(async () => {
      await mocks.dropzoneState.options.onDrop([bigFile, goodFile]);
    });

    expect(mocks.alertMock).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ file: goodFile, isExtracting: true, extractedText: '' }),
    ]);
    expect(onChange).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ file: goodFile, isExtracting: false, extractedText: 'Notatki z klientem' }),
    ]);
    expect(mocks.processAndSaveDocumentMock).toHaveBeenCalledWith('user-1', 'notes.txt', 'Notatki z klientem');
  });

  it('processes markdown files without persisting when the user is anonymous', async () => {
    mocks.useAuthMock.mockReturnValue({ user: null });
    const mdFile = makeFile('strategy.md', '# Plan', '');
    const onChange = vi.fn();

    render(<DocumentUpload files={[]} onChange={onChange} />);

    await act(async () => {
      await mocks.dropzoneState.options.onDrop([mdFile]);
    });

    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ file: mdFile, isExtracting: false, extractedText: '# Plan' }),
    ]);
    expect(mocks.processAndSaveDocumentMock).not.toHaveBeenCalled();
  });

  it('stores unsupported file format errors', async () => {
    const unsupportedFile = makeFile('data.json', '{"ok":true}', 'application/json');
    const onChange = vi.fn();

    render(<DocumentUpload files={[]} onChange={onChange} />);

    await act(async () => {
      await mocks.dropzoneState.options.onDrop([unsupportedFile]);
    });

    expect(onChange).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ file: unsupportedFile, isExtracting: true }),
    ]);
    expect(onChange).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ file: unsupportedFile, isExtracting: false, error: expect.stringContaining('Nieobs') }),
    ]);
    expect(mocks.processAndSaveDocumentMock).not.toHaveBeenCalled();
  });

  it('extracts PDF text across pages and saves it', async () => {
    const pdfFile = makeFile('report.pdf', 'pdf', 'application/pdf');
    const onChange = vi.fn();

    mocks.getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: vi.fn((pageNumber: number) => Promise.resolve({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: `Page ${pageNumber}` }],
          }),
        })),
      }),
    });

    render(<DocumentUpload files={[]} onChange={onChange} />);

    await act(async () => {
      await mocks.dropzoneState.options.onDrop([pdfFile]);
    });

    expect(mocks.getDocumentMock).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(ArrayBuffer) }));
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ file: pdfFile, isExtracting: false, extractedText: 'Page 1\n\nPage 2' }),
    ]);
    expect(mocks.processAndSaveDocumentMock).toHaveBeenCalledWith('user-1', 'report.pdf', 'Page 1\n\nPage 2');
  });

  it('stores PDF extraction errors', async () => {
    const pdfFile = makeFile('broken.pdf', 'pdf', 'application/pdf');
    const onChange = vi.fn();
    mocks.getDocumentMock.mockReturnValue({ promise: Promise.reject(new Error('pdf failed')) });

    render(<DocumentUpload files={[]} onChange={onChange} />);

    await act(async () => {
      await mocks.dropzoneState.options.onDrop([pdfFile]);
    });

    expect(console.error).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ file: pdfFile, isExtracting: false, error: expect.stringContaining('Nie uda') }),
    ]);
  });

  it('stores text reader errors', async () => {
    const textFile = makeFile('reader-error.txt', 'broken', 'text/plain');
    const onChange = vi.fn();

    render(<DocumentUpload files={[]} onChange={onChange} />);

    await act(async () => {
      await mocks.dropzoneState.options.onDrop([textFile]);
    });

    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ file: textFile, isExtracting: false, error: expect.stringContaining('Nie uda') }),
    ]);
  });
});

