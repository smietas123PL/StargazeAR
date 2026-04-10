import type { ConstellationData } from '../types';

export type Season = 'wiosna' | 'lato' | 'jesień' | 'zima';

/**
 * Zwraca aktualną porę roku na podstawie szerokości geograficznej Polski (półkula północna).
 * Wiosna: Mar-Maj, Lato: Cze-Sie, Jesień: Wrz-Lis, Zima: Gru-Lut
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'wiosna';
  if (month >= 6 && month <= 8) return 'lato';
  if (month >= 9 && month <= 11) return 'jesień';
  return 'zima';
}

/**
 * Sprawdza czy konstelacja jest obecnie najlepiej widoczna (w swoim zalecanym sezonie).
 */
export function isConstellationInSeason(constellation: ConstellationData, date: Date = new Date()): boolean {
  if (!constellation.season || constellation.season.length === 0) {
    return true;
  }
  const currentSeason = getCurrentSeason(date);
  return constellation.season.includes(currentSeason);
}
