import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#001f2e] text-white font-body selection:bg-primary/30 selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#001f2e]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            <span className="font-headline font-black text-2xl uppercase tracking-tighter text-white">AdviseHub</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden sm:block">
              Cennik
            </Link>
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-white rounded-full px-6"
            >
              Zaloguj się
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 lg:pt-48 lg:pb-32">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Nowość: Document Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight leading-[1.1] mb-8">
            Rada ekspertów, która pomaga Ci podejmować <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              lepsze decyzje strategiczne
            </span>
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Zderz swoje pomysły z wieloma perspektywami sztucznej inteligencji, zanim wprowadzisz je w życie.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-zinc-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              Używany przez founderów z Polski i Europy
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
              Ponad 250 sesji doradczych przeprowadzonych
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-gradient-to-r from-primary to-secondary text-[#003851] font-bold text-lg shadow-[0_0_30px_rgba(0,252,155,0.3)] hover:opacity-90 transition-all"
            >
              Rozpocznij za darmo
            </Button>
            <Button 
              onClick={() => navigate('/pricing')}
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 rounded-full border-white/10 hover:bg-white/5 text-white font-bold text-lg"
            >
              Zobacz cennik
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-surface-container-lowest relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-black mb-4">Jak działa AdviseHub?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Proces decyzyjny zoptymalizowany pod kątem maksymalnej obiektywności i redukcji błędów poznawczych.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: 'edit_document', title: '1. Kontekst', desc: 'Opisujesz problem i załączasz dokumenty (PDF, TXT).' },
              { icon: 'group', title: '2. Obrady', desc: 'Wybierasz doradców, którzy analizują problem z różnych perspektyw.' },
              { icon: 'rate_review', title: '3. Peer Review', desc: 'Doradcy anonimowo oceniają i krytykują nawzajem swoje pomysły.' },
              { icon: 'gavel', title: '4. Synteza', desc: 'Chairman podsumowuje dyskusję i wydaje ostateczną rekomendację.' }
            ].map((step, i) => (
              <div key={i} className="bg-surface-container-low/50 border border-white/5 rounded-3xl p-8 text-center hover:bg-surface-container-low transition-colors">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                  <span className="material-symbols-outlined text-3xl text-primary">{step.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-headline font-black mb-6">Dlaczego warto?</h2>
                <p className="text-zinc-400 text-lg">Zastąp intuicję ustrukturyzowanym procesem decyzyjnym wspieranym przez AI.</p>
              </div>
              
              <div className="space-y-8">
                {[
                  { icon: 'psychology', title: 'Własna Rada Doradcza', desc: 'Twórz własnych doradców z unikalnymi instrukcjami, dopasowanych do Twojej branży.' },
                  { icon: 'document_scanner', title: 'Document Intelligence', desc: 'Wgrywaj raporty i analizy. AI uwzględni je w swoich rekomendacjach.' },
                  { icon: 'picture_as_pdf', title: 'Profesjonalne raporty', desc: 'Eksportuj wyniki obrad do eleganckich plików PDF gotowych do prezentacji.' },
                  { icon: 'memory', title: 'Pamięć decyzji', desc: 'Wracaj do historycznych sesji i ucz się na własnych procesach decyzyjnych.' }
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-surface-container-high rounded-xl flex items-center justify-center border border-white/10">
                      <span className="material-symbols-outlined text-primary">{benefit.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1">{benefit.title}</h4>
                      <p className="text-zinc-400 text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-[80px] rounded-full" />
              <div className="relative bg-surface-container-low border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">gavel</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Chairman Synthesis</h4>
                    <p className="text-xs text-zinc-400">Ostateczna rekomendacja</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-white/5 rounded-full w-3/4" />
                  <div className="h-4 bg-white/5 rounded-full w-full" />
                  <div className="h-4 bg-white/5 rounded-full w-5/6" />
                  <div className="h-4 bg-white/5 rounded-full w-4/5" />
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-[#001f2e] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-zinc-400">person</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Konsensus osiągnięty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-headline font-black mb-16 text-center">Zaufali nam</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "AdviseHub uratował nas przed złą inwestycją. Adwokat Diabła zauważył ryzyka, które całkowicie przeoczyliśmy.", author: "Michał", role: "Startup Founder" },
              { quote: "Możliwość wgrania 50-stronicowego raportu rynkowego i przedyskutowania go z AI to absolutny gamechanger.", author: "Anna", role: "Dyrektor Strategii" },
              { quote: "Używam własnych doradców zdefiniowanych pod moją branżę. Wyniki są nieprawdopodobnie trafne.", author: "Piotr", role: "CEO Software House" }
            ].map((t, i) => (
              <div key={i} className="bg-surface-container-low border border-white/5 rounded-3xl p-8 relative">
                <span className="material-symbols-outlined text-4xl text-primary/20 absolute top-6 right-6">format_quote</span>
                <p className="text-zinc-300 mb-8 relative z-10">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-400">person</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{t.author}</h4>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Pricing Teaser */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-headline font-black mb-6">Gotowy na lepsze decyzje?</h2>
          <p className="text-xl text-zinc-400 mb-10">Dołącz do liderów, którzy wspierają swoje strategie sztuczną inteligencją.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto h-14 px-10 rounded-full bg-gradient-to-r from-primary to-secondary text-[#003851] font-bold text-lg"
            >
              Rozpocznij za darmo
            </Button>
            <Button 
              onClick={() => navigate('/pricing')}
              variant="outline"
              className="w-full sm:w-auto h-14 px-10 rounded-full border-white/10 hover:bg-white/5 text-white font-bold text-lg"
            >
              Zobacz pełny cennik
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#001f2e]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            <span className="font-headline font-black text-xl uppercase tracking-tighter text-white">AdviseHub</span>
          </div>
          <p className="text-sm text-zinc-500">
            &copy; 2026 AdviseHub. Wszelkie prawa zastrzeżone.
          </p>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link to="/pricing" className="hover:text-white transition-colors">Cennik</Link>
            <Link to="/login" className="hover:text-white transition-colors">Logowanie</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
