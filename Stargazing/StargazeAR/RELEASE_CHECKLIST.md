# Release Checklist — StargazeAR

## 1. Cel dokumentu

Ten dokument służy jako operacyjny runbook do uruchamiania, testowania i przygotowania preview APK dla projektu StargazeAR.

Używaj go:
- przed lokalnymi testami na fizycznym urządzeniu
- przed uruchomieniem buildu preview w EAS
- po instalacji preview APK na telefonie z Androidem

Dokument zakłada środowisko:
- Windows
- PowerShell
- fizyczny telefon z Androidem
- custom dev client Expo
- działający dostęp do EAS Build

## 2. Szybkie wymagania wstępne

- Windows
- PowerShell
- fizyczny telefon z Androidem
- włączone debugowanie USB
- zainstalowany custom dev client
- konto i konfiguracja EAS
- `IS_MOCK_ENABLED = false`

## 3. Instrukcja uruchomienia krok po kroku

### 3.1 Przygotowanie środowiska

1. Otwórz PowerShell.

2. Przejdź do katalogu projektu:

```powershell
cd C:\Users\grzeg\Desktop\Project\Stargazing\StargazeAR
```

**Oczekiwany rezultat**
- PowerShell pokazuje, że bieżący katalog to `StargazeAR`.

**Jeśli nie działa**
- sprawdź, czy ścieżka projektu jest poprawna
- sprawdź, czy folder został utworzony lokalnie

3. Sprawdź wersje Node i npm:

```powershell
node -v
npm -v
```

**Oczekiwany rezultat**
- obie komendy zwracają numer wersji
- nie pojawia się błąd typu „command not found”

**Jeśli nie działa**
- zainstaluj Node LTS
- uruchom PowerShell ponownie

4. Sprawdź, czy telefon jest widoczny dla ADB:

```powershell
adb devices
```

**Oczekiwany rezultat**
- telefon pojawia się na liście ze statusem `device`

**Jeśli nie działa**
- włącz debugowanie USB w ustawieniach programistycznych telefonu
- zaakceptuj komunikat autoryzacji ADB na telefonie
- odłącz i podłącz kabel USB ponownie
- sprawdź, czy `adb` jest dostępne w systemowym `PATH`

5. Potwierdź, że aplikacja nie jest pozostawiona w trybie mocków:

```powershell
Select-String -Path .\src\utils\sensorMock.ts -Pattern "IS_MOCK_ENABLED = false"
```

**Oczekiwany rezultat**
- wynik pokazuje linię z `IS_MOCK_ENABLED = false`

**Jeśli nie działa**
- popraw plik `src\utils\sensorMock.ts`
- nie przechodź dalej, dopóki mock mode nie będzie wyłączony

6. Upewnij się, że zależności projektu są zainstalowane:

```powershell
npm install
```

**Oczekiwany rezultat**
- instalacja kończy się bez błędów krytycznych

### 3.2 Uruchomienie lokalne przez dev client

1. Zweryfikuj TypeScript:

```powershell
npx tsc --noEmit
```

**Oczekiwany rezultat**
- komenda kończy się bez błędów

**Jeśli nie działa**
- napraw błędy TypeScript przed dalszymi testami

2. Uruchom testy:

```powershell
npm test -- --runInBand
```

**Oczekiwany rezultat**
- wszystkie testy przechodzą na zielono

**Jeśli nie działa**
- nie uruchamiaj preview buildu
- popraw testy lub kod

3. Jeszcze raz potwierdź `IS_MOCK_ENABLED = false`:

```powershell
Select-String -Path .\src\utils\sensorMock.ts -Pattern "IS_MOCK_ENABLED = false"
```

4. Uruchom Metro:

```powershell
npx expo start
```

**Oczekiwany rezultat**
- Metro uruchamia się poprawnie
- pojawia się adres serwera i QR dla dev clienta

5. Otwórz aplikację na telefonie w custom dev client.

**Uwaga**
- nie używaj Expo Go
- aplikacja ma działać w custom dev client zbudowanym wcześniej dla tego projektu

6. Jeśli custom dev client nie jest jeszcze zainstalowany na telefonie:
- zainstaluj wcześniejszy build development albo preview
- dopiero potem wróć do uruchamiania aplikacji

7. Po poprawnym starcie aplikacji sprawdź, co widać na ekranie.

