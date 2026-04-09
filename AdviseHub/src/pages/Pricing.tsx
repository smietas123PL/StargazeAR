import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PricingCard } from '../components/features/PricingCard';
import { useUserPlan } from '../hooks/useUserPlan';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function Pricing() {
  const navigate = useNavigate();
  const { isPro } = useUserPlan();
  const { user } = useAuth();

  const handleUpgrade = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isPro) {
      toast.info('Posiadasz już aktywny plan Pro!');
      return;
    }
    // Placeholder for Stripe checkout
    toast.success('Przekierowanie do bramki płatności...');
  };

  const handleFreeClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/');
    }
  };

  const faqs = [
    {
      q: "Czy mogę anulować subskrypcję w dowolnym momencie?",
      a: "Tak, subskrypcję Pro możesz anulować w każdej chwili. Zachowasz dostęp do funkcji premium do końca bieżącego okresu rozliczeniowego."
    },
    {
      q: "Jak działa analiza dokumentów (Document Intelligence)?",
      a: "W planie Pro możesz wgrać do 5 plików (PDF, TXT, MD) o rozmiarze do 15MB każdy. Nasi doradcy AI przeanalizują ich treść i uwzględnią ją w swoich rekomendacjach."
    },
    {
      q: "Czym różni się własny doradca od domyślnego?",
      a: "Domyślni doradcy mają z góry ustalone role (np. Adwokat Diabła). Własny doradca pozwala Ci zdefiniować unikalny system prompt, specjalizację oraz awatar, idealnie dopasowując go do Twojej branży."
    },
    {
      q: "Czy moje dane i dokumenty są bezpieczne?",
      a: "Tak. Dokumenty są przetwarzane wyłącznie na czas trwania sesji i nie są wykorzystywane do trenowania naszych modeli. Twoja prywatność to nasz priorytet."
    }
  ];

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto w-full pb-20">
      
      {/* Header Section */}
      <div className="text-center mb-16 mt-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 border border-primary/20">
          <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
          Wybierz plan idealny dla siebie
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
          Zwiększ jakość swoich decyzji dzięki zaawansowanym narzędziom AI. Rozpocznij za darmo lub odblokuj pełen potencjał z planem Pro.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto mb-24">
        <PricingCard 
          title="Free"
          price="0 PLN"
          description="Idealny na start, aby przetestować możliwości Rady Doradczej AI."
          features={[
            "Maksymalnie 5 sesji doradczych miesięcznie",
            "Dostęp do 5 domyślnych doradców",
            "Podstawowa synteza Chairmana",
            "Historia sesji (ograniczona)"
          ]}
          buttonText={isPro ? "Twój obecny plan" : "Rozpocznij za darmo"}
          onButtonClick={handleFreeClick}
          isPro={false}
        />
        
        <PricingCard 
          title="Pro"
          price="59 PLN"
          description="Dla profesjonalistów wymagających głębokiej analizy i personalizacji."
          features={[
            "Nielimitowana liczba sesji doradczych",
            "Document Intelligence (analiza PDF, TXT, MD)",
            "Własna Rada Doradcza (tworzenie własnych doradców)",
            "Eksport raportów do PDF",
            "Priorytetowa obsługa i wsparcie"
          ]}
          buttonText={isPro ? "Zarządzaj subskrypcją" : "Przejdź na Pro"}
          onButtonClick={handleUpgrade}
          isPro={true}
        />
      </div>

      {/* Feature Comparison Table */}
      <div className="w-full max-w-4xl mx-auto mb-24">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Porównanie funkcji</h2>
        <div className="bg-surface-container-low/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 md:p-6 text-sm font-medium text-zinc-400 w-1/2">Funkcja</th>
                <th className="p-4 md:p-6 text-sm font-bold text-white text-center w-1/4">Free</th>
                <th className="p-4 md:p-6 text-sm font-bold text-primary text-center w-1/4">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: "Liczba sesji doradczych", free: "5 / miesiąc", pro: "Nielimitowana" },
                { name: "Domyślni doradcy (Adwokat Diabła, itp.)", free: "Tak", pro: "Tak" },
                { name: "Własni doradcy (Custom Board)", free: "-", pro: "Tak" },
                { name: "Analiza dokumentów (PDF, TXT, MD)", free: "-", pro: "Tak (do 15MB/plik)" },
                { name: "Eksport wyników do PDF", free: "-", pro: "Tak" },
                { name: "Priorytetowy support", free: "-", pro: "Tak" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 md:p-6 text-sm text-zinc-300">{row.name}</td>
                  <td className="p-4 md:p-6 text-sm text-zinc-500 text-center font-medium">
                    {row.free === '-' ? <span className="material-symbols-outlined text-zinc-600 text-[18px]">remove</span> : row.free}
                  </td>
                  <td className="p-4 md:p-6 text-sm text-white text-center font-bold">
                    {row.pro === 'Tak' ? <span className="material-symbols-outlined text-primary text-[18px]">check</span> : row.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="w-full max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Często zadawane pytania</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-surface-container-low/30 border border-white/5 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-white mb-2">{faq.q}</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-zinc-500 max-w-md mx-auto">
        <p>
          Ceny zawierają podatek VAT. Subskrypcja odnawia się automatycznie co miesiąc. 
          Możesz zrezygnować w dowolnym momencie w ustawieniach konta.
        </p>
      </div>

    </div>
  );
}
