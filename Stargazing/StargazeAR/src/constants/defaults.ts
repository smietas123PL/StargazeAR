import type {
  CalibrationData,
  OfflineLocationOption,
  UserLocation,
} from '../types';

/**
 * Domyślne poziome FOV dla pierwszego uruchomienia.
 */
export const DEFAULT_FOV_DEGREES = 65;

/**
 * Lokalizacja zapasowa używana, gdy GPS jest niedostępny.
 */
export const WARSAW_FALLBACK_LOCATION: UserLocation = {
  latitude: 52.2297,
  longitude: 21.0122,
  altitude: 110,
  timestamp: 0,
};

/**
 * Gotowe lokalizacje offline używane jako awaryjny wybór po timeoutcie GPS.
 */
export const OFFLINE_LOCATION_OPTIONS: OfflineLocationOption[] = [
  {
    id: 'krakow',
    name: 'Kraków',
    location: {
      latitude: 50.0647,
      longitude: 19.945,
      altitude: 219,
      timestamp: 0,
    },
  },
  {
    id: 'warszawa',
    name: 'Warszawa',
    location: {
      ...WARSAW_FALLBACK_LOCATION,
    },
  },
  {
    id: 'gdansk',
    name: 'Gdańsk',
    location: {
      latitude: 54.352,
      longitude: 18.6466,
      altitude: 21,
      timestamp: 0,
    },
  },
];

/**
 * Domyślna kalibracja overlayu przed pierwszym dostrojeniem przez użytkownika.
 */
export const DEFAULT_CALIBRATION: CalibrationData = {
  version: 1,
  azimuthOffset: 0,
  pitchOffset: 0,
  fovDegrees: DEFAULT_FOV_DEGREES,
  calibratedAt: 0,
};
