import { hourAngle } from './sidereal';

/**
 * Zamienia stopnie na radiany.
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Zamienia radiany na stopnie.
 */
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Normalizuje kąt do zakresu 0-360 stopni.
 */
function normalizeAngle(deg: number): number {
  const normalized = deg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Ogranicza wartość do bezpiecznego zakresu wejściowego funkcji trygonometrycznych.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Konwertuje współrzędne RA/Dec na wysokość i azymut.
 *
 * Azymut jest zwracany w standardzie astronomicznym aplikacji:
 * 0 = północ, 90 = wschód, 180 = południe, 270 = zachód.
 */
export function raDecToAltAz(params: {
  raDeg: number;
  decDeg: number;
  lst: number;
  latitudeDeg: number;
}): { altitude: number; azimuth: number } {
  const { raDeg, decDeg, lst, latitudeDeg } = params;

  const hDeg = hourAngle(lst, raDeg);

  const hRad = toRad(hDeg);
  const decRad = toRad(decDeg);
  const latRad = toRad(latitudeDeg);

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(hRad);

  const altitude = toDeg(Math.asin(clamp(sinAlt, -1, 1)));
  const altRad = toRad(altitude);

  const cosAz =
    (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
    (Math.cos(altRad) * Math.cos(latRad));

  const baseAzimuth = toDeg(Math.acos(clamp(cosAz, -1, 1)));
  const azimuth = Math.sin(hRad) > 0 ? 360 - baseAzimuth : baseAzimuth;

  return {
    altitude,
    azimuth: normalizeAngle(azimuth),
  };
}

/**
 * Zwraca informację, czy obiekt jest praktycznie nad horyzontem.
 *
 * -0.5° zostawia niewielki margines na refrakcję przy samym horyzoncie.
 */
export function isAboveHorizon(altitude: number): boolean {
  return altitude > -0.5;
}

/**
 * Uproszczona korekta refrakcji atmosferycznej w stopniach.
 *
 * Dla bardzo niskich wysokości wzór przestaje być sensowny,
 * dlatego poniżej -2° zwracamy 0.
 */
export function atmosphericRefraction(altitudeDeg: number): number {
  if (altitudeDeg < -2) {
    return 0;
  }

  const denominator = Math.tan(
    toRad(altitudeDeg + 10.3 / (altitudeDeg + 5.11)),
  );

  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-8) {
    return 0;
  }

  return 1.02 / denominator / 60;
}

export { normalizeAngle, toDeg, toRad };
