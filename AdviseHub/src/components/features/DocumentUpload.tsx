import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth } from '../../providers/AuthProvider';
import { useDocumentRAG } from '../../hooks/useDocumentRAG';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface AttachedFile {
  file: File;
  extractedText: string;
  isExtracting: boolean;
  error?: string;
}

interface DocumentUploadProps {
  files: AttachedFile[];
  onChange: (files: AttachedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  onUpgradeRequest?: () => void;
}

export function DocumentUpload({ files, onChange, maxFiles = 5, maxSizeMB = 15, disabled = false, onUpgradeRequest }: DocumentUploadProps) {
  const { user } = useAuth();
  const { processAndSaveDocument } = useDocumentRAG();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Nie udaÅ‚o siÄ™ odczytaÄ‡ pliku PDF.');
    }
  };

  const extractTextFromTxt = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Nie udaÅ‚o siÄ™ odczytaÄ‡ pliku tekstowego.'));
      reader.readAsText(file);
    });
  };


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) {
      if (onUpgradeRequest) onUpgradeRequest();
      return;
    }

    if (files.length + acceptedFiles.length > maxFiles) {
      alert(`MoÅ¼esz wgraÄ‡ maksymalnie ${maxFiles} plikÃ³w.`);
      return;
    }

    const currentFiles = [...files];
    const newAttachedFiles: AttachedFile[] = [];

    for (const file of acceptedFiles) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`Plik ${file.name} jest za duÅ¼y. Maksymalny rozmiar to ${maxSizeMB}MB.`);
        continue;
      }
      
      const attachedFile: AttachedFile = {
        file,
        extractedText: '',
        isExtracting: true,
      };
      newAttachedFiles.push(attachedFile);
    }

    // Update state with new files (extracting state)
    let updatedFiles = [...currentFiles, ...newAttachedFiles];
    onChange(updatedFiles);

    // Process extraction
    for (const attachedFile of newAttachedFiles) {
      try {
        let text = '';
        if (attachedFile.file.type === 'application/pdf') {
          text = await extractTextFromPdf(attachedFile.file);
        } else if (attachedFile.file.type === 'text/plain' || attachedFile.file.name.endsWith('.md')) {
          text = await extractTextFromTxt(attachedFile.file);
        } else {
          throw new Error('NieobsÅ‚ugiwany format pliku.');
        }

        if (user) {
          await processAndSaveDocument(user.uid, attachedFile.file.name, text);
        }

        updatedFiles = updatedFiles.map(f => f.file === attachedFile.file ? { ...f, extractedText: text, isExtracting: false } : f);
        onChange(updatedFiles);
      } catch (error: any) {
        updatedFiles = updatedFiles.map(f => f.file === attachedFile.file ? { ...f, isExtracting: false, error: error.message } : f);
        onChange(updatedFiles);
      }
    }
  }, [files, maxFiles, maxSizeMB, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: files.length >= maxFiles || disabled
  });

  const removeFile = (fileToRemove: File) => {
    onChange(files.filter(f => f.file !== fileToRemove));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full mt-4">
      <div 
        {...getRootProps()} 
        onClick={(e) => {
          if (disabled) {
            e.stopPropagation();
            if (onUpgradeRequest) onUpgradeRequest();
          } else {
            getRootProps().onClick?.(e);
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
        } ${files.length >= maxFiles || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <span className="material-symbols-outlined text-3xl text-zinc-400 mb-2">upload_file</span>
        <p className="text-sm text-zinc-300 font-medium">
          {isDragActive ? 'UpuÅ›Ä‡ pliki tutaj...' : 'PrzeciÄ…gnij i upuÅ›Ä‡ dokumenty lub kliknij, aby wybraÄ‡'}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          ObsÅ‚ugiwane formaty: PDF, TXT, MD (max {maxFiles} plikÃ³w, {maxSizeMB} MB kaÅ¼dy)
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {files.map((attachedFile, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-white/5">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="material-symbols-outlined text-primary shrink-0">
                  {attachedFile.file.type === 'application/pdf' ? 'picture_as_pdf' : 'description'}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-white font-medium truncate">{attachedFile.file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{formatSize(attachedFile.file.size)}</span>
                    {attachedFile.isExtracting && (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] animate-spin">autorenew</span>
                        Analizowanie...
                      </span>
                    )}
                    {attachedFile.error && (
                      <span className="text-xs text-red-400">{attachedFile.error}</span>
                    )}
                    {!attachedFile.isExtracting && !attachedFile.error && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Gotowe
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); removeFile(attachedFile.file); }}
                className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

