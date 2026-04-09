import { Card } from '../ui/card';
import { AdvisorDef } from '../../hooks/useCustomAdvisors';

interface AdvisorSelectionCardProps {
  advisor: AdvisorDef;
  isSelected: boolean;
  onClick: () => void;
}

export function AdvisorSelectionCard({ advisor, isSelected, onClick }: AdvisorSelectionCardProps) {
  const colorHex = advisor.color.includes('red') ? '#ef4444' : 
                   advisor.color.includes('blue') ? '#3b82f6' :
                   advisor.color.includes('purple') ? '#a855f7' :
                   advisor.color.includes('emerald') ? '#10b981' :
                   advisor.color.includes('amber') ? '#f59e0b' :
                   advisor.color.includes('cyan') ? '#06b6d4' :
                   advisor.color.includes('pink') ? '#ec4899' : '#00fc9b';

  return (
    <Card 
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 group ${
        isSelected 
          ? 'border-2 border-primary shadow-[0_8px_30px_rgba(0,252,155,0.15)]' 
          : 'bg-surface-container-low/60 border border-white/5 hover:border-white/20 hover:shadow-2xl'
      }`}
      style={{
        backgroundColor: isSelected ? `${colorHex}10` : undefined,
        backgroundImage: !isSelected ? `linear-gradient(to bottom right, transparent, ${colorHex}05)` : undefined
      }}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2"
        style={{ 
          backgroundColor: colorHex, 
          boxShadow: isSelected ? `0 0 15px ${colorHex}` : `0 0 5px ${colorHex}` 
        }}
      />
      
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[#003851] shadow-[0_0_10px_rgba(0,252,155,0.5)] animate-in zoom-in duration-200">
          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
        </div>
      )}
      
      <div className="p-5 pl-7">
        <div className="flex items-center gap-4 mb-4">
          {advisor.avatarUrl ? (
            <img 
              src={advisor.avatarUrl} 
              alt={advisor.namePl} 
              className="w-14 h-14 rounded-full border-2 border-white/10 object-cover shrink-0 shadow-md" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-surface-container-highest border border-white/10 shadow-inner shrink-0">
              <span className="material-symbols-outlined text-2xl" style={{ color: colorHex }}>{advisor.icon}</span>
            </div>
          )}
          <div className="flex flex-col pr-6">
            <span className="text-base font-bold text-white leading-tight group-hover:text-primary transition-colors">{advisor.namePl}</span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant leading-tight mt-1">{advisor.nameEn}</span>
          </div>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
          {advisor.description}
        </p>
      </div>
    </Card>
  );
}