**Oczekiwany rezultat**
- ekran prośby o uprawnienie do kamery albo podgląd z kamery
- HUD kompasu w prawym górnym rogu
- SVG overlay konstelacji nad kamerą
- dolna karta statusowa
- ewentualny banner fallbacku Warszawy, jeśli GPS jeszcze nie działa

**Jeśli nie działa**
- czarny ekran bez UI: sprawdź logi Metro i stan połączenia dev clienta
- brak kamery: sprawdź uprawnienie do aparatu
- brak overlayu: sprawdź błędy runtime i stan gotowości kamery

### 3.3 Pierwsze testy manualne po uruchomieniu

Wykonuj testy dokładnie w tej kolejności.

1. Sprawdź kamerę.
   1. Jeśli pojawi się ekran zgody na aparat, kliknij przycisk zezwolenia.
   2. Sprawdź, czy pojawia się obraz z tylnej kamery.

**Oczekiwany rezultat**
- kamera działa
- aplikacja przechodzi do widoku AR

**Jeśli nie działa**
- sprawdź uprawnienia aplikacji w ustawieniach Androida
- uruchom aplikację ponownie

2. Sprawdź lokalizację.
   1. Nadaj zgodę na lokalizację, jeśli system o nią poprosi.
   2. Obserwuj banner fallbacku Warszawy.

**Oczekiwany rezultat**
- jeśli GPS działa, banner znika
- jeśli GPS jeszcze nie działa, banner pozostaje i informuje o użyciu Warszawy

**Uwaga**
- banner Warszawy oznacza tryb awaryjny, a nie awarię aplikacji
- aplikacja nadal działa, ale obliczenia nieba są liczone dla Warszawy

**Jeśli nie działa**
- jeśli banner nie znika mimo działającego GPS, sprawdź zgodę lokalizacyjną i ustawienia lokalizacji telefonu

3. Sprawdź heading i pitch.
   1. Obróć telefon powoli wokół własnej osi.
   2. Obserwuj heading w HUD.
   3. Pochyl telefon w górę i w dół.
   4. Obserwuj wartość `Pitch`.

**Oczekiwany rezultat**
- heading zmienia się płynnie
- pitch zmienia się zgodnie z pochyleniem telefonu

**Jeśli nie działa**
- heading nie reaguje: sprawdź kompas i lokalizację
- pitch nie reaguje: sprawdź dostępność DeviceMotion na urządzeniu

4. Sprawdź kalibrację headingu.
   1. Jeśli pojawia się banner `Status sensorów`, przeczytaj komunikat.
   2. Przy słabej kalibracji porusz telefonem w kształcie cyfry 8.

**Oczekiwany rezultat**
- poziom kalibracji poprawia się do `2` albo `3`

**Uwaga**
- poziom kalibracji headingu to zawsze `0 | 1 | 2 | 3`
- nie interpretujemy kalibracji jako stopni

**Jeśli nie działa**
- odejdź od metalowych powierzchni i elektroniki
- wyjdź na zewnątrz lub bliżej okna

5. Sprawdź interakcję z konstelacjami.
   1. Znajdź widoczną etykietę konstelacji.
   2. Dotknij etykiety.

**Oczekiwany rezultat**
- otwiera się panel informacji o właściwej konstelacji

**Jeśli nie działa**
- brak reakcji: sprawdź pozycjonowanie touch targetów
- zła konstelacja: sprawdź zgodność pozycji etykiety i touch targetu

6. Sprawdź panel informacji.
   1. Zweryfikuj nazwę polską, nazwę angielską, opis i wysokość nad horyzontem.
   2. Zamknij panel.

**Oczekiwany rezultat**
- panel otwiera się płynnie od dołu
- panel zamyka się bez przycięć i bez kolizji z dolną kartą

7. Sprawdź kalibrację ręczną.
   1. Kliknij `Kalibracja`.
   2. Zmień azymut, pitch i FOV.
   3. Kliknij `Zapisz`.

**Oczekiwany rezultat**
- aplikacja od razu wraca do widoku AR
- overlay reaguje na nowe wartości
- UI nie czeka na zapis do `AsyncStorage`

**Jeśli nie działa**
- jeśli powrót do AR jest opóźniony, sprawdź logikę zapisu
- jeśli wartości się nie zmieniają, sprawdź stan kalibracji w `App.tsx`

