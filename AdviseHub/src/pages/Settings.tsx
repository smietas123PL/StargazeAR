import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useSettings } from '../hooks/useSettings';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function Settings() {
  const { profile } = useAuth();
  const {
    geminiKey,
    saveGeminiKey,
    geminiModel,
    saveGeminiModel,
    testConnection,
    isTesting,
    displayName,
    setDisplayName,
    updateDisplayName,
    isSavingProfile
  } = useSettings();

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8 pb-32">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-headline font-black text-white tracking-tight mb-2">
          Ustawienia Systemu
        </h1>
        <p className="text-on-surface-variant text-sm md:text-base">
          Zarządzaj konfiguracją API, swoim profilem i preferencjami aplikacji.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* 1. Konfiguracja Gemini */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">api</span>
            Konfiguracja Gemini API
          </h2>
          <Card className="bg-surface-container-low/60 backdrop-blur-xl border-white/5 p-6">
            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <Label htmlFor="api-key" className="text-zinc-300">Klucz API (Gemini)</Label>
                <div className="flex gap-3">
                  <Input 
                    id="api-key"
                    type="password"
                    value={geminiKey}
                    onChange={(e) => saveGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="bg-surface-container-highest border-white/10 text-white focus-visible:ring-primary/50 font-mono"
                  />
                  <Button 
                    onClick={testConnection}
                    disabled={isTesting || !geminiKey}
                    className="shrink-0 bg-surface-container-highest text-white border border-white/10 hover:bg-surface-container-highest/80"
                  >
                    {isTesting ? (
                      <span className="material-symbols-outlined animate-spin text-sm mr-2">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm mr-2">wifi_tethering</span>
                    )}
                    Testuj
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  Klucz jest zapisywany tylko lokalnie w Twojej przeglądarce (localStorage).
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300">Model AI</Label>
                <Select value={geminiModel} onValueChange={saveGeminiModel}>
                  <SelectTrigger className="w-full bg-surface-container-highest border-white/10 text-white">
                    <SelectValue placeholder="Wybierz model" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-high border-white/10 text-white">
                    <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Najlepsza jakość)</SelectItem>
                    <SelectItem value="gemini-3-flash-preview">Gemini 3.0 Flash (Najszybszy)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-500">
                  Wersja Pro oferuje głębszą analizę, Flash jest szybszy i tańszy.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* 2. Profil Użytkownika */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person</span>
            Profil Użytkownika
          </h2>
          <Card className="bg-surface-container-low/60 backdrop-blur-xl border-white/5 p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 p-4 bg-surface-container-highest rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">account_circle</span>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Zalogowano jako</p>
                  <p className="text-white font-bold">{profile?.email}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 rounded-full bg-surface-container-low border border-white/10 text-xs text-zinc-300 uppercase tracking-wider font-bold">
                    Plan {profile?.plan}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="display-name" className="text-zinc-300">Nazwa wyświetlana</Label>
                <div className="flex gap-3">
                  <Input 
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Twoje imię / pseudonim"
                    className="bg-surface-container-highest border-white/10 text-white focus-visible:ring-primary/50"
                  />
                  <Button 
                    onClick={updateDisplayName}
                    disabled={isSavingProfile || displayName === profile?.displayName}
                    className="shrink-0 bg-primary text-[#003851] hover:bg-primary/90 font-bold"
                  >
                    {isSavingProfile ? 'Zapisywanie...' : 'Zapisz'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Informacje o aplikacji */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            O Aplikacji
          </h2>
          <Card className="bg-surface-container-low/60 backdrop-blur-xl border-white/5 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                  <div>
                    <h3 className="text-lg font-headline font-black text-white uppercase tracking-tight">AdviseHub</h3>
                    <p className="text-xs text-zinc-500">Wersja 1.0.0-beta</p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-zinc-400 leading-relaxed space-y-4">
                <p>
                  AdviseHub to zaawansowana platforma doradcza oparta na architekturze Multi-Agent System (MAS). 
                  Wykorzystuje modele Google Gemini do symulacji "Rady Nadzorczej" składającej się z 5 ekspertów o różnych perspektywach.
                </p>
                <p>
                  Aplikacja przetwarza Twój problem przez 4 etapy:
                  <br/>1. Zebranie kontekstu
                  <br/>2. Niezależna analiza przez 5 Doradców
                  <br/>3. Anonimowy Peer Review (krytyka krzyżowa)
                  <br/>4. Ostateczna synteza i werdykt przez Przewodniczącego
                </p>
              </div>

              <div className="pt-4 mt-2">
                <Button variant="outline" className="w-full sm:w-auto border-white/10 text-zinc-300 hover:text-white hover:bg-surface-container-highest">
                  <span className="material-symbols-outlined text-sm mr-2">menu_book</span>
                  Dokumentacja Systemu
                </Button>
              </div>
            </div>
          </Card>
        </section>

      </div>
    </div>
  );
}
