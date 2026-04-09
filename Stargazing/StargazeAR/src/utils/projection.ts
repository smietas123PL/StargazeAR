import type { CalibrationData } from '../types';

/**
 * Normalizuje kąt poziomy do zakresu -180..180.
 */
function normalizeSigned180(angleDeg: number): number {
  let normalized = ((angleDeg + 180) % 360 + 360) % 360 - 180;

  if (normalized === -180) {
    normalized = 180;
  }

  return normalized;
}

/**
 * Oblicza pionowe FOV na podstawie poziomego FOV i proporcji ekranu.
 */
export function getFovForAspectRatio(
  fovHorizontal: number,
  width: number,
  height: number,
): number {
  if (width <= 0 || height <= 0) {
    return fovHorizontal;
  }

  const horizontalRad = (fovHorizontal * Math.PI) / 180;
  const verticalRad =
    2 * Math.atan(Math.tan(horizontalRad / 2) * (height / width));

  return (verticalRad * 180) / Math.PI;
}

/**
 * Przelicza obiekt w układzie Alt/Az na współrzędne ekranu.
 *
 * Dla MVP używamy praktycznej projekcji liniowej wewnątrz aktualnego FOV,
 * z lekkim marginesem poza ekranem, aby obiekty mogły płynnie "wchodzić".
 */
export function altAzToScreenXY(params: {
  objectAltitude: number;
  objectAzimuth: number;
  phoneHeading: number;
  phonePitch: number;
  screenWidth: number;
  screenHeight: number;
  calibration: CalibrationData;
}): { x: number; y: number; isVisible: boolean } {
  const {
    objectAltitude,
    objectAzimuth,
    phoneHeading,
    phonePitch,
    screenWidth,
    screenHeight,
    calibration,
  } = params;

  const safeWidth = Math.max(screenWidth, 1);
  const safeHeight = Math.max(screenHeight, 1);

  const effectiveHeading = phoneHeading + calibration.azimuthOffset;
  const effectivePitch = phonePitch + calibration.pitchOffset;

  const deltaAz = normalizeSigned180(objectAzimuth - effectiveHeading);
  const deltaAlt = objectAltitude - effectivePitch;

  const horizontalFov = calibration.fovDegrees;
  const verticalFov = getFovForAspectRatio(horizontalFov, safeWidth, safeHeight);

  const pixelsPerDegreeH = safeWidth / horizontalFov;
  const pixelsPerDegreeV = safeHeight / verticalFov;

  const x = safeWidth / 2 + deltaAz * pixelsPerDegreeH;
  const y = safeHeight / 2 - deltaAlt * pixelsPerDegreeV;

  const margin = 64;
  const horizontalSoftLimit = horizontalFov / 2 + 10;
  const verticalSoftLimit = verticalFov / 2 + 10;

  const isVisible =
    x >= -margin &&
    x <= safeWidth + margin &&
    y >= -margin &&
    y <= safeHeight + margin &&
    Math.abs(deltaAz) <= horizontalSoftLimit &&
    Math.abs(deltaAlt) <= verticalSoftLimit;

  return { x, y, isVisible };
}

/**
 * Zamienia magnitudo gwiazdy na promień punktu w pikselach.
 *
 * Jaśniejsze gwiazdy dostają większy promień.
 */
export function calculateStarRadius(magnitude: number): number {
  if (magnitude <= 1) {
    return 8;
  }

  if (magnitude <= 2) {
    return 6;
  }

  if (magnitude <= 3) {
    return 4;
  }

  if (magnitude <= 4) {
    return 3;
  }

  if (magnitude <= 5) {
    return 2;
  }

  return 1;
}
