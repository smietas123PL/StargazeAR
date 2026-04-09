import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Session, SessionMessage } from '../types';
import { useAuth } from '../providers/AuthProvider';

export function useSession(sessionId: string | undefined) {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !user) {
      if (!sessionId) {
        setLoading(false);
        setError('Brak ID sesji.');
      }
      return;
    }

    const sessionRef = doc(db, 'sessions', sessionId);
    const messagesRef = collection(db, `sessions/${sessionId}/messages`);
    const messagesQuery = query(messagesRef, orderBy('order', 'asc'));

    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession(docSnap.data() as Session);
      } else {
        setError('Sesja nie istnieje lub została usunięta.');
      }
    }, (err) => {
      console.error('Error fetching session:', err);
      setError('Błąd podczas pobierania danych sesji.');
    });

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionMessage));
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching messages:', err);
      setError('Błąd podczas pobierania wiadomości.');
      setLoading(false);
    });

    return () => {
      unsubSession();
      unsubMessages();
    };
  }, [sessionId]);

  return { session, messages, loading, error };
}
