import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveVoiceService } from '../services/ai/liveVoiceService';
import { voiceChatDb } from '../services/firebase/voiceChatDb';
import { useAuth } from '../providers/AuthProvider';
import { useUserSessions } from './useUserSessions';
import { useDecisionFollowUp } from './useDecisionFollowUp';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Decision, DecisionStatus } from '../types';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

/**
 * useVoiceChat - Hook Reacta zarządzający stanem czatu głosowego.
 * Architektura:
 * - Izoluje logikę biznesową (LiveVoiceService) od komponentów UI.
 * - Przechowuje stan połączenia (idle, connecting, connected, error) oraz historię wiadomości (transkrypcje).
 * - Zapewnia bezpieczne zarządzanie cyklem życia serwisu (inicjalizacja, łączenie, rozłączanie, czyszczenie przy odmontowaniu).
 * - Integruje się z Firebase (voiceChatDb) w celu persystencji danych.
 * - Obsługuje Function Calling (akcje na decyzjach i sesjach).
 */
export function useVoiceChat() {
  const { user } = useAuth();
  const { sessions } = useUserSessions();
  const { createFollowUp } = useDecisionFollowUp();
  const [state, setState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const serviceRef = useRef<LiveVoiceService | null>(null);

  // Load history on mount
  useEffect(() => {
    if (user) {
      voiceChatDb.getHistory(user.uid).then(history => {
        if (history.length > 0) {
          setMessages(history);
        }
      });
    }
  }, [user]);

  const handleFunctionCall = useCallback(async (name: string, args: any) => {
    try {
      switch (name) {
        case 'createDecision': {
          if (!sessions || sessions.length === 0) {
            return { success: false, error: "Brak aktywnej sesji, aby dodać decyzję." };
          }
          const currentSession = sessions[0]; // Bierzemy najnowszą sesję
          const newDecision: Decision = {
            id: Date.now().toString(),
            title: args.title,
            description: args.description,
            expectedOutcome: args.expectedOutcome,
            status: 'planned',
            decidedAt: Date.now()
          };
          
          const sessionRef = doc(db, 'sessions', currentSession.id);
          const updatedDecisions = [...(currentSession.decisions || []), newDecision];
          await updateDoc(sessionRef, { decisions: updatedDecisions });
          
          return { success: true, decisionId: newDecision.id, message: "Decyzja została pomyślnie utworzona." };
        }
        
        case 'updateDecisionStatus': {
          let foundSessionId: string | null = null;
          let updatedDecisions: Decision[] = [];
          
          for (const session of sessions) {
            if (session.decisions?.some(d => d.id === args.decisionId)) {
              foundSessionId = session.id;
              updatedDecisions = session.decisions.map(d => 
                d.id === args.decisionId ? { ...d, status: args.status as DecisionStatus } : d
              );
              break;
            }
          }
          
          if (!foundSessionId) {
            return { success: false, error: "Nie znaleziono decyzji o podanym ID." };
          }
          
          const sessionRef = doc(db, 'sessions', foundSessionId);
          await updateDoc(sessionRef, { decisions: updatedDecisions });
          
          return { success: true, message: `Status decyzji zaktualizowany na: ${args.status}` };
        }
        
        case 'createFollowUpSession': {
          let targetDecision: (Decision & { sessionId: string; sessionTitle: string }) | null = null;
          
          for (const session of sessions) {
            const decision = session.decisions?.find(d => d.id === args.decisionId);
            if (decision) {
              targetDecision = { ...decision, sessionId: session.id, sessionTitle: session.title };
              break;
            }
          }
          
          if (!targetDecision) {
            return { success: false, error: "Nie znaleziono decyzji o podanym ID." };
          }
          
          const newSessionId = await createFollowUp(targetDecision);
          if (newSessionId) {
            return { success: true, newSessionId, message: "Sesja follow-up została utworzona." };
          } else {
            return { success: false, error: "Nie udało się utworzyć sesji follow-up." };
          }
        }
        
        default:
          return { success: false, error: `Nieznana funkcja: ${name}` };
      }
    } catch (err: any) {
      console.error(`Błąd podczas wykonywania funkcji ${name}:`, err);
      return { success: false, error: err.message };
    }
  }, [sessions, createFollowUp]);

  const connect = useCallback((voiceName?: string, systemInstruction?: string) => {
    setError(null);
    if (!serviceRef.current) {
      serviceRef.current = new LiveVoiceService({
        onStateChange: setState,
        onError: setError,
        onFunctionCall: handleFunctionCall,
        onTranscript: (text, isUser) => {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            const timestamp = Date.now();
            
            if (lastMsg && lastMsg.isUser === isUser && timestamp - lastMsg.timestamp < 2000) {
               const newMsgs = [...prev];
               newMsgs[newMsgs.length - 1] = { ...lastMsg, text: lastMsg.text + text, timestamp };
               return newMsgs;
            }
            
            const newMsg = { id: timestamp.toString(), text, isUser, timestamp };
            
            if (user) {
              voiceChatDb.saveMessage(user.uid, newMsg).catch(console.error);
            }
            
            return [...prev, newMsg];
          });
        }
      });
    }
    serviceRef.current.connect(voiceName, systemInstruction);
  }, [user, handleFunctionCall]);

  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      serviceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    error,
    messages,
    connect,
    disconnect
  };
}
