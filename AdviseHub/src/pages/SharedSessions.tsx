import React from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSharedSessions } from '../hooks/useSharedSessions';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function SharedSessions() {
  const { ownedSessions, guestSessions, invitations, loading } = useSharedSessions();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAccept = async (invitationId: string, sessionId: string) => {
    if (!user) return;
    try {
      // 1. Update invitation status
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: 'accepted',
        invitedUserId: user.uid
      });

      // 2. Add user to session participants
      await updateDoc(doc(db, 'sessions', sessionId), {
        participants: arrayUnion(user.uid)
      });

      toast.success('Zaproszenie zaakceptowane.');
    } catch (err) {
      console.error(err);
      toast.error('Błąd podczas akceptacji zaproszenia.');
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: 'declined'
      });
      toast.success('Zaproszenie odrzucone.');
    } catch (err) {
      console.error(err);
      toast.error('Błąd podczas odrzucania zaproszenia.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-black text-white tracking-tight mb-2">Wspólne sesje</h1>
        <p className="text-zinc-400">Sesje, do których zostałeś zaproszony przez innych użytkowników.</p>
      </div>

      {invitations.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">mail</span>
            Oczekujące zaproszenia
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-surface-container-low border border-primary/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-white font-medium">Zostałeś zaproszony do sesji</p>
                  <p className="text-sm text-zinc-400">Zaproszenie od: {inv.invitedBy}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDecline(inv.id)}
                    className="flex-1 sm:flex-none border-white/10 text-zinc-300 hover:text-white"
                  >
                    Odrzuć
                  </Button>
                  <Button 
                    onClick={() => handleAccept(inv.id, inv.sessionId)}
                    className="flex-1 sm:flex-none bg-primary text-[#003851] font-bold hover:opacity-90"
                  >
                    Akceptuj
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400">group</span>
          Twoje wspólne sesje (Gość)
        </h2>
        
        {guestSessions.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low/30 border border-white/5 rounded-3xl">
            <span className="material-symbols-outlined text-6xl text-zinc-600 mb-4">group_off</span>
            <h3 className="text-xl font-bold text-white mb-2">Brak wspólnych sesji</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              Nie uczestniczysz obecnie w żadnych sesjach udostępnionych przez innych użytkowników.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {guestSessions.map(session => (
              <div 
                key={session.id} 
                className="bg-surface-container-low border border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-all cursor-pointer group flex flex-col h-full"
                onClick={() => navigate(`/session/${session.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">forum</span>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {session.status === 'completed' ? 'Zakończona' : 'W trakcie'}
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-surface-container-highest text-[10px] font-bold text-zinc-400 uppercase tracking-wider border border-white/10">
                      Gość
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(session.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {session.title || session.question}
                </h3>
                
                <p className="text-sm text-zinc-400 line-clamp-3 mb-6 flex-1">
                  {session.question}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    <span>{session.participants?.length || 1} uczestników</span>
                  </div>
                  <span className="text-primary text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Dołącz <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400">admin_panel_settings</span>
          Udostępnione przez Ciebie (Właściciel)
        </h2>
        
        {ownedSessions.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low/30 border border-white/5 rounded-3xl">
            <span className="material-symbols-outlined text-6xl text-zinc-600 mb-4">share_off</span>
            <h3 className="text-xl font-bold text-white mb-2">Brak udostępnionych sesji</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              Nie udostępniłeś jeszcze żadnej ze swoich sesji innym użytkownikom.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ownedSessions.map(session => (
              <div 
                key={session.id} 
                className="bg-surface-container-low border border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-all cursor-pointer group flex flex-col h-full"
                onClick={() => navigate(`/session/${session.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">forum</span>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {session.status === 'completed' ? 'Zakończona' : 'W trakcie'}
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider border border-primary/20">
                      Właściciel
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(session.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {session.title || session.question}
                </h3>
                
                <p className="text-sm text-zinc-400 line-clamp-3 mb-6 flex-1">
                  {session.question}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    <span>{session.participants?.length || 1} uczestników</span>
                  </div>
                  <span className="text-primary text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Zarządzaj <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
