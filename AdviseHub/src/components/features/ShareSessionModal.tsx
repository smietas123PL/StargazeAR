import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Session, Invitation, UserProfile } from '../../types';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface ShareSessionModalProps {
  session: Session;
  onClose: () => void;
}

export function ShareSessionModal({ session, onClose }: ShareSessionModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch invitations
        const invQ = query(collection(db, 'invitations'), where('sessionId', '==', session.id));
        const invSnapshot = await getDocs(invQ);
        const invs = invSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Invitation));
        setInvitations(invs);

        // Fetch participants
        if (session.participants && session.participants.length > 0) {
          const parts: UserProfile[] = [];
          for (const uid of session.participants) {
            const userQ = query(collection(db, 'users'), where('uid', '==', uid));
            const userSnap = await getDocs(userQ);
            if (!userSnap.empty) {
              parts.push(userSnap.docs[0].data() as UserProfile);
            }
          }
          setParticipants(parts);
        }
      } catch (err) {
        console.error("Error fetching share data:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [session.id, session.participants]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;

    if (email === user.email) {
      toast.error('Nie możesz zaprosić samego siebie.');
      return;
    }

    if (invitations.some(i => i.invitedEmail === email && i.status === 'pending')) {
      toast.error('Zaproszenie zostało już wysłane na ten adres.');
      return;
    }

    setLoading(true);
    try {
      // Find user by email
      const userQ = query(collection(db, 'users'), where('email', '==', email));
      const userSnap = await getDocs(userQ);
      let invitedUserId = undefined;

      if (!userSnap.empty) {
        invitedUserId = userSnap.docs[0].data().uid;
        if (session.participants?.includes(invitedUserId)) {
          toast.error('Ten użytkownik jest już uczestnikiem sesji.');
          setLoading(false);
          return;
        }
      }

      const invRef = doc(collection(db, 'invitations'));
      const newInv: Invitation = {
        id: invRef.id,
        sessionId: session.id,
        invitedBy: user.email || user.uid,
        invitedEmail: email,
        invitedUserId,
        status: 'pending',
        createdAt: Date.now()
      };

      await setDoc(invRef, newInv);
      setInvitations([...invitations, newInv]);
      setEmail('');
      toast.success('Zaproszenie wysłane pomyślnie.');
    } catch (err) {
      console.error(err);
      toast.error('Wystąpił błąd podczas wysyłania zaproszenia.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!user || participantId === session.userId) return;
    
    try {
      const sessionRef = doc(db, 'sessions', session.id);
      const updatedParticipants = session.participants?.filter(id => id !== participantId) || [];
      await updateDoc(sessionRef, { participants: updatedParticipants });
      
      setParticipants(participants.filter(p => p.uid !== participantId));
      toast.success('Uczestnik został usunięty.');
    } catch (err) {
      console.error(err);
      toast.error('Błąd podczas usuwania uczestnika.');
    }
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'invitations', invitationId), { status: 'declined' });
      setInvitations(invitations.filter(i => i.id !== invitationId));
      toast.success('Zaproszenie zostało anulowane.');
    } catch (err) {
      console.error(err);
      toast.error('Błąd podczas anulowania zaproszenia.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-high border border-white/10 rounded-3xl p-6 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-2xl font-headline font-bold text-white mb-2">Udostępnij sesję</h2>
        <p className="text-sm text-zinc-400 mb-6">Zaproś innych do wspólnej pracy nad tą sesją.</p>

        <form onSubmit={handleInvite} className="mb-8">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adres email współpracownika"
              className="flex-1 bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
              required
            />
            <Button 
              type="submit" 
              disabled={loading || !email.trim()}
              className="bg-primary text-[#003851] font-bold hover:opacity-90"
            >
              {loading ? 'Wysyłanie...' : 'Zaproś'}
            </Button>
          </div>
        </form>

        {fetching ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Uczestnicy</h3>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.uid} className="flex items-center justify-between bg-surface-container-low p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{p.displayName || p.email}</p>
                        <p className="text-xs text-zinc-500">{p.uid === session.userId ? 'Właściciel' : 'Uczestnik'}</p>
                      </div>
                    </div>
                    {p.uid !== session.userId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveParticipant(p.uid)}
                        className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 h-8 px-2"
                      >
                        Usuń
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {invitations.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Wysłane zaproszenia</h3>
                <div className="space-y-2">
                  {invitations.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between bg-surface-container-low p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-zinc-400">
                          <span className="material-symbols-outlined text-sm">mail</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{inv.invitedEmail}</p>
                          <p className="text-xs text-zinc-500">
                            {inv.status === 'pending' && 'Oczekujące'}
                            {inv.status === 'accepted' && 'Zaakceptowane'}
                            {inv.status === 'declined' && 'Odrzucone'}
                          </p>
                        </div>
                      </div>
                      {inv.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveInvitation(inv.id)}
                          className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 h-8 px-2"
                        >
                          Anuluj
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
