import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../providers/AuthProvider';
import { Session } from '../types';

export function useUserSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSessions: Session[] = [];
        snapshot.forEach((doc) => {
          fetchedSessions.push({ id: doc.id, ...doc.data() } as Session);
        });
        setSessions(fetchedSessions);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching sessions:', err);
        setError('Nie udało się pobrać historii sesji.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { sessions, loading, error };
}
