import React, { useState } from 'react';
import { useCustomAdvisors, AdvisorDef } from '../hooks/useCustomAdvisors';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useUserPlan } from '../hooks/useUserPlan';
import { UpgradeModal } from '../components/features/UpgradeModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

const COLOR_OPTIONS = [
  { name: 'Red', color: 'bg-red-500', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20', textClass: 'text-red-500' },
  { name: 'Blue', color: 'bg-blue-500', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20', textClass: 'text-blue-500' },
  { name: 'Purple', color: 'bg-purple-500', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20', textClass: 'text-purple-500' },
  { name: 'Emerald', color: 'bg-emerald-500', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', textClass: 'text-emerald-500' },
  { name: 'Amber', color: 'bg-amber-500', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', textClass: 'text-amber-500' },
  { name: 'Cyan', color: 'bg-cyan-500', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/20', textClass: 'text-cyan-500' },
  { name: 'Pink', color: 'bg-pink-500', bgClass: 'bg-pink-500/10', borderClass: 'border-pink-500/20', textClass: 'text-pink-500' },
];

const ICON_OPTIONS = ['person', 'psychology', 'gavel', 'architecture', 'rocket_launch', 'travel_explore', 'task_alt', 'lightbulb', 'strategy', 'balance'];

export default function CustomBoard() {
  const { allAdvisors, saveCustomAdvisor, deleteCustomAdvisor, loading } = useCustomAdvisors();
  const { checkFeatureAccess, isPro } = useUserPlan();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Partial<AdvisorDef> | null>(null);

  const handleOpenDialog = (advisor?: AdvisorDef) => {
    if (!checkFeatureAccess('customAdvisors')) {
      setShowUpgradeModal(true);
      return;
    }

    if (advisor) {
      setEditingAdvisor(advisor);
    } else {
      setEditingAdvisor({
        namePl: '',
        nameEn: 'Własny Doradca',
        description: '',
        systemPrompt: '',
        icon: 'person',
        color: COLOR_OPTIONS[0].color,
        bgClass: COLOR_OPTIONS[0].bgClass,
        borderClass: COLOR_OPTIONS[0].borderClass,
        textClass: COLOR_OPTIONS[0].textClass,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingAdvisor?.namePl || !editingAdvisor?.systemPrompt) {
      toast.error('Wypełnij wymagane pola (Nazwa i Prompt)');
      return;
    }

    try {
      await saveCustomAdvisor(editingAdvisor as any);
      toast.success('Doradca zapisany pomyślnie!');
      setIsDialogOpen(false);
    } catch (e) {
      toast.error('Błąd podczas zapisywania doradcy');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego doradcę?')) {
      try {
        await deleteCustomAdvisor(id);
        toast.success('Doradca usunięty');
      } catch (e) {
        toast.error('Błąd podczas usuwania');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Ładowanie...</div>;
  }

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full p-4 md:p-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline font-black text-white tracking-tight mb-2">
            Moja Rada
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base">
            Zarządzaj członkami swojej Rady Nadzorczej. Dodawaj nowych ekspertów z unikalnymi instrukcjami.
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-primary text-[#003851] hover:bg-primary/90 rounded-full px-8 h-12 font-bold shrink-0"
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
          Dodaj własnego doradcę
          {!isPro && (
            <span className="ml-2 text-[10px] bg-[#003851]/20 text-[#003851] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Pro</span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allAdvisors.map((advisor) => (
          <Card key={advisor.id} className="bg-surface-container-low/60 backdrop-blur-xl border-white/5 overflow-hidden relative group flex flex-col">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${advisor.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
            
            <div className="p-6 pl-8 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {advisor.avatarUrl ? (
                    <img src={advisor.avatarUrl} alt={advisor.namePl} className={`w-12 h-12 rounded-full border-2 ${advisor.borderClass} object-cover`} referrerPolicy="no-referrer" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${advisor.bgClass} border ${advisor.borderClass} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${advisor.textClass} text-2xl`}>{advisor.icon}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{advisor.namePl}</h3>
                    <p className="text-xs text-zinc-500 font-mono">{advisor.isCustom ? 'Własny Doradca' : advisor.nameEn}</p>
                  </div>
                </div>
                {advisor.isCustom && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(advisor)} className="h-8 w-8 text-zinc-400 hover:text-white">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(advisor.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-zinc-400 mb-4 flex-1">
                {advisor.description}
              </p>
              
              {!advisor.isCustom && (
                <div className="mt-auto pt-4 border-t border-white/5">
                  <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/5 text-zinc-400">Domyślny doradca</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-surface-container-high border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAdvisor?.id ? 'Edytuj doradcę' : 'Nowy doradca'}</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Imię i nazwisko / Rola (np. Dr Anna Kowalska - Ekspert Prawny) *</label>
              <Input 
                value={editingAdvisor?.namePl || ''} 
                onChange={e => setEditingAdvisor(prev => ({...prev, namePl: e.target.value}))}
                className="bg-surface-container-highest border-white/10 text-white"
                placeholder="Wpisz nazwę..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Krótki opis specjalizacji</label>
              <Input 
                value={editingAdvisor?.description || ''} 
                onChange={e => setEditingAdvisor(prev => ({...prev, description: e.target.value}))}
                className="bg-surface-container-highest border-white/10 text-white"
                placeholder="np. Analizuje ryzyka prawne i zgodność z regulacjami..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">URL Awatara (opcjonalnie)</label>
              <Input 
                value={editingAdvisor?.avatarUrl || ''} 
                onChange={e => setEditingAdvisor(prev => ({...prev, avatarUrl: e.target.value}))}
                className="bg-surface-container-highest border-white/10 text-white"
                placeholder="https://..."
              />
            </div>

            {!editingAdvisor?.avatarUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Ikona</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setEditingAdvisor(prev => ({...prev, icon}))}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${editingAdvisor?.icon === icon ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-highest border-white/5 text-zinc-400 hover:bg-white/10'}`}
                    >
                      <span className="material-symbols-outlined">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Kolor akcentu</label>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.name}
                    onClick={() => setEditingAdvisor(prev => ({
                      ...prev, 
                      color: opt.color,
                      bgClass: opt.bgClass,
                      borderClass: opt.borderClass,
                      textClass: opt.textClass
                    }))}
                    className={`w-8 h-8 rounded-full ${opt.color} border-2 transition-all ${editingAdvisor?.color === opt.color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Szczegółowy System Prompt *</label>
              <Textarea 
                value={editingAdvisor?.systemPrompt || ''} 
                onChange={e => setEditingAdvisor(prev => ({...prev, systemPrompt: e.target.value}))}
                className="min-h-[200px] bg-surface-container-highest border-white/10 text-white resize-y"
                placeholder="Jesteś ekspertem prawnym. Twoim zadaniem jest..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-zinc-400 hover:text-white">
              Anuluj
            </Button>
            <Button onClick={handleSave} className="bg-primary text-[#003851] hover:bg-primary/90 font-bold">
              Zapisz doradcę
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="Tworzenie własnych doradców" 
      />
    </div>
  );
}
