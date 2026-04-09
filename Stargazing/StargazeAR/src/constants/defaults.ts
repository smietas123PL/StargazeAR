import type { CalibrationData, UserLocation } from '../types';

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
 * Domyślna kalibracja overlayu przed pierwszym dostrojeniem przez użytkownika.
 */
export const DEFAULT_CALIBRATION: CalibrationData = {
  version: 1,
  azimuthOffset: 0,
  pitchOffset: 0,
  fovDegrees: DEFAULT_FOV_DEGREES,
  calibratedAt: 0,
};
