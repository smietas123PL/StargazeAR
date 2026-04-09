import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSessions } from '../hooks/useUserSessions';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { ExportPDFButton } from '../components/features/ExportPDFButton';
import { useCustomAdvisors } from '../hooks/useCustomAdvisors';
import { useSession } from '../hooks/useSession';
import { Session } from '../types';

// Wrapper component to load messages for a specific session just for PDF export
function SessionCardWithExport({ session, onClick }: { session: Session, onClick: () => void }) {
  const { messages } = useSession(session.id);
  const { allAdvisors } = useCustomAdvisors();
  
  const activeAdvisors = session.selectedAdvisors 
    ? allAdvisors.filter(a => session.selectedAdvisors!.includes(a.id))
    : allAdvisors.slice(0, 5);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Zakończona</Badge>;
      case 'failed':
        return <Badge variant="destructive">Błąd</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-zinc-400 border-zinc-700">Szkic</Badge>;
      default:
        return <Badge className="bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30 animate-pulse">W trakcie</Badge>;
    }
  };

  return (
    <Card className="bg-surface-container-low/60 backdrop-blur-xl border-white/5 hover:border-primary/30 transition-all duration-300 flex flex-col overflow-hidden group">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4 gap-4">
          {getStatusBadge(session.status)}
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            {formatDate(session.createdAt)}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer" onClick={onClick}>
          {session.title || (session.question.length > 60 ? session.question.substring(0, 60) + '...' : session.question)}
        </h3>
        
        <p className="text-sm text-zinc-400 line-clamp-3 mb-6 flex-1 cursor-pointer" onClick={onClick}>
          {session.question}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="material-symbols-outlined text-[16px]">forum</span>
            {session.status === 'completed' ? 'Werdykt gotowy' : 'W trakcie obrad...'}
          </div>
          <div className="flex items-center gap-2">
            {session.status === 'completed' && (
              <ExportPDFButton 
                session={session} 
                messages={messages} 
                advisors={activeAdvisors} 
                variant="ghost"
                size="icon"
                showLabel={false}
                className="text-zinc-400 hover:text-primary hover:bg-primary/10 h-9 w-9"
              />
            )}
            <Button 
              variant="ghost" 
              onClick={onClick}
              className="text-primary hover:text-primary hover:bg-primary/10 -mr-4"
            >
              Otwórz
              <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function History() {
  const { sessions, loading, error } = useUserSessions();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'running'>('all');

  const filteredSessions = sessions.filter(session => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (session.title && session.title.toLowerCase().includes(searchLower)) ||
      (session.question && session.question.toLowerCase().includes(searchLower));

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = session.status === 'completed';
    } else if (statusFilter === 'running') {
      matchesStatus = session.status !== 'completed' && session.status !== 'failed';
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline font-black text-white tracking-tight mb-2">
            Historia Wywiadów
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base">
            Przeglądaj swoje poprzednie sesje doradcze i kontynuuj dyskusje z Przewodniczącym.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
          <Input 
            placeholder="Szukaj po pytaniu lub tytule..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-surface-container-low border-white/10 text-white focus-visible:ring-primary/50 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className={`h-12 rounded-xl px-6 transition-all ${statusFilter === 'all' ? 'bg-primary text-[#003851] hover:bg-primary/90' : 'bg-transparent border-white/10 text-zinc-400 hover:text-white'}`}
          >
            Wszystkie
          </Button>
          <Button 
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('completed')}
            className={`h-12 rounded-xl px-6 transition-all ${statusFilter === 'completed' ? 'bg-primary text-[#003851] hover:bg-primary/90' : 'bg-transparent border-white/10 text-zinc-400 hover:text-white'}`}
          >
            Zakończone
          </Button>
          <Button 
            variant={statusFilter === 'running' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('running')}
            className={`h-12 rounded-xl px-6 transition-all ${statusFilter === 'running' ? 'bg-primary text-[#003851] hover:bg-primary/90' : 'bg-transparent border-white/10 text-zinc-400 hover:text-white'}`}
          >
            W trakcie
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-surface-container-low/60 backdrop-blur-xl border-white/5 p-6 flex flex-col h-[220px]">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-24 bg-white/10 rounded-full" />
                <Skeleton className="h-4 w-32 bg-white/10" />
              </div>
              <Skeleton className="h-6 w-3/4 bg-white/10 mb-3" />
              <Skeleton className="h-4 w-full bg-white/10 mb-2" />
              <Skeleton className="h-4 w-5/6 bg-white/10 mb-6" />
              <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                <Skeleton className="h-4 w-32 bg-white/10" />
                <Skeleton className="h-8 w-20 bg-white/10" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-surface-container-low/30 border border-white/5 rounded-3xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50 pointer-events-none"></div>
          <div className="w-20 h-20 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center mb-6 shadow-inner relative z-10">
            <span className="material-symbols-outlined text-4xl text-zinc-500">history_toggle_off</span>
          </div>
          <h3 className="text-2xl font-headline font-bold text-white mb-3 relative z-10">Brak historii sesji</h3>
          <p className="text-zinc-400 text-center max-w-md mb-8 relative z-10">
            {searchQuery || statusFilter !== 'all' 
              ? 'Nie znaleziono sesji spełniających kryteria wyszukiwania. Spróbuj zmienić filtry.' 
              : 'Nie przeprowadziłeś jeszcze żadnej sesji doradczej. Czas skonsultować swoją pierwszą decyzję z Radą!'}
          </p>
          {(!searchQuery && statusFilter === 'all') && (
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-primary to-secondary text-[#003851] hover:opacity-90 rounded-full px-8 h-14 font-headline font-extrabold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,252,155,0.2)] transition-all relative z-10"
            >
              <span className="material-symbols-outlined text-xl mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Rozpocznij nową sesję
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSessions.map(session => (
            <SessionCardWithExport 
              key={session.id} 
              session={session} 
              onClick={() => navigate(`/session/${session.id}`)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
