import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSession } from '../hooks/useSession';
import { useRunCouncil } from '../hooks/useRunCouncil';
import { useRunPeerReview } from '../hooks/useRunPeerReview';
import { useRunChairman } from '../hooks/useRunChairman';
import { useContinueConversation } from '../hooks/useContinueConversation';
import { AdvisorCard } from '../components/features/AdvisorCard';
import { MessageBubble } from '../components/features/MessageBubble';
import { FinalVerdictCard } from '../components/features/FinalVerdictCard';
import { PeerReviewCard } from '../components/features/PeerReviewCard';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useCustomAdvisors } from '../hooks/useCustomAdvisors';
import { AdvisorPill } from '../components/features/AdvisorPill';
import { ExportPDFButton } from '../components/features/ExportPDFButton';
import { ShareSessionModal } from '../components/features/ShareSessionModal';
import { motion } from 'motion/react';
import { useAuth } from '../providers/AuthProvider';

export default function SessionLive() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, messages, loading, error } = useSession(sessionId);
  const { runCouncil, isRunning: isCouncilRunning, progress, error: runError } = useRunCouncil(session);
  const { runPeerReview, isRunning: isPeerReviewRunning } = useRunPeerReview(sessionId || '');
  const { runChairman, isRunning: isChairmanRunning } = useRunChairman(sessionId || '');
  const { sendMessage, isSending } = useContinueConversation(sessionId || '');
  const { allAdvisors } = useCustomAdvisors();

  const [inputText, setInputText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevParticipantsRef = useRef<string[] | undefined>(undefined);

  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (session?.participants) {
      const fetchNames = async () => {
        const names: Record<string, string> = {};
        for (const uid of session.participants!) {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              names[uid] = userDoc.data().displayName || userDoc.data().email || 'Uczestnik';
            }
          } catch (e) {}
        }
        setParticipantNames(names);
      };
      fetchNames();
    }
  }, [session?.participants]);

  const isOwner = user?.uid === session?.userId;

  const activeAdvisors = session?.selectedAdvisors && session.selectedAdvisors.length > 0
    ? allAdvisors.filter(a => session.selectedAdvisors!.includes(a.id))
    : allAdvisors;

  // Grupowanie wiadomości
  const initialUserMsg = messages.length > 0 ? messages[0] : null;
  const advisorMsgs = messages.filter(m => !['user', 'peer_review', 'chairman'].includes(m.role));
  const peerReviewMsg = messages.find(m => m.role === 'peer_review');
  const chairmanVerdictMsg = messages.find(m => m.role === 'chairman');
  const conversationMsgs = chairmanVerdictMsg 
    ? messages.filter(m => m.order > chairmanVerdictMsg.order)
    : [];

  // Toast po zakończeniu obrad i powiadomienia o statusie/uczestnikach
  useEffect(() => {
    if (session) {
      if (session.status === 'running' && prevStatusRef.current === 'draft') {
        getDoc(doc(db, 'users', session.userId)).then(userDoc => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            toast.info(`Rada została uruchomiona przez ${userData.displayName || userData.email || 'właściciela'}`);
          } else {
            toast.info('Rada została uruchomiona');
          }
        }).catch(() => {
          toast.info('Rada została uruchomiona');
        });
      }
      
      if (session.status === 'completed' && prevStatusRef.current && prevStatusRef.current !== 'completed') {
        toast.success('Rada zakończyła obrady – werdykt gotowy');
      }
      
      if (prevParticipantsRef.current && session.participants) {
        const newParticipants = session.participants.filter(p => !prevParticipantsRef.current?.includes(p));
        if (newParticipants.length > 0) {
          newParticipants.forEach(async (uid) => {
            if (uid !== user?.uid) {
              try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  toast.info(`${userData.displayName || userData.email || 'Nowy uczestnik'} dołączył do sesji`);
                } else {
                  toast.info(`Nowy uczestnik dołączył do sesji`);
                }
              } catch (err) {
                toast.info(`Nowy uczestnik dołączył do sesji`);
              }
            }
          });
        }
      }

      prevStatusRef.current = session.status;
      prevParticipantsRef.current = session.participants;
    }
  }, [session?.status, session?.participants, session?.userId, user?.uid]);

  // Automatyczne przewijanie do dołu (tylko dla nowych wiadomości w dyskusji)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMsgs.length, isSending]);

  // Automatyczne uruchamianie Peer Review po zakończeniu Doradców
  useEffect(() => {
    if (session?.status === 'advisors_completed' && !isPeerReviewRunning) {
      runPeerReview(messages, session.fullContext);
    }
  }, [session?.status, messages, isPeerReviewRunning, runPeerReview, session?.fullContext]);

  // Automatyczne uruchamianie Chairmana po zakończeniu Peer Review
  useEffect(() => {
    if (session?.status === 'peer_review_completed' && !isChairmanRunning) {
      runChairman(messages, session.question, session.fullContext);
    }
  }, [session?.status, messages, session?.question, session?.fullContext, isChairmanRunning, runChairman]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !session || session.status !== 'completed' || isSending) return;
    sendMessage(inputText, messages);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,252,155,0.15)] animate-pulse">
          <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
        </div>
        <h1 className="text-2xl font-headline font-bold text-white mb-2">Ładowanie sesji...</h1>
        <p className="text-on-surface-variant text-sm">Synchronizacja z bazą danych</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        </div>
        <h1 className="text-2xl font-headline font-bold text-white mb-2">Wystąpił błąd</h1>
        <p className="text-red-400 text-sm">{error || 'Nie znaleziono sesji.'}</p>
      </div>
    );
  }

  if (session.userId !== user?.uid && (!session.participants || !session.participants.includes(user?.uid || ''))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-red-400">lock</span>
        </div>
        <h1 className="text-2xl font-headline font-bold text-white mb-2">Brak dostępu</h1>
        <p className="text-red-400 text-sm">Nie masz uprawnień do przeglądania tej sesji.</p>
      </div>
    );
  }

  const isAnyRunning = isCouncilRunning || isPeerReviewRunning || isChairmanRunning;
  const isCompleted = session.status === 'completed';

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full relative min-h-[calc(100vh-6rem)]">
      
      {/* Header with Share Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-headline font-bold text-white truncate pr-4">
          {session.title || 'Sesja Doradcza'}
        </h1>
        {isOwner && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowShareModal(true)}
            className="shrink-0 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">share</span>
            Udostępnij
          </Button>
        )}
      </div>

      {/* 4-Step Flow Indicator */}
      <div className="w-full bg-surface-container-low/50 backdrop-blur-md rounded-3xl p-4 mb-8 border border-white/5 shadow-xl sticky top-20 z-30">
        <div className="flex items-center justify-between w-full gap-2">
          {/* Step 1: Done */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-primary/30 flex items-center justify-center text-primary font-bold">
              <span className="material-symbols-outlined text-lg">check</span>
            </div>
            <span className="text-[10px] font-label uppercase tracking-wider text-primary/70 text-center leading-tight">
              Pytanie
            </span>
          </div>
          <div className="h-[2px] flex-1 bg-primary/30 rounded-full"></div>
          
          {/* Step 2: Advisors */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${session.status === 'running' ? 'bg-gradient-to-r from-primary to-secondary text-surface-container-lowest shadow-[0_0_20px_rgba(0,252,155,0.4)] border-primary animate-pulse' : 'bg-surface-container-highest border-primary/30 text-primary'}`}>
              {session.status !== 'running' && session.status !== 'draft' ? <span className="material-symbols-outlined text-lg">check</span> : '2'}
            </div>
            <span className={`text-[10px] font-label font-bold uppercase tracking-wider text-center leading-tight ${session.status === 'running' ? 'text-primary' : 'text-primary/70'}`}>
              {session.status === 'running' ? 'Obrady Trwają...' : 'Doradcy'}
            </span>
          </div>
          <div className="h-[2px] flex-1 bg-outline-variant/20 rounded-full"></div>
          
          {/* Step 3: Peer Review */}
          <div className={`flex flex-col items-center flex-1 gap-2 ${['draft', 'running'].includes(session.status) ? 'opacity-50' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${session.status === 'advisors_completed' ? 'bg-gradient-to-r from-primary to-secondary text-surface-container-lowest shadow-[0_0_20px_rgba(0,252,155,0.4)] border-primary animate-pulse' : session.status === 'peer_review_completed' || session.status === 'completed' ? 'bg-surface-container-highest border-primary/30 text-primary' : 'border-outline-variant/50 text-outline-variant'}`}>
              {session.status === 'peer_review_completed' || session.status === 'completed' ? <span className="material-symbols-outlined text-lg">check</span> : '3'}
            </div>
            <span className={`text-[10px] font-label uppercase tracking-wider text-center leading-tight ${session.status === 'advisors_completed' ? 'text-primary font-bold' : session.status === 'peer_review_completed' || session.status === 'completed' ? 'text-primary/70' : 'text-outline-variant'}`}>
              Peer Review
            </span>
          </div>
          <div className="h-[2px] flex-1 bg-outline-variant/20 rounded-full"></div>
          
          {/* Step 4: Chairman */}
          <div className={`flex flex-col items-center flex-1 gap-2 ${['draft', 'running', 'advisors_completed'].includes(session.status) ? 'opacity-50' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${session.status === 'peer_review_completed' ? 'bg-gradient-to-r from-primary to-secondary text-surface-container-lowest shadow-[0_0_20px_rgba(0,252,155,0.4)] border-primary animate-pulse' : session.status === 'completed' ? 'bg-surface-container-highest border-primary/30 text-primary' : 'border-outline-variant/50 text-outline-variant'}`}>
              {session.status === 'completed' ? <span className="material-symbols-outlined text-lg">check</span> : '4'}
            </div>
            <span className={`text-[10px] font-label uppercase tracking-wider text-center leading-tight ${session.status === 'peer_review_completed' ? 'text-primary font-bold' : session.status === 'completed' ? 'text-primary/70' : 'text-outline-variant'}`}>
              Werdykt Przewodniczącego
            </span>
          </div>
        </div>
      </div>

      {/* Selected Advisors Display */}
      {activeAdvisors.length > 0 && (
        <div className="w-full mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low/20 border border-white/5 rounded-2xl p-3 pl-5 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Rada tej sesji:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeAdvisors.map(adv => (
                <AdvisorPill key={adv.id} advisor={adv} />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwner && session.status === 'running' && messages.length <= 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/', { state: { question: session.question } })}
                className="shrink-0 text-zinc-400 hover:text-white hover:bg-white/5 h-8 text-xs rounded-full px-4"
              >
                <span className="material-symbols-outlined text-[14px] mr-1.5">edit</span>
                Zmień radę
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex flex-col gap-6 pb-32">
        
        {/* 1. Initial User Context */}
        {initialUserMsg && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col w-full">
              {initialUserMsg.userId !== user?.uid && (
                <span className="text-xs text-zinc-500 mb-1 self-end mr-4">{participantNames[initialUserMsg.userId] || 'Właściciel'}</span>
              )}
              <MessageBubble role="user" content={session.question || initialUserMsg.content} isFirstUserMsg={true} />
            </div>
            
            {session.attachedFiles && session.attachedFiles.length > 0 && (
              <div className="self-end max-w-[85%] bg-surface-container-low/50 border border-white/5 rounded-2xl p-4 mt-[-16px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">Załączone dokumenty do analizy:</span>
                <div className="flex flex-wrap gap-2">
                  {session.attachedFiles.map((file, idx) => (
                    <a 
                      key={idx} 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-surface-container-high hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        {file.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                      </span>
                      <span className="truncate max-w-[150px]">{file.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Advisors */}
        {advisorMsgs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full mt-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Odpowiedzi Rady</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>
            <div className="flex flex-col gap-6">
              {advisorMsgs.map(msg => (
                <div key={msg.id} className="self-start w-full">
                  <AdvisorCard role={msg.role} content={msg.content} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3. Peer Review */}
        {peerReviewMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PeerReviewCard content={peerReviewMsg.content} />
          </motion.div>
        )}

        {/* 4. Chairman Verdict */}
        {chairmanVerdictMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full mt-12 mb-8 flex flex-col gap-6"
          >
            <FinalVerdictCard content={chairmanVerdictMsg.content} />
            
            {session.status === 'completed' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="flex flex-col sm:flex-row justify-center gap-4 mt-4"
              >
                <ExportPDFButton 
                  session={session} 
                  messages={messages} 
                  advisors={activeAdvisors} 
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary hover:text-[#003851] px-8 h-12 rounded-full shadow-[0_0_20px_rgba(0,252,155,0.2)] font-bold transition-all"
                />
                <Button 
                  onClick={() => navigate('/tracker')}
                  className="bg-gradient-to-r from-primary to-secondary text-[#003851] px-8 h-12 rounded-full font-bold transition-all hover:opacity-90 shadow-[0_0_20px_rgba(0,252,155,0.2)]"
                >
                  <span className="material-symbols-outlined text-[20px] mr-2">track_changes</span>
                  Zobacz decyzje w Trackerze
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 5. Conversation */}
        {conversationMsgs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full mt-12"
          >
            <div className="flex items-center justify-center mb-12 opacity-30">
              <div className="w-1 h-1 rounded-full bg-white mx-1"></div>
              <div className="w-1 h-1 rounded-full bg-white mx-1"></div>
              <div className="w-1 h-1 rounded-full bg-white mx-1"></div>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Dyskusja z Przewodniczącym</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>
            <div className="flex flex-col gap-6">
              {conversationMsgs.map(msg => (
                <div key={msg.id} className="flex flex-col w-full">
                  {msg.role === 'user' && msg.userId !== user?.uid && (
                    <span className="text-xs text-zinc-500 mb-1 self-end mr-4">{participantNames[msg.userId] || 'Inny uczestnik'}</span>
                  )}
                  <MessageBubble role={msg.role as 'user' | 'chairman'} content={msg.content} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Przycisk Uruchom Radę */}
        {isOwner && session.status === 'running' && messages.length === 1 && !isAnyRunning && (
          <div className="flex justify-center my-8">
            <Button 
              onClick={() => runCouncil(session.question, session.documentTexts)}
              className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-secondary text-[#003851] font-headline font-extrabold text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,252,155,0.3)] hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-2xl mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              Uruchom Radę Doradców
            </Button>
          </div>
        )}

        {!isOwner && session.status === 'running' && messages.length === 1 && !isAnyRunning && (
          <div className="flex justify-center my-8">
            <div className="flex items-center gap-3 bg-surface-container-low/50 border border-white/5 rounded-2xl p-4 text-zinc-400">
              <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
              <span>Oczekiwanie na uruchomienie rady przez właściciela sesji...</span>
            </div>
          </div>
        )}

        {/* Loading State / Progress (Council, Peer Review, Chairman) */}
        {isAnyRunning && (
          <div className="self-start w-full max-w-3xl">
            <div className="flex flex-col gap-4 p-6 bg-surface-container-low/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-on-surface-variant font-medium">
                  {isCouncilRunning && 'Doradcy analizują Twój kontekst...'}
                  {isPeerReviewRunning && 'Trwa anonimowa recenzja (Peer Review)...'}
                  {isChairmanRunning && 'Przewodniczący syntetyzuje werdykt...'}
                </span>
              </div>
              {isCouncilRunning && (
                <>
                  <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500" 
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-primary font-bold uppercase tracking-wider">
                    {progress.current || 'Inicjalizacja...'}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading State for Chat Continuation */}
        {isSending && (
          <div className="self-start w-full max-w-3xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-primary text-lg">account_balance</span>
              </div>
              <div className="bg-surface-container-low border border-white/5 p-5 rounded-3xl rounded-tl-sm shadow-lg flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-on-surface-variant">Przewodniczący pisze odpowiedź...</span>
              </div>
            </div>
          </div>
        )}

        {runError && (
          <div className="self-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {runError}
          </div>
        )}
        
        {/* Element do automatycznego scrollowania */}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 left-0 lg:left-80 right-0 p-4 bg-surface/90 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <Textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface-container-low border-white/10 focus-visible:ring-primary/50 text-white placeholder-zinc-500 resize-none font-body text-sm min-h-[56px] max-h-[120px] rounded-2xl" 
            placeholder={isCompleted ? "Dopytaj o werdykt lub poproś o wyjaśnienia..." : "Poczekaj na zakończenie obrad..."}
            disabled={!isCompleted || isSending}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!isCompleted || isSending || !inputText.trim()}
            className={`h-14 w-14 shrink-0 rounded-2xl border ${isCompleted && inputText.trim() && !isSending ? 'bg-primary text-[#003851] border-primary hover:opacity-90' : 'bg-surface-container-high text-zinc-500 border-white/5'}`}
          >
            <span className="material-symbols-outlined">send</span>
          </Button>
        </div>
      </div>

      {showShareModal && (
        <ShareSessionModal 
          session={session} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
}
