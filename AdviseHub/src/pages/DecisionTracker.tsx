import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../providers/AuthProvider';
import { Session, Decision, DecisionStatus } from '../types';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDecisionFollowUp } from '../hooks/useDecisionFollowUp';

export default function DecisionTracker() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createFollowUp, isCreating } = useDecisionFollowUp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DecisionStatus | 'all'>('all');
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [editOutcome, setEditOutcome] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      try {
        const q = query(collection(db, 'sessions'), where('participants', 'array-contains', user.uid));
        const snapshot = await getDocs(q);
        const fetchedSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
        setSessions(fetchedSessions);
      } catch (err) {
        console.error("Błąd pobierania sesji:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [user]);

  const allDecisions = sessions.flatMap(s => 
    (s.decisions || []).map(d => ({ ...d, sessionId: s.id, sessionTitle: s.title }))
  ).sort((a, b) => b.decidedAt - a.decidedAt);

  const filteredDecisions = filter === 'all' ? allDecisions : allDecisions.filter(d => d.status === filter);

  const handleStatusChange = async (sessionId: string, decisionId: string, newStatus: DecisionStatus) => {
    try {
      // The select is rendered from `filteredDecisions`, so the matching session and decision exist here.
      const session = sessions.find(s => s.id === sessionId)!;
      const decision = session.decisions!.find(d => d.id === decisionId)!;

      const updatedDecisions = session.decisions!.map(d => 
        d.id === decisionId ? { ...d, status: newStatus } : d
      );

      await updateDoc(doc(db, 'sessions', sessionId), { decisions: updatedDecisions });
      
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, decisions: updatedDecisions } : s
      ));
      toast.success('Status zaktualizowany');

      if ((newStatus === 'completed' || newStatus === 'in_progress') && !decision.reviewed) {
        toast('Czy chcesz utworzyć sesję follow-up dla tej decyzji?', {
          action: {
            label: 'Utwórz',
            onClick: () => createFollowUp({ ...decision, status: newStatus, sessionId, sessionTitle: session.title })
          },
          cancel: {
            label: 'Pomiń',
            onClick: () => {}
          }
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Błąd aktualizacji statusu');
    }
  };

  const handleSaveOutcome = async () => {
    try {
      // The save action is only available while a decision is actively being edited.
      const currentDecision = editingDecision!;
      const session = sessions.find(s => s.id === (currentDecision as any).sessionId)!;

      const updatedDecisions = session.decisions!.map(d => 
        d.id === currentDecision.id ? { ...d, actualOutcome: editOutcome } : d
      );

      await updateDoc(doc(db, 'sessions', session.id), { decisions: updatedDecisions });
      
      setSessions(sessions.map(s => 
        s.id === session.id ? { ...s, decisions: updatedDecisions } : s
      ));
      setEditingDecision(null);
      toast.success('Rezultat zapisany');
    } catch (err) {
      console.error(err);
      toast.error('Błąd zapisu rezultatu');
    }
  };

  const handleReviewRequest = (decision: Decision & { sessionTitle: string }) => {
    const prompt = `Chcę przeanalizować podjętą wcześniej decyzję: "${decision.title}".\n\nOpis: ${decision.description}\nSpodziewany rezultat: ${decision.expectedOutcome}\nAktualny status: ${decision.status}\nAktualny rezultat: ${decision.actualOutcome || 'Brak danych'}\n\nProszę o ocenę tej decyzji i rekomendacje co do dalszych kroków.`;
    navigate('/', { state: { question: prompt } });
  };

  const getStatusColor = (status: DecisionStatus) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-primary/20 text-primary border-primary/30';
      case 'abandoned': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getStatusLabel = (status: DecisionStatus) => {
    switch (status) {
      case 'planned': return 'Planowane';
      case 'in_progress': return 'W trakcie';
      case 'completed': return 'Zakończone';
      case 'abandoned': return 'Porzucone';
      default: return status;
    }
  };

  const getStatusIcon = (status: DecisionStatus) => {
    switch (status) {
      case 'planned': return 'schedule';
      case 'in_progress': return 'hourglass_top';
      case 'completed': return 'check_circle';
      case 'abandoned': return 'cancel';
      default: return 'help_outline';
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-white tracking-tight mb-2">Decision Tracker</h1>
          <p className="text-zinc-400">Śledź realizację decyzji podjętych podczas sesji doradczych.</p>
        </div>
        
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-white/5">
          {(['all', 'planned', 'in_progress', 'completed', 'abandoned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-surface-container-highest text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              {f === 'all' ? 'Wszystkie' : getStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {allDecisions.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low/30 border border-white/5 rounded-3xl">
          <span className="material-symbols-outlined text-6xl text-zinc-600 mb-4">track_changes</span>
          <h3 className="text-xl font-bold text-white mb-2">Brak zapisanych decyzji</h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Decyzje są automatycznie wyodrębniane z werdyktów Przewodniczącego po zakończeniu sesji doradczej.
          </p>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          Brak decyzji dla wybranego filtru.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredDecisions.map(decision => (
            <div key={decision.id} className="bg-surface-container-low border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${getStatusColor(decision.status)}`}>
                    <span className="material-symbols-outlined text-[14px]">{getStatusIcon(decision.status)}</span>
                    {getStatusLabel(decision.status)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(decision.decidedAt).toLocaleDateString('pl-PL')}
                  </span>
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">forum</span>
                    {decision.sessionTitle}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{decision.title}</h3>
                <p className="text-zinc-400 text-sm mb-4">{decision.description}</p>
                
                <div className="bg-surface-container-highest/50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Spodziewany rezultat</p>
                  <p className="text-sm text-zinc-300">{decision.expectedOutcome}</p>
                </div>

                {decision.actualOutcome && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-primary/70 uppercase tracking-wider mb-1">Aktualny rezultat</p>
                    <p className="text-sm text-zinc-300">{decision.actualOutcome}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Zmień status</p>
                <select 
                  value={decision.status}
                  onChange={(e) => handleStatusChange(decision.sessionId, decision.id, e.target.value as DecisionStatus)}
                  className="bg-surface-container-highest border border-white/10 text-white text-sm rounded-lg p-2.5 focus:ring-primary focus:border-primary w-full"
                >
                  <option value="planned">Planowane</option>
                  <option value="in_progress">W trakcie</option>
                  <option value="completed">Zakończone</option>
                  <option value="abandoned">Porzucone</option>
                </select>

                <Button 
                  variant="outline" 
                  className="w-full border-white/10 text-zinc-300 hover:text-white mt-2"
                  onClick={() => {
                    setEditingDecision(decision);
                    setEditOutcome(decision.actualOutcome || '');
                  }}
                >
                  <span className="material-symbols-outlined text-[18px] mr-2">edit_note</span>
                  {decision.actualOutcome ? 'Edytuj rezultat' : 'Dodaj rezultat'}
                </Button>

                {!decision.reviewed && (decision.status === 'completed' || decision.status === 'in_progress') && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-secondary hover:text-secondary hover:bg-secondary/10 mt-2"
                    onClick={() => createFollowUp(decision)}
                    disabled={isCreating}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-2">auto_awesome</span>
                    Poproś o follow-up
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  className="w-full text-primary hover:text-primary hover:bg-primary/10 mt-auto"
                  onClick={() => handleReviewRequest(decision)}
                >
                  <span className="material-symbols-outlined text-[18px] mr-2">psychology</span>
                  Poproś o review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edycji Rezultatu */}
      {editingDecision && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-white/10 rounded-3xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-white mb-4">Aktualizuj rezultat</h3>
            <p className="text-sm text-zinc-400 mb-4">Opisz, co faktycznie udało się osiągnąć w ramach decyzji: <strong className="text-white">{editingDecision.title}</strong>.</p>
            
            <textarea
              value={editOutcome}
              onChange={(e) => setEditOutcome(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-xl p-4 text-white placeholder-zinc-500 focus:ring-primary focus:border-primary min-h-[120px] mb-6"
              placeholder="np. Wdrożenie zakończyło się sukcesem, konwersja wzrosła o 15%..."
            />
            
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingDecision(null)} className="text-zinc-400 hover:text-white">
                Anuluj
              </Button>
              <Button onClick={handleSaveOutcome} className="bg-primary text-[#003851] font-bold hover:opacity-90">
                Zapisz rezultat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
