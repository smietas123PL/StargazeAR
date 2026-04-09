import type {
  CalibrationData,
  DeviceOrientation,
  UserLocation,
} from '../types';

/**
 * Ręczny przełącznik trybu mocków.
 *
 * Ustaw `true`, aby uruchomić aplikację bez prawdziwych sensorów.
 */
export const IS_MOCK_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_MOCK_SENSORS === 'true';

/**
 * Stała lokalizacja testowa dla Warszawy.
 */
export const MOCK_LOCATION: UserLocation = {
  latitude: 52.2297,
  longitude: 21.0122,
  altitude: 110,
  timestamp: 0,
};

/**
 * Stabilna kalibracja testowa używana tylko w trybie mocków.
 */
export const MOCK_CALIBRATION: CalibrationData = {
  version: 1,
  azimuthOffset: 0,
  pitchOffset: 0,
  fovDegrees: 65,
  calibratedAt: Date.now(),
};

/**
 * Generuje łagodnie zmieniającą się orientację urządzenia.
 *
 * Dzięki temu można testować overlay bez ruchu telefonu.
 */
export function getMockOrientation(
  secondsSinceStart: number,
): DeviceOrientation {
  const heading = (secondsSinceStart * 8) % 360;
  const pitch = Math.sin(secondsSinceStart / 4) * 7;
  const roll = Math.sin(secondsSinceStart / 6) * 2;

  return {
    heading,
    headingCalibrationLevel: 3,
    isHeadingReliable: true,
    pitch,
    roll,
  };
}
