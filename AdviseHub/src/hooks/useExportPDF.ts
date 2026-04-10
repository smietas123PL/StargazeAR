import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { Session, SessionMessage } from '../types';
import { AdvisorDef } from './useCustomAdvisors';
import { SessionPDFTemplate } from '../components/features/SessionPDFTemplate';
import { toast } from 'sonner';

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async (session: Session, messages: SessionMessage[], advisors: AdvisorDef[]) => {
    setIsExporting(true);
    const toastId = toast.loading('Generowanie raportu PDF...');
    
    try {
      // Create a hidden container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px';
      document.body.appendChild(container);

      const root = createRoot(container);
      
      // Render the template
      root.render(
        React.createElement(SessionPDFTemplate, { session, messages, advisors })
      );

      // Wait for render and fonts to load
      await new Promise(resolve => setTimeout(resolve, 1500));

      const canvas = await html2canvas(container.firstChild as HTMLElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#001f2e',
        logging: false,
        windowWidth: 800,
        onclone: (clonedDoc) => {
          // Fix for html2canvas not supporting oklch/oklab colors
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            
            // If the element has oklch/oklab in backgroundColor or color, 
            // the browser's getComputedStyle usually returns it as rgb() anyway,
            // so we just explicitly set it to avoid the parser error.
            if (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab')) {
               el.style.backgroundColor = 'rgba(0,0,0,0)'; // Fallback to transparent for problematic bgs
            }
            if (style.color.includes('oklch') || style.color.includes('oklab')) {
               el.style.color = '#ffffff'; // Fallback to white for problematic text
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`AdviseHub_Raport_${dateStr}.pdf`);
      
      // Cleanup
      root.unmount();
      document.body.removeChild(container);
      
      toast.success('Raport PDF został wygenerowany', { id: toastId });
    } catch (error) {
      console.error('PDF Export error:', error);
      toast.error('Błąd podczas generowania PDF', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportPDF, isExporting };
}
