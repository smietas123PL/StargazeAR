import { Button } from '../ui/button';
import { useExportPDF } from '../../hooks/useExportPDF';
import { Session, SessionMessage } from '../../types';
import { AdvisorDef } from '../../hooks/useCustomAdvisors';

interface ExportPDFButtonProps {
  session: Session;
  messages: SessionMessage[];
  advisors: AdvisorDef[];
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function ExportPDFButton({ 
  session, 
  messages, 
  advisors, 
  variant = 'outline', 
  size = 'sm',
  className = '',
  showLabel = true
}: ExportPDFButtonProps) {
  const { exportPDF, isExporting } = useExportPDF();

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card clicks
    exportPDF(session, messages, advisors);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting || session.status !== 'completed'}
      className={className}
      title="Eksportuj do PDF"
    >
      {isExporting ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>
      ) : (
        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
      )}
      {showLabel && <span className="ml-2">Eksportuj PDF</span>}
    </Button>
  );
}
