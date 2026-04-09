import { useState } from 'react';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Decision } from '../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../providers/AuthProvider';

export function useDecisionFollowUp() {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const createFollowUp = async (decision: Decision & { sessionId: string; sessionTitle: string }) => {
    if (!user) return null;
    setIsCreating(true);
    try {
      const daysDiff = Math.floor((Date.now() - decision.decidedAt) / (1000 * 60 * 60 * 24));
      const timeString = daysDiff >= 7 ? `${Math.floor(daysDiff / 7)} tygodni` : `${daysDiff} dni`;

      const prompt = `To jest follow-up sesji sprzed ${timeString}. Użytkownik podjął decyzję: ${decision.title}. Oczekiwany efekt: ${decision.expectedOutcome}. Aktualny rezultat: ${decision.actualOutcome || 'Brak danych'}. Oceń, czy decyzja była słuszna, co poszło dobrze/źle i co należy zrobić dalej.`;

      const sessionRef = await addDoc(collection(db, 'sessions'), {
        userId: user.uid,
        title: `Follow-up: ${decision.title}`,
        question: prompt,
        status: 'running',
        createdAt: Date.now(),
        fileUrls: [],
        participants: [user.uid],
        selectedAdvisors: []
      });

      await addDoc(collection(db, 'messages'), {
        sessionId: sessionRef.id,
        userId: user.uid,
        role: 'user',
        content: prompt,
        order: 0,
        timestamp: Date.now()
      });

      // Update decision in the original session
      const sessionDocRef = doc(db, 'sessions', decision.sessionId);
      const sessionSnap = await getDoc(sessionDocRef);
      
      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        const updatedDecisions = (sessionData.decisions || []).map((d: Decision) => 
          d.id === decision.id 
            ? { ...d, reviewed: true, reviewedAt: Date.now() } 
            : d
        );
        await updateDoc(sessionDocRef, { decisions: updatedDecisions });
      }

      toast.success('Utworzono sesję follow-up');
      navigate(`/session/${sessionRef.id}`);
      return sessionRef.id;
    } catch (error) {
      console.error('Błąd tworzenia follow-up:', error);
      toast.error('Nie udało się utworzyć sesji follow-up');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createFollowUp, isCreating };
}
