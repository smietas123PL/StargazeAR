import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Session, Invitation } from '../types';
import { useAuth } from '../providers/AuthProvider';

export function useSharedSessions() {
  const { user } = useAuth();
  const [ownedSessions, setOwnedSessions] = useState<Session[]>([]);
  const [guestSessions, setGuestSessions] = useState<Session[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Fetch all sessions where user is a participant
    const sessionsQ = query(
      collection(db, 'sessions'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubSessions = onSnapshot(sessionsQ, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      
      // Sort by createdAt descending
      sessions.sort((a, b) => b.createdAt - a.createdAt);

      // Właściciel: sesje, które stworzył i mają więcej niż 1 uczestnika (czyli są udostępnione)
      setOwnedSessions(sessions.filter(s => s.userId === user.uid && s.participants && s.participants.length > 1));
      // Gość: sesje, w których uczestniczy, ale nie jest właścicielem
      setGuestSessions(sessions.filter(s => s.userId !== user.uid));
    });

    // 2. Fetch pending invitations for the user's email
    const invQ = query(
      collection(db, 'invitations'),
      where('invitedEmail', '==', user.email),
      where('status', '==', 'pending')
    );

    const unsubInv = onSnapshot(invQ, (snapshot) => {
      const invs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
      // Sort invitations by createdAt descending
      invs.sort((a, b) => b.createdAt - a.createdAt);
      
      setInvitations(invs);
      setLoading(false);
    });

    return () => {
      unsubSessions();
      unsubInv();
    };
  }, [user]);

  return { ownedSessions, guestSessions, invitations, loading };
}
