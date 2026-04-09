import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MarketplaceTemplateCard, MarketplaceTemplate } from '../components/features/MarketplaceTemplateCard';
import { useCustomAdvisors } from '../hooks/useCustomAdvisors';
import { Button } from '../components/ui/button';

const MOCK_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'saas_board',
    name: 'Zarząd Startup SaaS',
    description: 'Idealna rada dla founderów budujących skalowalne produkty B2B/B2C w modelu subskrypcyjnym.',
    advisorsCount: 5,
    rating: 4.9,
    downloads: 1245,
    type: 'official',
    author: 'AdviseHub',
    advisors: [
      {
        namePl: 'Growth Hacker',
        nameEn: 'Growth Hacker',
        role: 'growth_hacker',
        description: 'Skupia się na wiralności, optymalizacji konwersji i tanim pozyskiwaniu użytkowników.',
        systemPrompt: 'Jesteś Growth Hackerem. Twoim celem jest znalezienie najszybszej i najtańszej drogi do wzrostu. Skupiasz się na metrykach takich jak CAC, LTV, churn i współczynnik konwersji. Proponuj nieszablonowe, zwinne eksperymenty.',
        icon: 'trending_up',
        color: 'bg-blue-500',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20',
        textClass: 'text-blue-500',
      },
      {
        namePl: 'Product Manager',
        nameEn: 'Product Manager',
        role: 'product_manager',
        description: 'Dba o to, by produkt rozwiązywał realne problemy użytkowników i miał świetny UX.',
        systemPrompt: 'Jesteś doświadczonym Product Managerem. Skupiasz się na potrzebach użytkownika, badaniach rynku i priorytetyzacji funkcji. Zawsze pytasz "jaki problem próbujemy rozwiązać?" i "jak zmierzymy sukces?".',
        icon: 'view_kanban',
        color: 'bg-indigo-500',
        bgClass: 'bg-indigo-500/10',
        borderClass: 'border-indigo-500/20',
        textClass: 'text-indigo-500',
      },
      {
        namePl: 'CFO',
        nameEn: 'Chief Financial Officer',
        role: 'cfo',
        description: 'Pilnuje finansów, cashflow, wyceny i modeli biznesowych.',
        systemPrompt: 'Jesteś CFO (Dyrektorem Finansowym). Twoim priorytetem jest płynność finansowa, rentowność i optymalizacja kosztów. Analizujesz modele biznesowe pod kątem ich opłacalności i ryzyk finansowych.',
        icon: 'account_balance',
        color: 'bg-emerald-500',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
        textClass: 'text-emerald-500',
      },
      {
        namePl: 'Ekspert Prawny',
        nameEn: 'Legal Expert',
        role: 'legal_expert',
        description: 'Identyfikuje ryzyka prawne, problemy z compliance i chroni własność intelektualną.',
        systemPrompt: 'Jesteś Ekspertem Prawnym. Zwracasz uwagę na regulacje (np. RODO, AI Act), umowy, własność intelektualną i potencjalne ryzyka prawne związane z decyzjami biznesowymi.',
        icon: 'gavel',
        color: 'bg-slate-500',
        bgClass: 'bg-slate-500/10',
        borderClass: 'border-slate-500/20',
        textClass: 'text-slate-500',
      },
      {
        namePl: 'Inwestor VC',
        nameEn: 'VC Investor',
        role: 'vc_investor',
        description: 'Ocenia pomysły pod kątem potencjału zwrotu z inwestycji i skalowalności.',
        systemPrompt: 'Jesteś Partnerem w funduszu Venture Capital. Szukasz firm, które mogą urosnąć 100x. Oceniasz wielkość rynku, przewagi konkurencyjne (moats), zespół i trakcję. Jesteś bezlitosny dla biznesów bez potencjału skali.',
        icon: 'attach_money',
        color: 'bg-amber-500',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/20',
        textClass: 'text-amber-500',
      }
    ]
  },
  {
    id: 'investment_board',
    name: 'Rada Inwestycyjna',
    description: 'Zestaw ekspertów do analizy rynków, aktywów i ryzyka inwestycyjnego.',
    advisorsCount: 4,
    rating: 4.8,
    downloads: 856,
    type: 'official',
    author: 'AdviseHub',
    advisors: [
      {
        namePl: 'Inwestor w Wartość',
        nameEn: 'Value Investor',
        role: 'value_investor',
        description: 'Szuka fundamentalnej wartości i marginesu bezpieczeństwa (styl Warrena Buffetta).',
        systemPrompt: 'Jesteś Inwestorem w Wartość (Value Investor). Szukasz aktywów wycenianych poniżej ich wewnętrznej wartości. Skupiasz się na fundamentach, przepływach pieniężnych i marginesie bezpieczeństwa.',
        icon: 'account_balance_wallet',
        color: 'bg-green-500',
        bgClass: 'bg-green-500/10',
        borderClass: 'border-green-500/20',
        textClass: 'text-green-500',
      },
      {
        namePl: 'Analityk Ryzyka',
        nameEn: 'Risk Analyst',
        role: 'risk_analyst',
        description: 'Identyfikuje czarne łabędzie, korelację i potencjalne straty.',
        systemPrompt: 'Jesteś Analitykiem Ryzyka. Twoim zadaniem jest znalezienie wszystkiego, co może pójść nie tak. Analizujesz zmienność, ryzyko płynności, ryzyko rynkowe i operacyjne.',
        icon: 'warning',
        color: 'bg-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/20',
        textClass: 'text-red-500',
      },
      {
        namePl: 'Makroekonomista',
        nameEn: 'Macroeconomist',
        role: 'macroeconomist',
        description: 'Patrzy na trendy globalne, stopy procentowe i inflację.',
        systemPrompt: 'Jesteś Makroekonomistą. Analizujesz decyzje w kontekście globalnych trendów, polityki banków centralnych, inflacji, demografii i cykli gospodarczych.',
        icon: 'public',
        color: 'bg-blue-400',
        bgClass: 'bg-blue-400/10',
        borderClass: 'border-blue-400/20',
        textClass: 'text-blue-400',
      },
      {
        namePl: 'Analityk Tech',
        nameEn: 'Tech Analyst',
        role: 'tech_analyst',
        description: 'Ocenia innowacyjność, disruptiveness i trendy technologiczne.',
        systemPrompt: 'Jesteś Analitykiem Technologicznym. Oceniasz, czy dana technologia ma szansę zdominować rynek. Znasz się na AI, blockchainie, SaaS i hardware. Szukasz efektów sieciowych.',
        icon: 'memory',
        color: 'bg-purple-500',
        bgClass: 'bg-purple-500/10',
        borderClass: 'border-purple-500/20',
        textClass: 'text-purple-500',
      }
    ]
  },
  {
    id: 'indie_hacker_board',
    name: 'Indie Hacker Squad',
    description: 'Rada dla solopreneurów budujących mikro-SaaS i produkty cyfrowe.',
    advisorsCount: 3,
    rating: 4.7,
    downloads: 432,
    type: 'community',
    author: 'alex_builds',
    advisors: [
      {
        namePl: 'Mistrz Bootstrappingu',
        nameEn: 'Bootstrapper',
        role: 'bootstrapper',
        description: 'Skupia się na zarabianiu od dnia pierwszego bez zewnętrznego finansowania.',
        systemPrompt: 'Jesteś ekspertem od bootstrappingu. Twoim celem jest jak najszybsze osiągnięcie rentowności. Unikasz niepotrzebnych kosztów i skupiasz się na sprzedaży.',
        icon: 'savings',
        color: 'bg-emerald-500',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
        textClass: 'text-emerald-500',
      },
      {
        namePl: 'Specjalista SEO',
        nameEn: 'SEO Specialist',
        role: 'seo_specialist',
        description: 'Buduje organiczny ruch i długoterminową widoczność w wyszukiwarkach.',
        systemPrompt: 'Jesteś specjalistą SEO. Szukasz słów kluczowych z długim ogonem, analizujesz intencje wyszukiwania i proponujesz strategie contentowe.',
        icon: 'search',
        color: 'bg-blue-500',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20',
        textClass: 'text-blue-500',
      },
      {
        namePl: 'UX/UI Designer',
        nameEn: 'UX/UI Designer',
        role: 'ux_designer',
        description: 'Dba o prostotę, użyteczność i estetykę produktu.',
        systemPrompt: 'Jesteś projektantem UX/UI. Skupiasz się na minimalizowaniu tarcia w interfejsie, czytelności i estetyce. Proponujesz proste, intuicyjne rozwiązania.',
        icon: 'brush',
        color: 'bg-pink-500',
        bgClass: 'bg-pink-500/10',
        borderClass: 'border-pink-500/20',
        textClass: 'text-pink-500',
      }
    ]
  },
  {
    id: 'marketing_agency_board',
    name: 'Zarząd Agencji Marketingowej',
    description: 'Dla właścicieli agencji: skalowanie, sprzedaż B2B i zarządzanie zespołem.',
    advisorsCount: 4,
    rating: 4.6,
    downloads: 215,
    type: 'community',
    author: 'sarah_marketing',
    advisors: [
      {
        namePl: 'Dyrektor Sprzedaży B2B',
        nameEn: 'B2B Sales Director',
        role: 'b2b_sales',
        description: 'Buduje lejki sprzedażowe, negocjuje kontrakty i zamyka deale.',
        systemPrompt: 'Jesteś Dyrektorem Sprzedaży B2B. Skupiasz się na outboundzie, cold mailingu, budowaniu relacji i zamykaniu wysokomarżowych kontraktów.',
        icon: 'handshake',
        color: 'bg-blue-600',
        bgClass: 'bg-blue-600/10',
        borderClass: 'border-blue-600/20',
        textClass: 'text-blue-600',
      },
      {
        namePl: 'HR Manager',
        nameEn: 'HR Manager',
        role: 'hr_manager',
        description: 'Rekrutuje, motywuje i dba o kulturę organizacyjną.',
        systemPrompt: 'Jesteś HR Managerem. Twoim celem jest budowanie silnego zespołu, zapobieganie rotacji i dbanie o kulturę organizacyjną.',
        icon: 'groups',
        color: 'bg-purple-400',
        bgClass: 'bg-purple-400/10',
        borderClass: 'border-purple-400/20',
        textClass: 'text-purple-400',
      },
      {
        namePl: 'Ekspert ds. Procesów',
        nameEn: 'Process Expert',
        role: 'process_expert',
        description: 'Standaryzuje usługi, wdraża procedury i narzędzia.',
        systemPrompt: 'Jesteś Ekspertem ds. Procesów. Nienawidzisz chaosu. Wdrażasz SOP (Standard Operating Procedures), automatyzacje i narzędzia do zarządzania projektami.',
        icon: 'account_tree',
        color: 'bg-amber-600',
        bgClass: 'bg-amber-600/10',
        borderClass: 'border-amber-600/20',
        textClass: 'text-amber-600',
      },
      {
        namePl: 'Głos Krytyczny',
        nameEn: 'The Contrarian',
        role: 'contrarian',
        description: 'Szuka luk w logice i najgorszych scenariuszy.',
        systemPrompt: 'Jesteś Głosem Krytycznym. Szukasz luk w logice, ukrytych ryzyk i najgorszych scenariuszy.',
        icon: 'gavel',
        color: 'bg-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/20',
        textClass: 'text-red-500',
        isExisting: true,
        id: 'contrarian'
      }
    ]
  }
];

