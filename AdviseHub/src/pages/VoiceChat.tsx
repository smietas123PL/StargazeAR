import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

/**
 * VoiceChat - Komponent UI dla funkcji Real-time AI Voice Chat.
 * Architektura:
 * - Prezentacyjna warstwa aplikacji, korzystająca z hooka useVoiceChat do zarządzania stanem.
 * - Wyświetla status połączenia, transkrypcję rozmowy w czasie rzeczywistym oraz animowany wizualizator.
 * - Obsługuje interakcje użytkownika (rozpoczęcie/zakończenie rozmowy).
 * - Utrzymuje spójny styl wizualny (Obsidian Intelligence) z resztą aplikacji.
 */
export default function VoiceChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { voiceName, systemInstruction } = location.state || {};
  
  const { state, error, messages, connect, disconnect } = useVoiceChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isConnected = state === 'connected';
  const isConnecting = state === 'connecting';

  const handleConnect = () => {
    connect(voiceName, systemInstruction);
  };

  return (
    <div className="max-w-4xl mx-auto w-full h-[calc(100vh-6rem)] flex flex-col pb-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-black text-white tracking-tight mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">record_voice_over</span>
            Real-time AI Voice Chat
          </h1>
          <p className="text-zinc-400">
            Rozmawiaj z asystentem AI w czasie rzeczywistym używając głosu. Niska latencja dzięki Gemini Live API.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/voice-setup')}
          className="border-white/10 text-zinc-300 hover:bg-white/5"
        >
          <span className="material-symbols-outlined mr-2 text-sm">tune</span>
          Zmień ustawienia
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 flex items-start gap-3 mb-6">
          <span className="material-symbols-outlined">error</span>
          <div>
            <p className="font-bold mb-1">Wystąpił błąd</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 bg-surface-container-low border border-white/5 rounded-3xl p-6 flex flex-col overflow-hidden relative">
        {/* Connection Status Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-full border border-white/10 z-10">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-primary animate-pulse' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-500'}`}></div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {isConnected ? 'Połączono' : isConnecting ? 'Łączenie...' : 'Rozłączono'}
          </span>
        </div>

        {/* Chat Transcript */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
          {messages.length === 0 && !isConnected && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">mic_none</span>
              <p>Naciśnij przycisk poniżej, aby rozpocząć rozmowę.</p>
              {voiceName && (
                <p className="text-sm mt-2 opacity-70">Wybrany głos: <strong className="text-primary">{voiceName}</strong></p>
              )}
            </div>
          )}
          
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.isUser ? 'bg-primary/10 border border-primary/20 text-white' : 'bg-surface-container-highest border border-white/10 text-zinc-300'}`}>
                <div className="flex items-center gap-2 mb-1 opacity-50">
                  <span className="material-symbols-outlined text-[14px]">
                    {msg.isUser ? 'person' : 'smart_toy'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {msg.isUser ? 'Ty' : 'AI'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Visualizer / Controls */}
        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col items-center justify-center gap-6">
          {isConnected && (
            <div className="flex items-center gap-1 h-12">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 bg-primary rounded-full"
                  animate={{
                    height: ["20%", "100%", "20%"],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          )}

          <Button
            onClick={isConnected ? disconnect : handleConnect}
            disabled={isConnecting}
            className={`h-16 px-8 rounded-full text-lg font-bold transition-all duration-300 ${
              isConnected 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                : 'bg-primary text-[#003851] hover:opacity-90 shadow-[0_0_30px_rgba(0,252,155,0.2)]'
            }`}
          >
            <span className="material-symbols-outlined mr-2 text-2xl">
              {isConnected ? 'call_end' : 'mic'}
            </span>
            {isConnected ? 'Zakończ rozmowę' : 'Rozpocznij rozmowę'}
          </Button>
        </div>
      </div>
    </div>
  );
}
