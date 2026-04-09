import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdvisorTemplateCard, AdvisorTemplate } from '../components/features/AdvisorTemplateCard';
import { useCustomAdvisors } from '../hooks/useCustomAdvisors';
import { toast } from 'sonner';

const ADVISOR_TEMPLATES: AdvisorTemplate[] = [
  {
    id: 'saas_board',
    name: 'Zarząd Startup SaaS',
    description: 'Idealna rada dla founderów budujących skalowalne produkty B2B/B2C w modelu subskrypcyjnym.',
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
    id: 'ecommerce_board',
    name: 'Zarząd e-commerce',
    description: 'Eksperci od sprzedaży online, logistyki i marketingu efektywnościowego.',
    advisors: [
      {
        namePl: 'Ekspert Supply Chain',
        nameEn: 'Supply Chain Expert',
        role: 'supply_chain',
        description: 'Optymalizuje logistykę, magazynowanie i łańcuch dostaw.',
        systemPrompt: 'Jesteś Ekspertem ds. Łańcucha Dostaw. Skupiasz się na optymalizacji kosztów wysyłki, zarządzaniu zapasami, relacjach z dostawcami i logistyce zwrotów.',
        icon: 'local_shipping',
        color: 'bg-orange-500',
        bgClass: 'bg-orange-500/10',
        borderClass: 'border-orange-500/20',
        textClass: 'text-orange-500',
      },
      {
        namePl: 'Performance Marketer',
        nameEn: 'Performance Marketer',
        role: 'performance_marketer',
        description: 'Skupia się na ROAS, CPA i optymalizacji kampanii reklamowych.',
        systemPrompt: 'Jesteś Performance Marketerem. Liczą się dla Ciebie tylko twarde dane: ROAS, CPA, CTR, Conversion Rate. Optymalizujesz lejki sprzedażowe i kampanie reklamowe.',
        icon: 'ads_click',
        color: 'bg-pink-500',
        bgClass: 'bg-pink-500/10',
        borderClass: 'border-pink-500/20',
        textClass: 'text-pink-500',
      },
      {
        namePl: 'CX Lead',
        nameEn: 'Customer Experience Lead',
        role: 'cx_lead',
        description: 'Dba o satysfakcję klienta, retencję i programy lojalnościowe.',
        systemPrompt: 'Jesteś Liderem Customer Experience. Twoim celem jest zachwyt klienta. Analizujesz ścieżkę zakupową, obsługę klienta, unboxing experience i budujesz lojalność.',
        icon: 'favorite',
        color: 'bg-rose-500',
        bgClass: 'bg-rose-500/10',
        borderClass: 'border-rose-500/20',
        textClass: 'text-rose-500',
      },
      {
        namePl: 'Analityk Danych',
        nameEn: 'Data Analyst',
        role: 'data_analyst',
        description: 'Wyciąga wnioski z danych, analizuje kohorty i zachowania użytkowników.',
        systemPrompt: 'Jesteś Analitykiem Danych. Nie wierzysz w intuicję, wierzysz w liczby. Przeprowadzasz analizy kohortowe, testy A/B i szukasz ukrytych wzorców w zachowaniach klientów.',
        icon: 'bar_chart',
        color: 'bg-cyan-500',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-500/20',
        textClass: 'text-cyan-500',
      }
    ]
  },
  {
    id: 'solo_founder_board',
    name: 'Rada dla Founderów Solo',
    description: 'Wsparcie strategiczne i mentalne dla przedsiębiorców działających w pojedynkę.',
    advisors: [
      {
        namePl: 'Trener Mentalny',
        nameEn: 'Mental Health Coach',
        role: 'mental_coach',
        description: 'Dba o work-life balance, zapobiega wypaleniu i pomaga radzić sobie ze stresem.',
        systemPrompt: 'Jesteś Trenerem Mentalnym dla przedsiębiorców. Pomagasz radzić sobie ze stresem, samotnością foundera i syndromem oszusta. Przypominasz o odpoczynku i zdrowiu psychicznym.',
        icon: 'self_improvement',
        color: 'bg-teal-500',
        bgClass: 'bg-teal-500/10',
        borderClass: 'border-teal-500/20',
        textClass: 'text-teal-500',
      },
      {
        namePl: 'Guru Produktywności',
        nameEn: 'Productivity Guru',
        role: 'productivity_guru',
        description: 'Optymalizuje czas, systemy pracy i automatyzacje.',
        systemPrompt: 'Jesteś Guru Produktywności. Pomagasz founderom robić więcej w krótszym czasie. Proponujesz systemy (np. GTD, time-blocking), automatyzacje (Zapier, AI) i delegowanie zadań.',
        icon: 'timer',
        color: 'bg-yellow-500',
        bgClass: 'bg-yellow-500/10',
        borderClass: 'border-yellow-500/20',
        textClass: 'text-yellow-500',
      },
      {
        namePl: 'Konsultant Strategiczny',
        nameEn: 'Strategy Consultant',
        role: 'strategy_consultant',
        description: 'Pomaga ustalać priorytety i trzymać się głównego celu.',
        systemPrompt: 'Jesteś Konsultantem Strategicznym. Pomagasz founderom wyjść z "bieżączki" i spojrzeć na biznes z lotu ptaka. Ustalasz priorytety (np. OKR) i eliminujesz działania, które nie przynoszą wartości.',
        icon: 'explore',
        color: 'bg-indigo-400',
        bgClass: 'bg-indigo-400/10',
        borderClass: 'border-indigo-400/20',
        textClass: 'text-indigo-400',
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

export default function AdvisorTemplates() {
  const navigate = useNavigate();
  const { allAdvisors, saveCustomAdvisor } = useCustomAdvisors();
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

  const handleUseTemplate = async (template: AdvisorTemplate) => {
    setApplyingTemplateId(template.id);
    try {
      const selectedIds: string[] = [];

      for (const advisor of template.advisors) {
        if (advisor.isExisting && advisor.id) {
          selectedIds.push(advisor.id);
          continue;
        }

        // Check if an advisor with the same role already exists in user's custom advisors
        const existing = allAdvisors.find(a => a.role === advisor.role);
        if (existing) {
          selectedIds.push(existing.id);
        } else {
          // Create new custom advisor
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

  return (
    <div className="max-w-5xl mx-auto w-full pb-20">
      <div className="mb-12">
        <h1 className="text-3xl font-headline font-black text-white tracking-tight mb-2">Szablony Rad</h1>
        <p className="text-zinc-400">
          Gotowe zestawy ekspertów przygotowane do analizy konkretnych typów problemów i decyzji.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ADVISOR_TEMPLATES.map(template => (
          <AdvisorTemplateCard 
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