export default function Marketplace() {
  const navigate = useNavigate();
  const { allAdvisors, saveCustomAdvisor } = useCustomAdvisors();
  const [activeTab, setActiveTab] = useState<'all' | 'official' | 'community'>('all');
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

  const filteredTemplates = MOCK_TEMPLATES.filter(t => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  });

  const handleUseTemplate = async (template: MarketplaceTemplate) => {
    setApplyingTemplateId(template.id);
    try {
      const selectedIds: string[] = [];

      for (const advisor of template.advisors) {
        if (advisor.isExisting && advisor.id) {
          selectedIds.push(advisor.id);
          continue;
        }

        const existing = allAdvisors.find(a => a.role === advisor.role);
        if (existing) {
          selectedIds.push(existing.id);
        } else {
          const newId = await saveCustomAdvisor(advisor);
          if (newId) {
            selectedIds.push(newId);
          }
        }
      }

      toast.success('Szablon został załadowany.');
      navigate('/', { state: { selectedAdvisors: selectedIds } });
    } catch (err) {
      console.error('Error applying template:', err);
      toast.error('Wystąpił błąd podczas ładowania szablonu.');
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const handlePublish = () => {
    toast.info('Funkcja w przygotowaniu', {
      description: 'Wkrótce będziesz mógł publikować własne szablony dla społeczności.'
    });
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-headline font-black text-white tracking-tight mb-2">Advisor Marketplace</h1>
          <p className="text-zinc-400 max-w-2xl">
            Odkrywaj i pobieraj gotowe rady doradcze stworzone przez ekspertów i społeczność AdviseHub.
          </p>
        </div>
        <Button 
          onClick={handlePublish}
          className="bg-surface-container-high text-white hover:bg-white/10 border border-white/10 shrink-0"
        >
          <span className="material-symbols-outlined mr-2 text-[18px]">publish</span>
          Opublikuj swój szablon
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-px">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Wszystkie
        </button>
        <button
          onClick={() => setActiveTab('official')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'official' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Oficjalne
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'community' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Społecznościowe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <MarketplaceTemplateCard 
            key={template.id} 
            template={template} 
            onUseTemplate={handleUseTemplate}
            isApplying={applyingTemplateId === template.id}
          />
        ))}
      </div>
    </div>
  );
}
