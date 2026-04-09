import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  isPro?: boolean;
  buttonText: string;
  onButtonClick: () => void;
}

export function PricingCard({
  title,
  price,
  period = '/ miesiąc',
  description,
  features,
  isPro = false,
  buttonText,
  onButtonClick
}: PricingCardProps) {
  return (
    <Card className={`relative flex flex-col p-8 bg-surface-container-low/60 backdrop-blur-xl overflow-hidden transition-all duration-300 ${
      isPro 
        ? 'border-primary/50 shadow-[0_0_40px_rgba(0,252,155,0.15)] scale-105 z-10' 
        : 'border-white/10 hover:border-white/20'
    }`}>
      {isPro && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
          <div className="absolute top-4 right-4 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            Najczęściej wybierany
          </div>
        </>
      )}
      
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 min-h-[40px]">{description}</p>
      </div>
      
      <div className="mb-8 flex items-baseline gap-1">
        <span className="text-4xl font-headline font-black text-white">{price}</span>
        {price !== 'Darmowy' && <span className="text-sm text-zinc-500 font-medium">{period}</span>}
      </div>
      
      <ul className="flex-1 space-y-4 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
            <span className={`material-symbols-outlined text-[18px] shrink-0 ${isPro ? 'text-primary' : 'text-zinc-500'}`}>
              check_circle
            </span>
            <span className="leading-tight">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        onClick={onButtonClick}
        className={`w-full h-12 rounded-full font-bold uppercase tracking-wide text-sm transition-all ${
          isPro 
            ? 'bg-gradient-to-r from-primary to-secondary text-[#003851] shadow-[0_0_20px_rgba(0,252,155,0.3)] hover:opacity-90' 
            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
        }`}
      >
        {buttonText}
      </Button>
    </Card>
  );
}
