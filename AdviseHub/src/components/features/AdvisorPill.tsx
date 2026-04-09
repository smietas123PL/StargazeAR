import { AdvisorDef } from '../../hooks/useCustomAdvisors';

interface AdvisorPillProps {
  advisor: AdvisorDef;
  className?: string;
}

export function AdvisorPill({ advisor, className = '' }: AdvisorPillProps) {
  const colorHex = advisor.color.includes('red') ? '#ef4444' : 
                   advisor.color.includes('blue') ? '#3b82f6' :
                   advisor.color.includes('purple') ? '#a855f7' :
                   advisor.color.includes('emerald') ? '#10b981' :
                   advisor.color.includes('amber') ? '#f59e0b' :
                   advisor.color.includes('cyan') ? '#06b6d4' :
                   advisor.color.includes('pink') ? '#ec4899' : '#00fc9b';

  return (
    <div className={`flex items-center gap-1.5 bg-surface-container/50 border border-white/5 px-2 py-0.5 rounded-full shadow-sm hover:bg-surface-container-high hover:border-white/10 transition-all cursor-default ${className}`}>
      {advisor.avatarUrl ? (
        <img 
          src={advisor.avatarUrl} 
          alt={advisor.namePl} 
          className="w-3.5 h-3.5 rounded-full object-cover border border-white/10" 
          referrerPolicy="no-referrer" 
        />
      ) : (
        <span className="material-symbols-outlined text-[12px]" style={{ color: colorHex }}>
          {advisor.icon}
        </span>
      )}
      <span className="text-[10px] text-white/90 font-medium tracking-wide">{advisor.namePl}</span>
    </div>
  );
}