8. Sprawdź odczyt zapisanej kalibracji.
   1. Zamknij aplikację całkowicie.
   2. Uruchom ją ponownie.
   3. Wejdź ponownie do `Kalibracja`.

**Oczekiwany rezultat**
- ostatnio zapisane wartości nadal są widoczne

9. Sprawdź reset kalibracji.
   1. Wejdź do `Kalibracja`.
   2. Kliknij `Resetuj`.
   3. Sprawdź, czy wartości wróciły do domyślnych.
   4. Sprawdź komunikat o ostatnim zapisie.

**Oczekiwany rezultat**
- wartości robocze wracają do domyślnych
- reset nie udaje nowego zapisu
- dopiero `Zapisz` utrwala zmianę

10. Sprawdź tryb nocny.
    1. Kliknij `Tryb dzienny` lub `Tryb nocny`.
    2. Przełącz kilka razy.

**Oczekiwany rezultat**
- przycisk reaguje animacją
- interfejs zmienia kolory na czerwone
- nie ma rozjechania layoutu

11. Sprawdź etykiety przy krawędziach ekranu.
    1. Obracaj telefon, aż etykiety zbliżą się do krawędzi.
    2. Sprawdź ich zachowanie.

**Oczekiwany rezultat**
- etykiety nie są rysowane w oczywiście złych miejscach
- tap targety nie wychodzą daleko poza ekran

### 3.4 Przygotowanie do builda preview APK

1. Przejdź do katalogu projektu:

```powershell
cd C:\Users\grzeg\Desktop\Project\Stargazing\StargazeAR
```

2. Potwierdź, że mock mode jest wyłączony:

```powershell
Select-String -Path .\src\utils\sensorMock.ts -Pattern "IS_MOCK_ENABLED = false"
```

3. Zweryfikuj TypeScript:

```powershell
npx tsc --noEmit
```

4. Uruchom testy:

```powershell
npm test -- --runInBand
```

5. Jeśli chcesz zrobić ostatni sanity check na telefonie, uruchom Metro:

```powershell
npx expo start
```

6. Potwierdź manualnie jeszcze raz:
- kamera działa
- lokalizacja działa albo fallback Warszawy jest czytelny
- heading reaguje
- pitch reaguje
- tap na etykietę konstelacji otwiera panel
- kalibracja zapisuje i odczytuje wartości
- tryb nocny działa
- etykiety przy krawędziach zachowują się poprawnie

7. Uruchom build preview APK:

```powershell
npx eas build --platform android --profile preview
```

**Oczekiwany rezultat**
- EAS przyjmuje build
- pojawia się link do śledzenia postępu
- build dochodzi do końca bez błędów konfiguracyjnych

**Jeśli nie działa**
- sprawdź logowanie do EAS
- sprawdź `eas.json`
- sprawdź `projectId`
- sprawdź, czy projekt korzysta z custom dev client, a nie Expo Go

8. Po zakończeniu builda:
   1. Otwórz link do APK.
   2. Pobierz APK lokalnie albo otwórz link na telefonie.
   3. Zainstaluj APK na urządzeniu testowym.

### 3.5 Test po instalacji APK

1. Wykonaj czystą instalację.
   1. Odinstaluj poprzednią wersję preview, jeśli była zainstalowana.
   2. Zainstaluj nowy APK.

2. Uruchom aplikację po raz pierwszy.

**Oczekiwany rezultat**
- aplikacja startuje bez crasha
- pojawia się ekran uprawnień albo widok kamery z overlayem

3. Sprawdź flow uprawnienia kamery.
   1. Nadaj zgodę na aparat.
   2. Potwierdź, że kamera zaczyna działać.

4. Sprawdź flow uprawnienia lokalizacji.
   1. Nadaj zgodę na lokalizację.
   2. Potwierdź, że fallback Warszawy znika przy działającym GPS.

5. Sprawdź sensory.
   1. Obróć telefon i sprawdź heading.
   2. Pochyl telefon i sprawdź pitch.
   3. Sprawdź komunikat o kalibracji kompasu.

6. Sprawdź UI.
   1. Dotknij etykiety konstelacji.
   2. Otwórz i zamknij panel informacji.
   3. Przełącz `Tryb nocny`.
   4. Sprawdź, czy przyciski nie nachodzą na siebie i nie wpadają pod obszary systemowe.

