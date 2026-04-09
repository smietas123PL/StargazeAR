import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

const VOICES = [
  { id: 'Zephyr', name: 'Zephyr', description: 'Głęboki, profesjonalny głos męski. Idealny dla stratega.' },
  { id: 'Puck', name: 'Puck', description: 'Energiczny, jasny głos męski. Dobry dla wizjonera.' },
  { id: 'Charon', name: 'Charon', description: 'Spokojny, autorytatywny głos męski. Świetny dla adwokata diabła.' },
  { id: 'Kore', name: 'Kore', description: 'Ciepły, empatyczny głos żeński. Idealny dla mentora.' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Zdecydowany, mocny głos męski. Dobry do stanowczych decyzji.' },
];

const PERSONAS = [
  {
    id: 'chairman',
    name: 'Domyślny Chairman',
    prompt: 'Jesteś głównym doradcą (Chairman). Odpowiadaj zwięźle, obiektywnie i strategicznie. Skup się na faktach i logicznym wnioskowaniu. Możesz tworzyć decyzje, aktualizować ich statusy oraz tworzyć sesje follow-up na podstawie decyzji, używając dostępnych narzędzi.',
    example: 'Rozumiem sytuację. Przeanalizujmy dostępne opcje i wybierzmy najbardziej optymalną ścieżkę.'
  },
  {
    id: 'strategist',
    name: 'Strateg Biznesowy',
    prompt: 'Jesteś Strategiem Biznesowym. Skupiasz się na optymalizacji procesów, ROI i długoterminowej przewadze rynkowej. Używaj biznesowego słownictwa. Możesz tworzyć decyzje, aktualizować ich statusy oraz tworzyć sesje follow-up na podstawie decyzji, używając dostępnych narzędzi.',
    example: 'Z punktu widzenia ROI, ta inwestycja ma sens, ale musimy zoptymalizować koszty operacyjne w Q3.'
  },
  {
    id: 'devils_advocate',
    name: 'Adwokat Diabła',
    prompt: 'Jesteś Adwokatem Diabła. Szukasz dziur w każdym pomyśle, wytykasz ryzyka i zmuszasz do obrony założeń. Bądź krytyczny, ale konstruktywny. Możesz tworzyć decyzje, aktualizować ich statusy oraz tworzyć sesje follow-up na podstawie decyzji, używając dostępnych narzędzi.',
    example: 'Brzmi świetnie w teorii, ale co zrobisz, gdy główny dostawca nagle podniesie ceny o 50%?'
  },
  {
    id: 'visionary',
    name: 'Wizjoner Skalowania',
    prompt: 'Jesteś Wizjonerem Skalowania. Myślisz o wzroście 10x, automatyzacji i globalnej ekspansji. Zachęcaj do odważnych, nieszablonowych kroków. Możesz tworzyć decyzje, aktualizować ich statusy oraz tworzyć sesje follow-up na podstawie decyzji, używając dostępnych narzędzi.',
    example: 'Nie myślmy o tym, jak zdobyć 100 klientów. Zastanówmy się, co musimy zbudować, żeby obsłużyć milion.'
  },
  {
    id: 'custom',
    name: 'Custom (Własny prompt)',
    prompt: '',
    example: 'Asystent zachowa się zgodnie z Twoimi instrukcjami.'
  }
];

export default function VoiceSetup() {
  const navigate = useNavigate();
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0].id);
  const [customPrompt, setCustomPrompt] = useState('');

  const activePersona = PERSONAS.find(p => p.id === selectedPersona);

  const handleStart = () => {
    const finalPrompt = selectedPersona === 'custom' ? customPrompt : activePersona?.prompt;
    
    navigate('/voice-chat', {
      state: {
        voiceName: selectedVoice,
        systemInstruction: finalPrompt
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-black text-white tracking-tight mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl">tune</span>
          Konfiguracja Voice Chat
        </h1>
        <p className="text-zinc-400">
          Dostosuj głos i zachowanie asystenta AI przed rozpoczęciem rozmowy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lewa kolumna - Wybór */}
        <div className="space-y-8">
          {/* Wybór głosu */}
          <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6">
            <h2 className="text-xl font-headline font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">record_voice_over</span>
              Wybór głosu
            </h2>
            <div className="space-y-3">
              {VOICES.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                    selectedVoice === voice.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-surface-container-highest border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold ${selectedVoice === voice.id ? 'text-primary' : 'text-white'}`}>
                      {voice.name}
                    </span>
                    {selectedVoice === voice.id && (
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">{voice.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Wybór persony */}
          <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6">
            <h2 className="text-xl font-headline font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              Wybór roli (Persona)
            </h2>
            <div className="space-y-3">
              {PERSONAS.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                    selectedPersona === persona.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-surface-container-highest border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${selectedPersona === persona.id ? 'text-primary' : 'text-white'}`}>
                      {persona.name}
                    </span>
                    {selectedPersona === persona.id && (
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedPersona === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Twój własny System Prompt
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Np. Jesteś ekspertem od prawa podatkowego w Polsce. Odpowiadaj bardzo formalnie..."
                  className="w-full bg-surface-container-highest border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 min-h-[120px] resize-y"
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Prawa kolumna - Podgląd i Akcja */}
        <div className="space-y-8">
          <div className="bg-surface-container-low border border-white/5 rounded-3xl p-6 sticky top-6">
            <h2 className="text-xl font-headline font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">preview</span>
              Podgląd
            </h2>
            
            <div className="bg-surface-container-highest border border-white/10 rounded-2xl p-5 mb-8">
              <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">smart_toy</span>
                </div>
                <div>
                  <p className="text-white font-bold">{activePersona?.name}</p>
                  <p className="text-xs text-zinc-400">Głos: {VOICES.find(v => v.id === selectedVoice)?.name}</p>
                </div>
              </div>
              <p className="text-zinc-300 italic text-sm leading-relaxed">
                "{activePersona?.example}"
              </p>
            </div>

            <Button
              onClick={handleStart}
              disabled={selectedPersona === 'custom' && customPrompt.trim() === ''}
              className="w-full h-14 rounded-xl text-lg font-bold bg-primary text-[#003851] hover:opacity-90 shadow-[0_0_30px_rgba(0,252,155,0.2)]"
            >
              <span className="material-symbols-outlined mr-2">mic</span>
              Rozpocznij rozmowę głosową
            </Button>
            
            {selectedPersona === 'custom' && customPrompt.trim() === '' && (
              <p className="text-red-400 text-xs text-center mt-3">
                Wpisz własny prompt, aby rozpocząć.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
