import React from 'react';
import { Button } from '../ui/button';
import { AdvisorDef } from '../../hooks/useCustomAdvisors';

interface TemplateAdvisor extends Omit<AdvisorDef, 'id' | 'isCustom'> {
  isExisting?: boolean;
  id?: string;
}

export interface AdvisorTemplate {
  id: string;
  name: string;
  description: string;
  advisors: TemplateAdvisor[];
}

interface AdvisorTemplateCardProps {
  template: AdvisorTemplate;
  onUseTemplate: (template: AdvisorTemplate) => void;
  isApplying: boolean;
}

export function AdvisorTemplateCard({ template, onUseTemplate, isApplying }: AdvisorTemplateCardProps) {
  return (
    <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-all group flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
          {template.name}
        </h3>
        <p className="text-sm text-zinc-400 line-clamp-2">
          {template.description}
        </p>
      </div>

      <div className="flex-1 mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Skład Rady ({template.advisors.length})</h4>
        <div className="space-y-3">
          {template.advisors.map((advisor, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${advisor.bgClass} ${advisor.borderClass} border`}>
                <span className={`material-symbols-outlined text-[16px] ${advisor.textClass}`}>
                  {advisor.icon}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{advisor.namePl}</p>
                <p className="text-xs text-zinc-500 line-clamp-1">{advisor.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onUseTemplate(template)}
        disabled={isApplying}
        className="w-full bg-surface-container-high hover:bg-primary hover:text-[#003851] text-white border border-white/10 hover:border-primary transition-all font-bold group-hover:shadow-[0_0_20px_rgba(0,252,155,0.2)]"
      >
        {isApplying ? (
          <span className="material-symbols-outlined animate-spin mr-2">autorenew</span>
        ) : (
          <span className="material-symbols-outlined mr-2">group_add</span>
        )}
        {isApplying ? 'Przygotowywanie...' : 'Użyj tego szablonu'}
      </Button>
    </div>
  );
}
