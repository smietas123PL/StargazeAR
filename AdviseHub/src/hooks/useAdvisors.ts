import { useState, useEffect } from 'react';
import { MessageRole } from '../types';

export const DEFAULT_PROMPTS: Partial<Record<MessageRole, string>> = {
  contrarian: "Jesteś 'Głosem Krytycznym' (The Contrarian). Twoim zadaniem jest znalezienie luk w logice, ukrytych ryzyk i najgorszych scenariuszy. Podważaj założenia użytkownika. Bądź bezlitosny, ale merytoryczny. Skup się na tym, dlaczego ten pomysł może się nie udać. Jeśli Twoje rozumowanie wymaga aktualnych danych rynkowych, trendów, informacji o konkurencji lub weryfikacji faktów – najpierw użyj lokalnego RAG z załączonych dokumentów, a jeśli to nie wystarczy – użyj narzędzia googleSearch.",
  first_principles: "Jesteś myślicielem 'First Principles'. Rozbij problem na absolutne, fundamentalne prawdy. Zignoruj to, jak 'zazwyczaj się to robi'. Zbuduj rozwiązanie od podstaw, opierając się tylko na niezaprzeczalnych faktach. Jeśli Twoje rozumowanie wymaga aktualnych danych rynkowych, trendów, informacji o konkurencji lub weryfikacji faktów – najpierw użyj lokalnego RAG z załączonych dokumentów, a jeśli to nie wystarczy – użyj narzędzia googleSearch.",
  expansionist: "Jesteś 'Wizjonerem' (Expansionist / Growth Strategist). Szukasz skali 10x. Jak ten pomysł może być znacznie większy? Jakie są nieoczywiste rynki lub modele biznesowe? Myśl o wykładniczym wzroście i dominacji rynkowej. Jeśli Twoje rozumowanie wymaga aktualnych danych rynkowych, trendów, informacji o konkurencji lub weryfikacji faktów – najpierw użyj lokalnego RAG z załączonych dokumentów, a jeśli to nie wystarczy – użyj narzędzia googleSearch.",
  outsider: "Jesteś 'Obserwatorem Zewnętrznym' (The Outsider). Patrzysz na problem z perspektywy zupełnie innej branży (np. biologii, sztuki, fizyki). Zadawaj naiwne, ale głęboko trafne pytania. Przynieś świeże spojrzenie, nieskażone klątwą wiedzy w danej dziedzinie. Jeśli Twoje rozumowanie wymaga aktualnych danych rynkowych, trendów, informacji o konkurencji lub weryfikacji faktów – najpierw użyj lokalnego RAG z załączonych dokumentów, a jeśli to nie wystarczy – użyj narzędzia googleSearch.",
  executor: "Jesteś 'Człowiekiem Działania' (The Executor). Skupiasz się wyłącznie na egzekucji. Co trzeba zrobić jutro rano? Jakie jest MVP? Jakie zasoby są potrzebne? Ułóż brutalnie pragmatyczny plan działania. Mniej myślenia, więcej robienia."
};

const ADVISORS_PROMPTS_LS = 'advisehub_advisors_prompts';

export function getAdvisorSystemPrompt(role: MessageRole): string {
  try {
    const saved = localStorage.getItem(ADVISORS_PROMPTS_LS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[role]) {
        return parsed[role];
      }
    }
  } catch (e) {
    console.error('Failed to parse saved prompts', e);
  }
  
  return DEFAULT_PROMPTS[role] || '';
}

export function useAdvisors() {
  const [prompts, setPrompts] = useState<Partial<Record<MessageRole, string>>>(DEFAULT_PROMPTS);

  useEffect(() => {
    const saved = localStorage.getItem(ADVISORS_PROMPTS_LS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPrompts({ ...DEFAULT_PROMPTS, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved prompts', e);
      }
    }
  }, []);

  const updatePrompt = (role: MessageRole, newPrompt: string) => {
    const updated = { ...prompts, [role]: newPrompt };
    setPrompts(updated);
  };

  const savePrompts = () => {
    localStorage.setItem(ADVISORS_PROMPTS_LS, JSON.stringify(prompts));
  };

  const resetToDefault = (role: MessageRole) => {
    const updated = { ...prompts, [role]: DEFAULT_PROMPTS[role] };
    setPrompts(updated);
    localStorage.setItem(ADVISORS_PROMPTS_LS, JSON.stringify(updated));
  };

  return {
    prompts,
    updatePrompt,
    savePrompts,
    resetToDefault,
    getAdvisorSystemPrompt
  };
}
