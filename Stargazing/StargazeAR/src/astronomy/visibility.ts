/**
 * Ostrzeżenie o jakości widoczności konstelacji wynikające z jej wysokości nad horyzontem.
 *
 * Progi 5° i 15° odpowiadają praktycznym warunkom obserwacji gołym okiem:
 * poniżej 5° obiekty są silnie zniekształcane przez refrakcję atmosferyczną,
 * łatwo giną w turbulencjach przy horyzoncie i bywają zasłaniane przez teren
 * lub zabudowę. Zakres od 5° do 15° nadal oznacza trudniejszą obserwację,
 * bo patrzymy przez grubszą warstwę atmosfery. Powyżej 15° wpływ tych zjawisk
 * zwykle jest już wyraźnie mniejszy.
 */
export type VisibilityWarning = 'very_low' | 'low' | null;

export function getVisibilityWarning(altitudeDeg: number): VisibilityWarning {
  if (altitudeDeg < 5) {
    return 'very_low';
  }

  if (altitudeDeg < 15) {
    return 'low';
  }

  return null;
}
