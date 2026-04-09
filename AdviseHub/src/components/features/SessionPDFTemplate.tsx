import React from 'react';
import { Session, SessionMessage } from '../../types';
import { AdvisorDef } from '../../hooks/useCustomAdvisors';
import Markdown from 'react-markdown';

interface Props {
  session: Session;
  messages: SessionMessage[];
  advisors: AdvisorDef[];
}

export const SessionPDFTemplate: React.FC<Props> = ({ session, messages, advisors }) => {
  const chairmanMessage = messages.find(m => m.role === 'chairman');
  const peerReviewMessage = messages.find(m => m.role === 'peer_review');
  const advisorMessages = messages.filter(m => !['user', 'peer_review', 'chairman'].includes(m.role));

  return (
    <div className="p-12 bg-[#001f2e] text-white font-sans w-[800px] flex flex-col gap-8" style={{ minHeight: '1122px' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#00fc9b]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          <h1 className="text-3xl font-bold tracking-tight">AdviseHub</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-400 font-medium uppercase tracking-widest">Raport z sesji doradczej</p>
          <p className="text-xs text-zinc-500 mt-1">{new Date(session.createdAt).toLocaleString('pl-PL')}</p>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-sm uppercase tracking-widest text-[#00fc9b] font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">help</span>
          Problem / Pytanie
        </h2>
        <p className="text-lg leading-relaxed text-zinc-100">{session.question}</p>
      </div>

      {/* Selected Council */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-sm uppercase tracking-widest text-[#00fc9b] font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">group</span>
          Wybrana Rada
        </h2>
        <div className="flex flex-wrap gap-3">
          {advisors.map(adv => {
            const colorHex = adv.color.includes('red') ? '#ef4444' : 
                             adv.color.includes('blue') ? '#3b82f6' :
                             adv.color.includes('purple') ? '#a855f7' :
                             adv.color.includes('emerald') ? '#10b981' :
                             adv.color.includes('amber') ? '#f59e0b' :
                             adv.color.includes('cyan') ? '#06b6d4' :
                             adv.color.includes('pink') ? '#ec4899' : '#00fc9b';
            return (
              <div key={adv.id} className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                <span className="material-symbols-outlined text-[14px]" style={{ color: colorHex }}>{adv.icon}</span>
                <span className="text-xs font-medium text-zinc-200">{adv.namePl}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advisor Responses */}
      <div className="flex flex-col gap-6 mt-4">
        <h2 className="text-sm uppercase tracking-widest text-[#00fc9b] font-bold border-b border-white/10 pb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">forum</span>
          Analiza Doradców
        </h2>
        {advisorMessages.map(msg => {
          const adv = advisors.find(a => a.id === msg.role);
          if (!adv) return null;
          const colorHex = adv.color.includes('red') ? '#ef4444' : 
                           adv.color.includes('blue') ? '#3b82f6' :
                           adv.color.includes('purple') ? '#a855f7' :
                           adv.color.includes('emerald') ? '#10b981' :
                           adv.color.includes('amber') ? '#f59e0b' :
                           adv.color.includes('cyan') ? '#06b6d4' :
                           adv.color.includes('pink') ? '#ec4899' : '#00fc9b';
          return (
            <div key={msg.id} className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: colorHex }}></div>
              <div className="flex items-center gap-3 mb-4 pl-2">
                <span className="material-symbols-outlined text-2xl" style={{ color: colorHex }}>{adv.icon}</span>
                <div>
                  <div className="font-bold text-lg text-white">{adv.namePl}</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{adv.nameEn}</div>
                </div>
              </div>
              <div className="prose prose-invert prose-sm max-w-none pl-2 text-zinc-300">
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
          );
        })}
      </div>

      {/* Peer Review */}
      {peerReviewMessage && (
        <div className="flex flex-col gap-6 mt-6">
          <h2 className="text-sm uppercase tracking-widest text-[#00fc9b] font-bold border-b border-white/10 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            Anonimowy Peer Review
          </h2>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
              <Markdown>{peerReviewMessage.content}</Markdown>
            </div>
          </div>
        </div>
      )}

      {/* Chairman Verdict */}
      {chairmanMessage && (
        <div className="flex flex-col gap-6 mt-6">
          <h2 className="text-sm uppercase tracking-widest text-[#00fc9b] font-bold border-b border-white/10 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            Werdykt Przewodniczącego
          </h2>
          <div className="bg-gradient-to-br from-[#00fc9b]/10 to-[#003851]/30 rounded-2xl p-8 border border-[#00fc9b]/30">
            <div className="prose prose-invert prose-sm max-w-none text-zinc-100">
              <Markdown>{chairmanMessage.content}</Markdown>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-white/10 text-center text-zinc-500 text-xs pb-4">
        Wygenerowano przez AdviseHub &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
};
