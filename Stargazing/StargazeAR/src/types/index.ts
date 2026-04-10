/**
 * Poziom kalibracji kompasu zwracany przez `expo-location`.
 *
 * To są poziomy jakości 0-3, a nie dokładność wyrażona w stopniach.
 */
export type HeadingCalibrationLevel = 0 | 1 | 2 | 3;

/**
 * Etykiety UI dla poziomu kalibracji kompasu.
 */
export const HEADING_CALIBRATION_LABELS: Record<HeadingCalibrationLevel, string> = {
  0: 'Brak kalibracji',
  1: 'Słaba',
  2: 'Średnia',
  3: 'Wysoka',
};

/**
 * Pora roku używana do opisu widoczności gwiazdozbioru.
 */
export type ConstellationSeason = 'wiosna' | 'lato' | 'jesień' | 'zima';

/**
 * Punkt na ekranie po projekcji.
 */
export interface ScreenPoint {
  /** Pozycja pozioma na ekranie w pikselach. */
  x: number;
  /** Pozycja pionowa na ekranie w pikselach. */
  y: number;
}

/**
 * Dane orientacji telefonu używane przez warstwę astronomiczną.
 */
export interface DeviceOrientation {
  /** Kierunek telefonu w stopniach 0-360. */
  heading: number;
  /**
   * Poziom kalibracji kompasu 0-3.
   *
   * Uwaga: nie jest to odchylenie w stopniach.
   */
  headingCalibrationLevel: HeadingCalibrationLevel;
  /** Czy bieżący odczyt headingu jest wystarczająco wiarygodny do pracy aplikacji. */
  isHeadingReliable: boolean;
  /** Nachylenie telefonu w pionie w stopniach od -90 do +90. */
  pitch: number;
  /** Obrót telefonu wokół osi podłużnej w stopniach od -180 do +180. */
  roll: number;
}

/**
 * Znormalizowana lokalizacja użytkownika.
 */
export interface UserLocation {
  /** Szerokość geograficzna w stopniach dziesiętnych. */
  latitude: number;
  /** Długość geograficzna w stopniach dziesiętnych. */
  longitude: number;
  /** Wysokość nad poziomem morza w metrach lub `null`, jeśli niedostępna. */
  altitude: number | null;
  /** Znacznik czasu pomiaru w milisekundach UNIX epoch. */
  timestamp: number;
}

/**
 * Rozróżnienie przyczyny problemu z lokalizacją używane przez UI.
 */
export type LocationErrorKind =
  | 'permission_denied'
  | 'location_failed'
  | 'timeout';

/**
 * Źródło aktualnie używanej lokalizacji przez warstwę AR.
 */
export type LocationSource =
  | 'live'
  | 'cache'
  | 'manual_fallback'
  | 'warsaw_fallback';

/**
 * Ręcznie wybierana lokalizacja offline.
 */
export interface OfflineLocationOption {
  /** Stabilny identyfikator opcji fallback. */
  id: string;
  /** Krótka nazwa wyświetlana w UI. */
  name: string;
  /** Współrzędne przypisane do wybranej opcji. */
  location: UserLocation;
}

/**
 * Gwiazda należąca do gwiazdozbioru.
 */
export interface Star {
  /** Stabilny identyfikator techniczny gwiazdy. */
  id: string;
  /** Nazwa własna gwiazdy lub czytelna nazwa katalogowa. */
  name: string;
  /** Right Ascension w stopniach dziesiętnych dla epoki J2000.0. */
  ra: number;
  /** Declination w stopniach dziesiętnych dla epoki J2000.0. */
  dec: number;
  /** Jasność obserwowana w magnitudo; mniejsza wartość oznacza jaśniejszą gwiazdę. */
  magnitude: number;
  /** Czy gwiazda jest jedną z głównych gwiazd rysujących kształt gwiazdozbioru. */
  isMain: boolean;
}

/**
 * Surowe dane astronomiczne gwiazdozbioru.
 */
export interface ConstellationData {
  /** Stabilny identyfikator techniczny gwiazdozbioru. */
  id: string;
  /** Polska nazwa gwiazdozbioru. */
  name: string;
  /** Angielska nazwa gwiazdozbioru. */
  nameEn: string;
  /** Trzyliterowy skrót IAU. */
  abbreviation: string;
  /** Krótki opis dla panelu informacyjnego. */
  description: string;
  /** Pory roku, w których gwiazdozbiór jest najłatwiejszy do obserwacji z Polski. */
  season: ConstellationSeason[];
  /** Główne gwiazdy używane do rysowania uproszczonego kształtu konstelacji. */
  stars: Star[];
  /** Połączenia pomiędzy indeksami gwiazd w tablicy `stars`. */
  lines: [number, number][];
  /** Przybliżone centralne RA gwiazdozbioru w stopniach dziesiętnych, epoka J2000.0. */
  centerRa: number;
  /** Przybliżone centralne Dec gwiazdozbioru w stopniach dziesiętnych, epoka J2000.0. */
  centerDec: number;
}

