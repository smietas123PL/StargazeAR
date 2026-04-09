import { MessageRole } from '../../types';
import { Card } from '../ui/card';
import ReactMarkdown from 'react-markdown';
import { useCustomAdvisors } from '../../hooks/useCustomAdvisors';

interface AdvisorCardProps {
  role: MessageRole;
  content: string;
}

export function AdvisorCard({ role, content }: AdvisorCardProps) {
  const { allAdvisors } = useCustomAdvisors();
  
  const advisor = allAdvisors.find(a => a.role === role);
  
  if (!advisor) return null;

  const markdownStyles = "text-sm text-on-surface-variant/90 leading-relaxed [&>p]:mb-4 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mb-2 [&>strong]:text-white";

  // Extract color hex from bgClass if possible, or fallback
  const colorHex = advisor.color.includes('red') ? '#ef4444' : 
                   advisor.color.includes('blue') ? '#3b82f6' :
                   advisor.color.includes('purple') ? '#a855f7' :
                   advisor.color.includes('emerald') ? '#10b981' :
                   advisor.color.includes('amber') ? '#f59e0b' :
                   advisor.color.includes('cyan') ? '#06b6d4' :
                   advisor.color.includes('pink') ? '#ec4899' : '#00fc9b';

  return (
    <Card className="relative overflow-hidden bg-surface-container-low/60 backdrop-blur-xl border-white/5 shadow-lg w-full max-w-3xl">
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 shadow-[0_0_10px_currentColor]"
        style={{ backgroundColor: colorHex, color: colorHex }}
      />
      <div className="p-5 pl-6">
        <div className="flex items-center gap-3 mb-4">
          {advisor.avatarUrl ? (
            <img src={advisor.avatarUrl} alt={advisor.namePl} className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-highest border border-white/10 shadow-inner shrink-0"
            >
              <span className="material-symbols-outlined text-sm" style={{ color: colorHex }}>{advisor.icon}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">{advisor.namePl}</span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant leading-tight">{advisor.nameEn}</span>
          </div>
        </div>
        <div className={markdownStyles}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </Card>
  );
}
