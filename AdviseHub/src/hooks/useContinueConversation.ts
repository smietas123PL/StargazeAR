import { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { SessionMessage } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { toast } from 'sonner';

export function useContinueConversation(sessionId: string) {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string, existingMessages: SessionMessage[]) => {
    if (!user || !text.trim()) return;
    setIsSending(true);
    setError(null);

    try {
      // 1. Ustalenie kolejności (order)
      const nextOrder = existingMessages.length > 0 
        ? Math.max(...existingMessages.map(m => m.order)) + 1 
        : 1;

      // 2. Zapis wiadomości użytkownika
      const userMsgRef = doc(collection(db, `sessions/${sessionId}/messages`));
      const userMessage: SessionMessage = {
        id: userMsgRef.id,
        sessionId,
        userId: user.uid,
        role: 'user',
        content: text,
        order: nextOrder,
        timestamp: Date.now(),
      };
      await setDoc(userMsgRef, userMessage);

      // 3. Przygotowanie kontekstu dla Gemini
      let transcript = "Zapis dotychczasowej sesji (Rada Doradców i rozmowa):\n\n";
      existingMessages.forEach(msg => {
        transcript += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
      });
      transcript += `[USER]: ${text}\n\n`;

      const prompt = `${transcript}Jako Przewodniczący Rady (The Chairman), odpowiedz na najnowszą wiadomość użytkownika. Pamiętaj o dotychczasowych ustaleniach i swoim ostatecznym werdykcie. Bądź zwięzły, konkretny i utrzymuj swój autorytatywny, decyzyjny ton.`;

      // 4. Wywołanie Gemini via Cloud Functions
      const generateAdvisorResponseFn = httpsCallable(functions, 'generateAdvisorResponse');
      const response = await generateAdvisorResponseFn({
        prompt,
        systemInstruction: "Jesteś Przewodniczącym Rady (The Chairman). Jesteś autorytetem, podejmujesz ostateczne decyzje. Mówisz krótko, stanowczo i z absolutną pewnością. Kontynuujesz rozmowę z użytkownikiem po wydaniu głównego werdyktu, odpowiadając na jego pytania lub wątpliwości.",
        temperature: 0.7
      });

      const responseText = (response.data as any).text || "Brak odpowiedzi.";

      // 5. Zapis odpowiedzi Chairmana
      const chairmanMsgRef = doc(collection(db, `sessions/${sessionId}/messages`));
      const chairmanMessage: SessionMessage = {
        id: chairmanMsgRef.id,
        sessionId,
        userId: user.uid,
        role: 'chairman',
        content: responseText,
        order: nextOrder + 1,
        timestamp: Date.now(),
      };
      await setDoc(chairmanMsgRef, chairmanMessage);

    } catch (err: any) {
      console.error('Błąd podczas wysyłania wiadomości:', err);
      if (err.code === 'functions/resource-exhausted' || err.message?.includes('Rate limit exceeded')) {
        const msg = "Osiągnąłeś limit zapytań w tym miesiącu. Przejdź na Pro lub poczekaj.";
        toast.error(msg);
        setError(msg);
      } else {
        setError(err.message || 'Wystąpił błąd podczas komunikacji.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return { sendMessage, isSending, error };
}
