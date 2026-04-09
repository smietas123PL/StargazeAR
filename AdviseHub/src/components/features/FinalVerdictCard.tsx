import { Card } from '../ui/card';
import ReactMarkdown from 'react-markdown';

export function FinalVerdictCard({ content }: { content: string }) {
  // Pre-process content to convert specific bold headers to actual markdown headers for easier styling
  const processedContent = content
    .replace(/\*\*(Werdykt Przewodniczącego)\*\*/gi, '### $1')
    .replace(/\*\*(Kluczowe Wnioski)\*\*/gi, '### $1')
    .replace(/\*\*(Zalecane Działania)\*\*/gi, '### $1')
    .replace(/\*\*(Następny Krok.*?)\*\*/gi, '### $1');

  return (
    <div className="self-center w-full max-w-5xl my-16 relative">
      {/* Subtle Ambient Glow - Reduced for elegance */}
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <Card className="bg-surface-container-highest/90 backdrop-blur-md border border-white/5 p-8 md:p-16 shadow-2xl relative overflow-hidden rounded-[2rem]">
        {/* Top Subtle Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16 relative z-10">
          <div className="w-20 h-20 rounded-full bg-surface-container-lowest border border-white/10 flex items-center justify-center mb-8 shadow-lg relative">
            <span className="material-symbols-outlined text-4xl text-primary/90" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-black text-white/90 tracking-widest uppercase mb-6">
            WERDYKT PRZEWODNICZĄCEGO
          </h2>
          <div className="flex items-center gap-6">
            <div className="h-[1px] w-12 bg-white/10"></div>
            <span className="text-xs font-bold text-primary/70 uppercase tracking-[0.4em]">The Chairman</span>
            <div className="h-[1px] w-12 bg-white/10"></div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="relative z-10">
          <ReactMarkdown
            components={{
              h3: ({node, children}) => {
                const text = String(children).toLowerCase();
                if (text.includes('werdykt przewodniczącego')) return null; // We already have the big header
                return (
                  <div className="mt-14 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg md:text-xl font-headline font-bold text-primary/90 uppercase tracking-widest">
                        {children}
                      </h3>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                    </div>
                  </div>
                );
              },
              p: ({node, children}) => <p className="mb-6 text-white/70 leading-relaxed text-lg font-light">{children}</p>,
              ul: ({node, children}) => <ul className="mb-8 space-y-4">{children}</ul>,
              li: ({node, children}) => (
                <li className="flex items-start gap-4 text-white/80 text-lg font-light">
                  <span className="material-symbols-outlined text-primary/70 text-xl shrink-0 mt-1">check_circle</span>
                  <span>{children}</span>
                </li>
              ),
              strong: ({node, children}) => <strong className="font-semibold text-white/90">{children}</strong>,
              blockquote: ({node, children}) => (
                <div className="mt-16 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border-l-4 border-primary p-8 md:p-10 rounded-r-3xl flex items-center gap-6 md:gap-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,252,155,0.2)] border border-primary/30 z-10">
                    <span className="material-symbols-outlined text-primary text-3xl">arrow_forward</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white leading-tight z-10">
                    {children}
                  </div>
                </div>
              )
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </Card>
    </div>
  );
}