7. Sprawdź persystencję.
   1. Zmień kalibrację.
   2. Kliknij `Zapisz`.
   3. Zamknij aplikację.
   4. Uruchom ją ponownie.
   5. Potwierdź, że kalibracja została zachowana.

8. Sprawdź etykiety przy krawędziach.
   1. Obróć telefon tak, aby część etykiet przesunęła się ku brzegom ekranu.
   2. Sprawdź, czy etykiety i touch targety zachowują się poprawnie.

## 4. Skrócona checklista przed buildem

- `IS_MOCK_ENABLED = false`
- `npx tsc --noEmit`
- `npm test -- --runInBand`
- telefon widoczny w `adb devices`
- aplikacja uruchamia się w custom dev client, nie w Expo Go
- kamera działa
- lokalizacja działa albo fallback Warszawy jest czytelny
- heading reaguje
- pitch reaguje
- tap na konstelację działa
- kalibracja zapisuje się i odczytuje
- tryb nocny działa
- etykiety przy krawędziach są stabilne
- brak oczywistych kolizji UI

## 5. Skrócona checklista po instalacji APK

- aplikacja uruchamia się bez crasha
- flow kamery działa poprawnie
- flow lokalizacji działa poprawnie
- heading reaguje na obrót telefonu
- pitch reaguje na pochylenie telefonu
- tap na etykietę konstelacji otwiera panel
- panel informacji zamyka się poprawnie
- kalibracja zapisuje się i odczytuje po restarcie
- tryb nocny działa stabilnie
- etykiety przy krawędziach ekranu zachowują się poprawnie

## 6. Najczęstsze problemy i szybka diagnoza

### `adb devices` nie widzi telefonu

**Szybka diagnoza**
- debugowanie USB jest wyłączone
- telefon nie zaakceptował autoryzacji ADB
- problem z kablem lub portem USB

**Co zrobić**
- włącz debugowanie USB
- zaakceptuj komunikat na telefonie
- odłącz i podłącz telefon ponownie
- uruchom jeszcze raz:

```powershell
adb devices
```

### Metro działa, ale aplikacja się nie łączy

**Szybka diagnoza**
- otwarto Expo Go zamiast custom dev client
- telefon i komputer nie widzą się poprawnie w sieci
- build dev client jest nieaktualny

**Co zrobić**
- otwieraj aplikację wyłącznie w custom dev client
- uruchom ponownie Metro:

```powershell
npx expo start
```

- jeśli trzeba, zainstaluj nowszy dev client lub preview build

### Kamera nie startuje

**Szybka diagnoza**
- brak zgody na aparat
- system zablokował uprawnienie
- aplikacja nie wróciła poprawnie z ekranu uprawnień

**Co zrobić**
- sprawdź uprawnienia aplikacji w Androidzie
- uruchom aplikację ponownie
- potwierdź, że widok kamery pojawia się po zgodzie

### Lokalizacja nie działa

**Szybka diagnoza**
- brak zgody na lokalizację
- GPS w telefonie jest wyłączony
- telefon korzysta z fallbacku Warszawy

**Co zrobić**
- sprawdź systemowe uprawnienia lokalizacji
- włącz lokalizację w telefonie
- obserwuj, czy znika banner fallbacku Warszawy

### Heading nie reaguje

**Szybka diagnoza**
- kompas jest źle skalibrowany
- urządzenie ma problem z sensorami
- otoczenie zakłóca kompas

**Co zrobić**
- porusz telefonem w kształcie cyfry 8
- odejdź od metalu i elektroniki
- sprawdź banner `Status sensorów`

### Etykieta konstelacji nie otwiera panelu

**Szybka diagnoza**
- touch target nie pokrywa się poprawnie z etykietą
- etykieta jest przy skraju ekranu i została ukryta

**Co zrobić**
- obróć telefon tak, aby etykieta wróciła do środkowej części ekranu
- sprawdź inne etykiety dla porównania

### Kalibracja nie zapisuje się po restarcie

**Szybka diagnoza**
- zapis do `AsyncStorage` nie został wykonany
- aplikacja nie odczytała poprawnie zapisanej kalibracji

**Co zrobić**
- zmień wartości jeszcze raz i kliknij `Zapisz`
- zamknij aplikację całkowicie
- uruchom ponownie i sprawdź ekran `Kalibracja`
- jeśli problem się powtarza, sprawdź logikę `loadCalibration()` i `saveCalibration()`

**Status dokumentu: gotowy do użycia**
```
