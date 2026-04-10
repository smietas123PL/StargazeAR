import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DocumentUpload, AttachedFile } from '../components/features/DocumentUpload';
import { useCreateSession, LAST_SELECTED_ADVISORS_KEY } from '../hooks/useCreateSession';
import { useCustomAdvisors } from '../hooks/useCustomAdvisors';
import { AdvisorSelectionCard } from '../components/features/AdvisorSelectionCard';
import { useUserPlan } from '../hooks/useUserPlan';
import { UpgradeModal } from '../components/features/UpgradeModal';

export default function Home() {
  const location = useLocation();
  const [question, setQuestion] = useState(location.state?.question || '');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const { createSession, isCreating, error } = useCreateSession();
  const { allAdvisors, loading: advisorsLoading } = useCustomAdvisors();
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>(location.state?.selectedAdvisors || []);
  const [hasLastBoard, setHasLastBoard] = useState(false);
  
  const { checkFeatureAccess, maxFreeSessions, completedSessionsThisMonth, isPro } = useUserPlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    goal: '',
    knowledge: '',
    blocker: ''
  });

  const wizardSteps = useMemo(() => [
    {
      id: 1,
      title: "Jaki jest Twój główny cel?",
      description: "np. zwiększenie przychodów, zredukowanie ryzyka, wybór między opcjami",
      field: 'goal' as const,
      placeholder: "Mój główny cel to..."
    },
    {
      id: 2,
      title: "Jakie masz już informacje lub przekonania na ten temat?",
      description: "Opisz co już wiesz lub co podpowiada Ci intuicja.",
      field: 'knowledge' as const,
      placeholder: "Obecnie wiem, że..."
    },
    {
      id: 3,
      title: "Co blokuje Cię przed podjęciem decyzji już teraz?",
      description: "Zidentyfikuj główne przeszkody lub wątpliwości.",
      field: 'blocker' as const,
      placeholder: "Blokuje mnie..."
    }
  ], []);

  const currentWizardStep = wizardSteps[wizardStep - 1];

  // Initialize selected advisors to all available advisors when they load
  useEffect(() => {
    if (allAdvisors.length > 0 && selectedAdvisors.length === 0) {
      if (location.state?.selectedAdvisors) {
        setSelectedAdvisors(location.state.selectedAdvisors);
        return;
      }
      
      const saved = localStorage.getItem(LAST_SELECTED_ADVISORS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const validSaved = parsed.filter((id: string) => allAdvisors.some(a => a.id === id));
          if (validSaved.length >= 3) {
            setHasLastBoard(true);
            // If coming from "Zmiana rady", we might want to just show all by default or last used.
            // Let's default to all, but let them use the "Use last board" button.
            setSelectedAdvisors(allAdvisors.map(a => a.id));
            return;
          }
        } catch (e) {}
      }
      setSelectedAdvisors(allAdvisors.map(a => a.id));
    }
  }, [allAdvisors, location.state]);

  const handleUseLastBoard = () => {
    const saved = localStorage.getItem(LAST_SELECTED_ADVISORS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validSaved = parsed.filter((id: string) => allAdvisors.some(a => a.id === id));
        if (validSaved.length >= 3) {
          setSelectedAdvisors(validSaved);
        }
      } catch (e) {}
    }
  };

  const handleToggleAdvisor = (id: string) => {
    setSelectedAdvisors(prev => {
      if (prev.includes(id)) {
        return prev.filter(a => a !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleStartSession = () => {
    if (selectedAdvisors.length < 3) {
      return;
    }
    
    if (!checkFeatureAccess('unlimitedSessions')) {
      setUpgradeFeature('Nielimitowana liczba sesji');
      setShowUpgradeModal(true);
      return;
    }
    
    setIsWizardOpen(true);
    setWizardStep(1);
    setWizardData({ goal: '', knowledge: '', blocker: '' });
  };

  const handleWizardNext = async () => {
    if (wizardStep < 3) {
      setWizardStep(prev => prev + 1);
    } else {
      await finalizeAndCreateSession();
    }
  };

  const handleWizardSkip = async () => {
    setWizardData(prev => ({ ...prev, [currentWizardStep.field]: '' }));
    if (wizardStep < 3) {
      setWizardStep(prev => prev + 1);
    } else {
      await finalizeAndCreateSession();
    }
  };

  const finalizeAndCreateSession = async () => {
    const { goal, knowledge, blocker } = wizardData;
    const finalQuestion = `${question}\n\n--- Dodatkowy kontekst ---\nCel: ${goal || 'Nie podano'}\nObecna wiedza: ${knowledge || 'Nie podano'}\nBlokery: ${blocker || 'Nie podano'}`;
    
    setIsWizardOpen(false);
    await createSession(finalQuestion, attachedFiles, selectedAdvisors);
  };

  const exampleDecisions = [
    {
      title: 'Analiza ryzyka inwestycyjnego',
      description: 'Przedstaw projekt i poproś o krytykę.',
      color: '#C24C2C',
      icon: 'warning'
    },
    {
      title: 'Strategia rozwoju produktu',
      description: 'Zderz wizje z rynkową rzeczywistością.',
      color: '#4A3C9C',
      icon: 'lightbulb'
    },
    {
      title: 'Optymalizacja procesów',
      description: 'Rozbij złożone operacje na czynniki pierwsze.',
      color: '#1B8C6C',
      icon: 'trending_up'
    }
  ];

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
      
      {/* 4-Step Flow Indicator */}
      <div className="w-full bg-surface-container-low/50 backdrop-blur-md rounded-3xl p-4 mb-12 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between w-full gap-2">
          {/* Step 1: Active */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-surface-container-lowest font-bold shadow-[0_0_20px_rgba(0,252,155,0.4)] border-2 border-primary">
              1
            </div>
            <span className="text-[10px] font-label font-bold uppercase tracking-wider text-primary text-center leading-tight">
              Pytanie +<br/>kontekst
            </span>
          </div>
          <div className="h-[2px] flex-1 bg-primary/30 rounded-full"></div>
          
          {/* Step 2 */}
          <div className="flex flex-col items-center flex-1 gap-2 opacity-50">
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant/50 flex items-center justify-center text-outline-variant font-bold">
              2
            </div>
            <span className="text-[10px] font-label uppercase tracking-wider text-outline-variant text-center leading-tight">
              Obrady<br/>Rady
            </span>
          </div>
          <div className="h-[2px] flex-1 bg-outline-variant/20 rounded-full"></div>
          
          {/* Step 3 */}
          <div className="flex flex-col items-center flex-1 gap-2 opacity-50">
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant/50 flex items-center justify-center text-outline-variant font-bold">
              3
            </div>
            <span className="text-[10px] font-label uppercase tracking-wider text-outline-variant text-center leading-tight">
              Anonimowy<br/>Peer Review
            </span>
          </div>
          <div className="h-[2px] flex-1 bg-outline-variant/20 rounded-full"></div>
          
          {/* Step 4 */}
          <div className="flex flex-col items-center flex-1 gap-2 opacity-50">
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant/50 flex items-center justify-center text-outline-variant font-bold">
              4
            </div>
            <span className="text-[10px] font-label uppercase tracking-wider text-outline-variant text-center leading-tight">
              Chairman<br/>Synthesis
            </span>
          </div>
        </div>
      </div>

      {/* Center Identity */}
      <div className="mb-12 relative group text-center">
        <div className="absolute inset-0 blur-[80px] bg-primary/10 rounded-full group-hover:bg-primary/20 transition-all duration-1000"></div>
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-[2rem] bg-surface-container/60 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <span className="material-symbols-outlined text-5xl text-primary drop-shadow-[0_0_15px_rgba(0,252,155,0.4)]" style={{ fontVariationSettings: "'FILL' 1" }}>
            hub
          </span>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Witaj w AdviseHub
        </h1>
        <p className="font-body text-on-surface-variant text-lg max-w-md mx-auto leading-relaxed">
          Twoja osobista Rada Doradcza AI.<br/>
          <span className="text-sm opacity-80">Jaką decyzję chcesz skonsultować z naszym zespołem ekspertów AI?</span>
        </p>
      </div>

      {/* Example Decisions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
        {exampleDecisions.map((example, idx) => (
          <Card 
            key={idx}
            onClick={() => setQuestion(example.title)}
            className="bg-surface-container-low/60 backdrop-blur-2xl border-white/5 hover:border-white/20 hover:bg-surface-container-high transition-all cursor-pointer group overflow-hidden relative"
          >
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5 shadow-[0_0_10px_currentColor]"
              style={{ backgroundColor: example.color, color: example.color }}
            />
            <div className="p-5 pl-6">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-xl" style={{ color: example.color }}>{example.icon}</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors mb-1">
                {example.title}
              </h3>
              <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                {example.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Input Area */}
      <div className="w-full bg-surface-container-highest/40 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/10 mb-8">
        <div className="mb-2">
          <Textarea 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-transparent border-none focus-visible:ring-0 text-white placeholder-zinc-500 resize-none font-body text-base min-h-[120px] px-2" 
            placeholder="Opisz kontekst swojej decyzji..."
            disabled={isCreating}
          />
        </div>
        <p className="text-xs text-zinc-500 px-2 mb-4 italic">
          Opisz problem jak najdokładniej – im więcej kontekstu, tym lepsza rada.
        </p>
        
        <div className="mt-6 border-t border-white/5 pt-6">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-primary text-[18px]">attach_file</span>
            Załącz dokumenty do analizy
            {!isPro && (
              <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-primary/30">Pro</span>
            )}
          </h3>
          <DocumentUpload 
            files={attachedFiles} 
            onChange={setAttachedFiles} 
            disabled={!checkFeatureAccess('documents')}
            onUpgradeRequest={() => {
              setUpgradeFeature('Analiza własnych dokumentów');
              setShowUpgradeModal(true);
            }}
          />
        </div>
      </div>

      {/* Advisor Selection */}
      <div className="w-full bg-surface-container-low/50 backdrop-blur-md rounded-3xl p-6 mb-8 border border-white/5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Wybierz Radę do tej sesji
              {!isPro && (
                <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-primary/30">Pro</span>
              )}
            </h3>
            <p className="text-sm text-zinc-400">
              Możesz wybrać od 3 do wszystkich dostępnych doradców. Każdy z nich wniesie unikalną perspektywę.
            </p>
          </div>
          {hasLastBoard && (
            <Button 
              onClick={handleUseLastBoard} 
              variant="outline" 
              size="sm"
              className="shrink-0 border-white/10 hover:bg-white/5 text-zinc-300"
            >
              <span className="material-symbols-outlined text-[18px] mr-2">history</span>
              Użyj ostatniej rady
            </Button>
          )}
        </div>
        
        {advisorsLoading ? (
          <div className="text-zinc-500 text-sm">Ładowanie doradców...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allAdvisors.map(advisor => (
              <AdvisorSelectionCard 
                key={advisor.id}
                advisor={advisor}
                isSelected={selectedAdvisors.includes(advisor.id)}
                onClick={() => handleToggleAdvisor(advisor.id)}
              />
            ))}
          </div>
        )}
        
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <p className="text-sm text-zinc-400">
            Wybrano <strong className={selectedAdvisors.length >= 3 ? 'text-primary' : 'text-red-400'}>{selectedAdvisors.length}</strong> z {allAdvisors.length} doradców (minimum 3)
          </p>
        </div>
      </div>

      {/* Start Button */}
      <div className="w-full flex flex-col items-center mb-12">
        {!isPro && completedSessionsThisMonth >= maxFreeSessions ? (
          <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center mb-4">
            <span className="material-symbols-outlined text-red-400 text-3xl mb-2">warning</span>
            <h3 className="text-white font-bold mb-2">Wykorzystano limit sesji</h3>
            <p className="text-sm text-zinc-400 mb-4">
              W planie Free możesz przeprowadzić maksymalnie {maxFreeSessions} sesji w miesiącu. 
              Przejdź na plan Pro, aby uzyskać nielimitowany dostęp.
            </p>
            <Button 
              onClick={() => {
                setUpgradeFeature('Nielimitowana liczba sesji');
                setShowUpgradeModal(true);
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary text-[#003851] font-bold"
            >
              Ulepsz konto do Pro
            </Button>
          </div>
        ) : (
          <>
            <div className="text-sm text-zinc-400 mb-4 text-center">
              Rada przeanalizuje Twoje pytanie oraz załączone dokumenty.
              {!isPro && (
                <div className="mt-2 flex flex-col items-center gap-2">
                  {completedSessionsThisMonth === 1 && (
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold uppercase tracking-wider"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Ostatnia bezpłatna sesja w tym miesiącu
                    </motion.div>
                  )}
                  <span className="text-xs text-primary/80">
                    Wykorzystano {completedSessionsThisMonth} z {maxFreeSessions} bezpłatnych sesji. Plan Pro — nielimitowany dostęp od 59 zł/mies.
                  </span>
                </div>
              )}
            </div>
            <Button 
              type="button"
              onClick={handleStartSession}
              disabled={isCreating || !question.trim() || selectedAdvisors.length < 3}
              className="w-full max-w-md h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-[#003851] font-headline font-extrabold text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,252,155,0.3)] hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isCreating ? (
                <span className="material-symbols-outlined text-2xl mr-2 animate-spin">autorenew</span>
              ) : (
                <span className="material-symbols-outlined text-2xl mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              )}
              {isCreating ? 'Inicjalizacja...' : 'Rozpocznij Sesję Doradczą'}
            </Button>
          </>
        )}
        {error && <p className="text-red-400 text-sm mt-4 text-center font-bold">{error}</p>}
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName={upgradeFeature} 
      />

      {/* Context Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-surface-container-high border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(wizardStep / 3) * 100}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                />
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    Krok {wizardStep} z 3
                  </span>
                  <button 
                    onClick={() => setIsWizardOpen(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-headline font-black text-white mb-3 leading-tight">
                  {currentWizardStep.title}
                </h2>
                <p className="text-zinc-400 text-sm md:text-base">
                  {currentWizardStep.description}
                </p>
              </div>

              <div className="mb-10">
                <Textarea 
                  value={wizardData[currentWizardStep.field]}
                  onChange={(e) => setWizardData(prev => ({ ...prev, [currentWizardStep.field]: e.target.value.slice(0, 300) }))}
                  className="w-full bg-surface-container-highest/50 border-white/10 focus:border-primary/50 text-white placeholder-zinc-600 resize-none font-body text-lg min-h-[160px] p-6 rounded-2xl transition-all"
                  placeholder={currentWizardStep.placeholder}
                  autoFocus
                />
                <div className="flex justify-end mt-2">
                  <span className={cn(
                    "text-[10px] font-mono",
                    wizardData[currentWizardStep.field].length >= 300 ? "text-red-400" : "text-zinc-500"
                  )}>
                    {wizardData[currentWizardStep.field].length} / 300
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  onClick={handleWizardNext}
                  className="w-full sm:flex-1 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-[#003851] font-headline font-extrabold text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                >
                  {wizardStep === 3 ? 'Zakończ i wyślij' : 'Dalej'}
                  <span className="material-symbols-outlined ml-2">arrow_forward</span>
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleWizardSkip}
                  className="w-full sm:w-auto px-8 h-14 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 font-bold"
                >
                  Pomiń ten krok
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
