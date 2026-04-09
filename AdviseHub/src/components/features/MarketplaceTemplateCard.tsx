import React from 'react';
import { Button } from '../ui/button';

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  advisorsCount: number;
  rating: number;
  downloads: number;
  type: 'official' | 'community';
  author: string;
  advisors: any[];
}

interface Props {
  template: MarketplaceTemplate;
  onUseTemplate: (template: MarketplaceTemplate) => void;
  isApplying: boolean;
}

export function MarketplaceTemplateCard({ template, onUseTemplate, isApplying }: Props) {
  return (
    <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-all flex flex-col h-full group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${template.type === 'official' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
              {template.type === 'official' ? 'Oficjalny' : 'Społeczność'}
            </span>
            <span className="text-xs text-zinc-500">od {template.author}</span>
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{template.name}</h3>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-highest px-2 py-1 rounded-lg">
          <span className="material-symbols-outlined text-yellow-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-sm font-bold text-white">{template.rating.toFixed(1)}</span>
        </div>
      </div>
      
      <p className="text-sm text-zinc-400 mb-6 flex-1">{template.description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>{template.advisorsCount} doradców</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>{template.downloads}</span>
          </div>
        </div>
        <Button 
          onClick={() => onUseTemplate(template)}
          disabled={isApplying}
          className="bg-surface-container-high text-white hover:bg-primary hover:text-[#003851] transition-colors rounded-xl h-9 px-4 text-xs font-bold"
        >
          {isApplying ? 'Ładowanie...' : 'Użyj szablonu'}
        </Button>
      </div>
    </div>
  );
}