/**
 * Pojedyncza gwiazda po przeliczeniu na układ ekranu.
 */
export interface ProjectedStar {
  /** Surowe dane astronomiczne gwiazdy. */
  star: Star;
  /** Pozycja gwiazdy na ekranie po projekcji. */
  screen: ScreenPoint;
  /** Wysokość gwiazdy nad horyzontem w stopniach. */
  altitude: number;
  /** Azymut gwiazdy w stopniach 0-360. */
  azimuth: number;
  /** Czy gwiazda znajduje się w aktualnym obszarze widoku. */
  isVisible: boolean;
}

/**
 * Gwiazdozbiór po przeliczeniu na ekran urządzenia.
 */
export interface ProjectedConstellation {
  /** Surowe dane astronomiczne gwiazdozbioru. */
  data: ConstellationData;
  /** Pozycja środka gwiazdozbioru na ekranie. */
  centerScreen: ScreenPoint;
  /** Lista gwiazd po przeliczeniu do układu ekranu. */
  projectedStars: ProjectedStar[];
  /** Czy przynajmniej jedna gwiazda z konstelacji jest aktualnie widoczna. */
  isAnyStarVisible: boolean;
  /** Wysokość środka gwiazdozbioru nad horyzontem w stopniach. */
  altitude: number;
  /** Azymut środka gwiazdozbioru w stopniach 0-360. */
  azimuth: number;
}

/**
 * Rodzaj obiektu Układu Słonecznego renderowanego nad obrazem kamery.
 */
export type SolarSystemObjectKind = 'planet' | 'moon';

/**
 * Surowe dane uproszczonego obiektu Układu Słonecznego.
 */
export interface SolarSystemObjectData {
  /** Stabilny identyfikator techniczny obiektu. */
  id: string;
  /** Nazwa wyświetlana w UI. */
  name: string;
  /** Typ obiektu. */
  kind: SolarSystemObjectKind;
  /** Right Ascension w stopniach dziesiętnych. */
  ra: number;
  /** Declination w stopniach dziesiętnych. */
  dec: number;
  /** Kolor akcentu używany do renderu obiektu. */
  color: string;
  /** Wiek fazy Księżyca w dniach, jeśli dotyczy. */
  phaseAgeDays?: number;
  /** Oświetlenie tarczy w zakresie 0-1, jeśli dotyczy. */
  illumination?: number;
  /** Czy Księżyc przybiera (true) czy ubywa (false), jeśli dotyczy. */
  waxing?: boolean;
}

/**
 * Obiekt Układu Słonecznego po przeliczeniu na ekran urządzenia.
 */
export interface ProjectedSolarSystemObject {
  /** Surowe dane astronomiczne obiektu. */
  data: SolarSystemObjectData;
  /** Pozycja obiektu na ekranie po projekcji. */
  screen: ScreenPoint;
  /** Czy obiekt znajduje się w aktualnym obszarze widoku. */
  isVisible: boolean;
  /** Wysokość obiektu nad horyzontem w stopniach. */
  altitude: number;
  /** Azymut obiektu w stopniach 0-360. */
  azimuth: number;
}

/**
 * Ręczna kalibracja użytkownika stosowana do wyrównania overlayu.
 */
export interface CalibrationData {
  /** Wersja schematu zapisu kalibracji. */
  version?: 1;
  /** Korekta pozioma w stopniach dodawana do headingu urządzenia. */
  azimuthOffset: number;
  /** Korekta pionowa w stopniach dodawana do pitchu urządzenia. */
  pitchOffset: number;
  /** Poziome pole widzenia kamery w stopniach. */
  fovDegrees: number;
  /** Znacznik czasu zapisania kalibracji w milisekundach UNIX epoch. */
  calibratedAt: number;
}

/**
 * Nazwy ekranów głównego przepływu aplikacji.
 */
export type AppScreen = 'splash' | 'ar' | 'calibration';

/**
 * Flaga trybu nocnego.
 */
export type NightMode = boolean;
