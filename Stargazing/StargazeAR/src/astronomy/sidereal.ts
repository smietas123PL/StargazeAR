const J2000_JULIAN_DATE = 2451545.0;

/**
 * Normalizuje kąt do zakresu 0-360 stopni.
 */
function normalize360(angleDeg: number): number {
  const normalized = angleDeg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Oblicza datę juliańską (JD) dla podanej daty UTC.
 *
 * Wystarczająca dokładność dla MVP overlayu astronomicznego.
 *
 * WERYFIKACJA:
 * julianDate(new Date('2000-01-01T12:00:00Z')) === 2451545.0
 */
export function julianDate(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();

  const fractionalDay =
    day +
    (hours + minutes / 60 + seconds / 3600 + milliseconds / 3600000) / 24;

  let y = year;
  let m = month;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    fractionalDay +
    b -
    1524.5
  );
}

/**
 * Oblicza Greenwich Mean Sidereal Time w stopniach.
 *
 * Używamy standardowego przybliżenia dla MVP:
 * GMST = 280.46061837 + 360.98564736629 * (JD - 2451545.0)
 *
 * WERYFIKACJA:
 * greenwichMeanSiderealTime(2451545.0) ≈ 280.4606
 */
export function greenwichMeanSiderealTime(jd: number): number {
  const gmst =
    280.46061837 + 360.98564736629 * (jd - J2000_JULIAN_DATE);

  return normalize360(gmst);
}

/**
 * Oblicza lokalny czas gwiazdowy (LST) dla daty i długości geograficznej.
 *
 * Długość geograficzna wschodnia jest dodatnia, zachodnia ujemna.
 */
export function localSiderealTime(date: Date, longitudeDeg: number): number {
  const jd = julianDate(date);
  const gmst = greenwichMeanSiderealTime(jd);

  return normalize360(gmst + longitudeDeg);
}

/**
 * Oblicza kąt godzinny H = LST - RA i normalizuje go do przedziału -180..180.
 *
 * Ujemny kąt oznacza obiekt przed kulminacją, dodatni po kulminacji.
 */
export function hourAngle(lst: number, raDeg: number): number {
  let angle = normalize360(lst - raDeg);

  if (angle > 180) {
    angle -= 360;
  }

  return angle;
}
