import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export function UpgradeModal({ isOpen, onClose, featureName }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-surface-container-high border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">workspace_premium</span>
            Przejdź na plan Pro
          </DialogTitle>
          <DialogDescription className="text-zinc-400 mt-2">
            Funkcja <strong className="text-white">{featureName}</strong> jest dostępna tylko w planie Pro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-sm text-zinc-300">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Nielimitowana liczba sesji
            </li>
            <li className="flex items-start gap-2 text-sm text-zinc-300">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Analiza własnych dokumentów (PDF, TXT, MD)
            </li>
            <li className="flex items-start gap-2 text-sm text-zinc-300">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Tworzenie własnych, spersonalizowanych doradców
            </li>
          </ul>
          
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-center">
            <p className="text-sm text-zinc-300">Już od <span className="text-white font-bold text-lg">59 zł</span>/miesiąc</p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
            Anuluj
          </Button>
          <Button onClick={handleUpgrade} className="bg-gradient-to-r from-primary to-secondary text-[#003851] font-bold">
            Ulepsz konto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
