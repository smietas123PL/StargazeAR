import { useState } from 'react';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { SessionMessage } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { useDocumentRAG } from './useDocumentRAG';

export function useRunPeerReview(sessionId: string) {
  const { user } = useAuth();
  const { getRelevantVaultChunks } = useDocumentRAG();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPeerReview = async (messages: SessionMessage[], fullContext?: string) => {
    if (!user) return;
    setIsRunning(true);
    setError(null);

    try {
      // Wybierz tylko odpowiedzi doradców (bez usera, peer_review, chairmana)
      const advisorMessages = messages.filter(m => 
        !['user', 'peer_review', 'chairman'].includes(m.role)
      );

      // Anonimizacja (przypisanie liter A, B, C...)
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      let anonymizedContext = '';
      
      advisorMessages.forEach((msg, idx) => {
        anonymizedContext += `Odpowiedź ${letters[idx] || idx}:\n${msg.content}\n\n`;
      });

      // Fetch vault chunks based on the first user message (question)
      const userMessage = messages.find(m => m.role === 'user');
      let vaultContext = '';
      if (userMessage) {
        const vaultChunks = await getRelevantVaultChunks(user.uid, userMessage.content, 3);
        if (vaultChunks.length > 0) {
          const groupedVaultChunks: Record<string, string[]> = {};
          vaultChunks.forEach(chunk => {
            if (!groupedVaultChunks[chunk.documentName]) {
              groupedVaultChunks[chunk.documentName] = [];
            }
            groupedVaultChunks[chunk.documentName].push(chunk.text);
          });

          for (const [docName, chunks] of Object.entries(groupedVaultChunks)) {
            vaultContext += `--- Fragmenty z Bazy Wiedzy: ${docName} ---\n${chunks.join('\n...\n')}\n-------------------\n\n`;
          }
        }
      }

      const contextSection = fullContext ? `Kontekst i pytanie użytkownika:\n${fullContext}\n\n` : '';
      const finalContextSection = vaultContext ? `${contextSection}Znalezione powiązane fragmenty z Bazy Wiedzy:\n${vaultContext}\n\n` : contextSection;

      const prompt = `${finalContextSection}Oto anonimowe odpowiedzi doradców na problem użytkownika:\n\n${anonymizedContext}\n\nJako niezależny recenzent (Peer Reviewer), przeanalizuj te odpowiedzi i odpowiedz na 3 pytania:\n1. Która odpowiedź jest najmocniejsza i dlaczego?\n2. Która odpowiedź ma największą ślepą plamę i dlaczego?\n3. Czego WSZYSTKIE odpowiedzi całkowicie przegapiły?`;

      const generateAdvisorResponseFn = httpsCallable(functions, 'generateAdvisorResponse');
      const response = await generateAdvisorResponseFn({
        prompt,
        systemInstruction: "Jesteś bezstronnym, analitycznym recenzentem. Oceniasz pomysły innych ekspertów. Bądź zwięzły, obiektywny i wnikliwy.",
        temperature: 0.7
      });

      const responseText = (response.data as any).text || "Brak odpowiedzi z Peer Review.";

      const messageRef = doc(collection(db, `sessions/${sessionId}/messages`));
      const message: SessionMessage = {
        id: messageRef.id,
        sessionId,
        userId: user.uid,
        role: 'peer_review',
        content: responseText,
        order: 6,
        timestamp: Date.now(),
      };

      await setDoc(messageRef, message);
      
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, { status: 'peer_review_completed' });

    } catch (err: any) {
      console.error('Błąd podczas Peer Review:', err);
      setError(err.message || 'Wystąpił błąd podczas recenzji.');
    } finally {
      setIsRunning(false);
    }
  };

  return { runPeerReview, isRunning, error };
}
