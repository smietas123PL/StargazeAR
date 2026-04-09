# AdviseHub – Rada Doradcza AI

AdviseHub to zaawansowana platforma doradcza oparta na architekturze Multi-Agent System (MAS). Pozwala na zderzenie Twoich pomysłów i problemów strategicznych z wirtualną radą ekspertów napędzaną przez sztuczną inteligencję (Google Gemini). Dzięki ustrukturyzowanemu procesowi decyzyjnemu – od analizy kontekstu, przez obrady i wzajemną krytykę (Peer Review), aż po ostateczną syntezę – AdviseHub pomaga redukować błędy poznawcze i podejmować lepsze, bardziej obiektywne decyzje biznesowe.

## Główne funkcje (Wersja 1.1)

- **Multi-Agent Advisory Board**: Dostęp do predefiniowanych ról doradczych (m.in. Adwokat Diabła, Innowator, Sceptyk, Ekspert ds. Skalowania), które analizują problem z różnych perspektyw.
- **Własna Rada Doradcza (Custom Board)**: Możliwość tworzenia własnych, spersonalizowanych doradców z unikalnymi instrukcjami (System Prompts) dopasowanymi do Twojej branży.
- **Document Intelligence**: Możliwość załączania dokumentów (PDF, TXT, MD) jako kontekstu do sesji doradczych. AI analizuje ich treść i uwzględnia w rekomendacjach.
- **Decision Tracker**: Moduł do śledzenia podjętych decyzji w czasie, aktualizowania ich statusu i oceniania skuteczności.
- **Wspólne Sesje (Shared Boards)**: Możliwość zapraszania współpracowników do wspólnych sesji doradczych i pracy zespołowej w czasie rzeczywistym.
- **Ustrukturyzowany proces decyzyjny**: Fazy obrad (Advisors), wzajemnej krytyki (Peer Review) oraz podsumowania (Chairman Synthesis).
- **Eksport do PDF**: Generowanie eleganckich, profesjonalnych raportów z sesji doradczych, gotowych do udostępnienia zespołowi.
- **Model Freemium**: Darmowy plan na start (5 sesji miesięcznie) oraz nielimitowany plan Pro dla profesjonalistów.

## v1.1 – Co nowego

Wersja 1.1 to ogromny krok naprzód w kierunku profesjonalizacji narzędzia i wsparcia pracy zespołowej. Co nowego?
- **Marketplace Szablonów Rad**: Gotowe, predefiniowane zestawy doradców (np. Zarząd Startup SaaS, Rada Inwestycyjna) pozwalające rozpocząć sesję jednym kliknięciem.
- **Document Intelligence (RAG)**: Zaawansowany mechanizm Retrieval-Augmented Generation, który precyzyjnie wyszukuje najważniejsze fragmenty z załączonych dokumentów, dostarczając doradcom idealny kontekst bez "zaśmiecania" promptu.
- **Decision Tracker z Follow-upami**: Inteligentne śledzenie decyzji wzbogacone o automatyczne sesje follow-up. Chairman ocenia skutki Twoich wyborów (Oczekiwany vs Aktualny rezultat) i doradza kolejne kroki.
- **Shared Boards v2**: Ulepszony system współdzielenia sesji. Właściciel może zarządzać uczestnikami w czasie rzeczywistym, a wszyscy zaproszeni goście mogą aktywnie uczestniczyć w dyskusji z Chairmanem po wydaniu werdyktu.
- **Custom Board z wyborem**: Pełna kontrola nad składem rady przed każdą sesją – łącz wbudowanych ekspertów z własnymi, spersonalizowanymi doradcami.

## Uruchomienie lokalne

Aby uruchomić projekt lokalnie, wykonaj następujące kroki:

1. Klonowanie repozytorium i instalacja zależności:
   ```bash
   npm install
   ```

2. Konfiguracja zmiennych środowiskowych:
   Utwórz plik `.env` w głównym katalogu projektu i dodaj swój klucz API Gemini:
   ```env
   VITE_GEMINI_API_KEY=twój_klucz_api_tutaj
   ```

3. Konfiguracja Firebase:
   Upewnij się, że posiadasz plik `firebase-applet-config.json` z konfiguracją Twojego projektu Firebase (Authentication, Firestore).

4. Uruchomienie serwera deweloperskiego:
   ```bash
   npm run dev
   ```
   Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Deploy na Firebase Hosting

Aby wdrożyć aplikację na produkcję za pomocą Firebase Hosting:

1. Zbuduj aplikację:
   ```bash
   npm run build
   ```

2. Zainstaluj Firebase CLI (jeśli jeszcze go nie masz):
   ```bash
   npm install -g firebase-tools
   ```

3. Zaloguj się do Firebase:
   ```bash
   firebase login
   ```

4. Zainicjalizuj projekt (jeśli to pierwsze wdrożenie):
   ```bash
   firebase init hosting
   ```
   *Wybierz opcję użycia istniejącego projektu, wskaż katalog `dist` jako publiczny i skonfiguruj jako Single Page App (SPA).*

5. Wdróż aplikację:
   ```bash
   firebase deploy --only hosting
   ```

## Roadmapa (Najbliższe funkcje)

- **Document Intelligence v2**: Wsparcie dla większych plików, analiza obrazów i wykresów z dokumentów, OCR.
- **Integracje**: Połączenie z narzędziami takimi jak Notion, Slack czy Google Drive.
- **Voice Mode**: Możliwość prowadzenia obrad i rozmowy z Chairmanem za pomocą głosu (Real-time AI Voice).

## Jak pomóc w launchu (Dla Testerów)

Przygotowujemy się do oficjalnego startu! Będziemy wdzięczni za każdą formę wsparcia i feedbacku.

**O co prosimy:**
1. **Przetestuj skrajne przypadki (Edge Cases):** Spróbuj wgrać nietypowe pliki (PDF/TXT), stwórz bardzo specyficznych doradców (Custom Board) i zadaj im trudne, wielowątkowe pytania biznesowe.
2. **Zwróć uwagę na UX/UI:** Czy proces decyzyjny jest jasny? Czy czat z Chairmanem działa płynnie?
3. **Zgłaszaj błędy:** Jeśli coś nie działa (np. eksport PDF ucina tekst, doradca "halucynuje"), zrób zrzut ekranu i opisz kroki do reprodukcji.

**Gdzie zgłaszać feedback?**
Prosimy o przesyłanie uwag bezpośrednio na nasz kanał Slack/Discord lub poprzez zakładkę "Issues" w repozytorium. Twój feedback jest kluczowy przed publicznym launchem! 🚀
