/**
 * Prosty filtr dolnoprzepustowy dla zwykłych wartości liczbowych.
 *
 * `alpha`:
 * - bliżej 0 = mocniejsze wygładzanie
 * - bliżej 1 = szybsza reakcja, mniej wygładzenia
 */
export class LowPassFilter {
  private value = 0;
  private initialized = false;

  constructor(private readonly alpha: number) {}

  update(newValue: number): number {
    if (!this.initialized) {
      this.value = newValue;
      this.initialized = true;
      return this.value;
    }

    this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    return this.value;
  }

  reset(): void {
    this.value = 0;
    this.initialized = false;
  }
}

/**
 * Filtr dolnoprzepustowy dla kątów kołowych 0-360.
 *
 * Dzięki uśrednianiu sinusa i cosinusa poprawnie obsługuje przejście
 * przez granicę 359° -> 0° bez skoku do okolic 180°.
 */
export class CircularLowPassFilter {
  private sinValue = 0;
  private cosValue = 0;
  private initialized = false;

  constructor(private readonly alpha: number) {}

  update(newAngleDeg: number): number {
    const normalized = ((newAngleDeg % 360) + 360) % 360;
    const radians = (normalized * Math.PI) / 180;
    const nextSin = Math.sin(radians);
    const nextCos = Math.cos(radians);

    if (!this.initialized) {
      this.sinValue = nextSin;
      this.cosValue = nextCos;
      this.initialized = true;
    } else {
      this.sinValue =
        this.alpha * nextSin + (1 - this.alpha) * this.sinValue;
      this.cosValue =
        this.alpha * nextCos + (1 - this.alpha) * this.cosValue;
    }

    let result = (Math.atan2(this.sinValue, this.cosValue) * 180) / Math.PI;

    if (result < 0) {
      result += 360;
    }

    return result;
  }

  reset(): void {
    this.sinValue = 0;
    this.cosValue = 0;
    this.initialized = false;
  }
}

/**
 * Średnia ruchoma na przekazanym buforze.
 *
 * Funkcja mutuje przekazaną tablicę, żeby można jej było używać
 * bez dodatkowych alokacji przy częstych odczytach sensorów.
 */
export function movingAverage(
  buffer: number[],
  newValue: number,
  windowSize: number,
): number {
  buffer.push(newValue);

  while (buffer.length > windowSize) {
    buffer.shift();
  }

  if (buffer.length === 0) {
    return newValue;
  }

  const sum = buffer.reduce((accumulator, value) => accumulator + value, 0);
  return sum / buffer.length;
}
