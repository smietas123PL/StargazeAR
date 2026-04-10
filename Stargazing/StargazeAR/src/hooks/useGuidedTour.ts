import { useMemo } from 'react';

import { isConstellationInSeason } from '../astronomy/seasons';

import type { ProjectedConstellation } from '../types';

export type GuidedTourItem = {
  constellation: ProjectedConstellation;
  id: string;
  title: string;
  subtitle: string;
  score: number;
  isInSeason: boolean;
  isMainStarVisible: boolean;
  hasComfortableAltitude: boolean;
};

function hasVisibleMainStar(constellation: ProjectedConstellation) {
  return constellation.projectedStars.some(
    (projectedStar) => projectedStar.star.isMain && projectedStar.isVisible,
  );
}

function buildScore(
  constellation: ProjectedConstellation,
  isMainStarVisible: boolean,
  hasComfortableAltitude: boolean,
) {
  return (
    (hasComfortableAltitude ? 1000 : 0) +
    (isMainStarVisible ? 100 : 0) +
    constellation.altitude
  );
}

export default function useGuidedTour(
  constellations: ProjectedConstellation[],
): GuidedTourItem[] {
  return useMemo(() => {
    const inSeasonConstellations = constellations.filter((constellation) =>
      isConstellationInSeason(constellation.data),
    );
    const source = inSeasonConstellations.length > 0
      ? inSeasonConstellations
      : constellations;

    return source
      .map((constellation) => {
        const isMainStarVisible = hasVisibleMainStar(constellation);
        const hasComfortableAltitude = constellation.altitude > 20;
        const isInSeason = isConstellationInSeason(constellation.data);
        const score = buildScore(
          constellation,
          isMainStarVisible,
          hasComfortableAltitude,
        );

        let subtitle = 'Nisko nad horyzontem';
        if (hasComfortableAltitude && isMainStarVisible) {
          subtitle = 'Dobry cel na teraz';
        } else if (hasComfortableAltitude) {
          subtitle = 'Wysoko nad horyzontem';
        } else if (isMainStarVisible) {
          subtitle = 'Widoczne glowne gwiazdy';
        }

        return {
          constellation,
          id: constellation.data.id,
          title: constellation.data.name,
          subtitle,
          score,
          isInSeason,
          isMainStarVisible,
          hasComfortableAltitude,
        };
      })
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }

        return first.title.localeCompare(second.title, 'pl-PL');
      })
      .slice(0, 3);
  }, [constellations]);
}
