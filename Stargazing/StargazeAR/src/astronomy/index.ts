import { CONSTELLATIONS } from './constellations';
import { atmosphericRefraction, raDecToAltAz } from './coordinates';
import { localSiderealTime } from './sidereal';
import { altAzToScreenXY } from '../utils/projection';
import type {
  CalibrationData,
  DeviceOrientation,
  ProjectedConstellation,
  ProjectedStar,
  UserLocation,
} from '../types';

const LST_CACHE_TTL_MS = 10000;

let localSkyCache: {
  expireAt: number;
  latitudeDeg: number;
  longitudeDeg: number;
  lst: number;
  constellations: Map<string, {
    centerAlt: number;
    centerAz: number;
    stars: Map<string, { alt: number; az: number }>;
  }>;
} | null = null;

export function computeVisibleConstellations(params: {
  location: UserLocation;
  orientation: DeviceOrientation;
  calibration: CalibrationData;
  screenWidth: number;
  screenHeight: number;
  date?: Date;
}): ProjectedConstellation[] {
  const {
    location,
    orientation,
    calibration,
    screenWidth,
    screenHeight,
    date = new Date(),
  } = params;

  const timestamp = date.getTime();

  if (
    !localSkyCache ||
    timestamp > localSkyCache.expireAt ||
    localSkyCache.latitudeDeg !== location.latitude ||
    localSkyCache.longitudeDeg !== location.longitude
  ) {
    const lst = localSiderealTime(date, location.longitude);
    const skyMap = new Map();

    for (const constellation of CONSTELLATIONS) {
      const centerAltAz = raDecToAltAz({
        raDeg: constellation.centerRa,
        decDeg: constellation.centerDec,
        lst,
        latitudeDeg: location.latitude,
      });

      const correctedCenterAltitude =
        centerAltAz.altitude + atmosphericRefraction(centerAltAz.altitude);

      const starsMap = new Map();
      for (const star of constellation.stars) {
        const altAz = raDecToAltAz({
          raDeg: star.ra,
          decDeg: star.dec,
          lst,
          latitudeDeg: location.latitude,
        });

        const correctedAltitude =
          altAz.altitude + atmosphericRefraction(altAz.altitude);

        starsMap.set(star.id, { alt: correctedAltitude, az: altAz.azimuth });
      }

      skyMap.set(constellation.id, {
        centerAlt: correctedCenterAltitude,
        centerAz: centerAltAz.azimuth,
        stars: starsMap,
      });
    }

    localSkyCache = {
      expireAt: timestamp + LST_CACHE_TTL_MS,
      latitudeDeg: location.latitude,
      longitudeDeg: location.longitude,
      lst,
      constellations: skyMap,
    };
  }

  const cachedSky = localSkyCache.constellations;

  return CONSTELLATIONS.map((constellation) => {
    const skyData = cachedSky.get(constellation.id)!;

    const centerScreen = altAzToScreenXY({
      objectAltitude: skyData.centerAlt,
      objectAzimuth: skyData.centerAz,
      phoneHeading: orientation.heading,
      phonePitch: orientation.pitch,
      screenWidth,
      screenHeight,
      calibration,
    });

    const projectedStars: ProjectedStar[] = constellation.stars.map((star) => {
      const starSky = skyData.stars.get(star.id)!;

      const screen = altAzToScreenXY({
        objectAltitude: starSky.alt,
        objectAzimuth: starSky.az,
        phoneHeading: orientation.heading,
        phonePitch: orientation.pitch,
        screenWidth,
        screenHeight,
        calibration,
      });

      return {
        star,
        screen: { x: screen.x, y: screen.y },
        isVisible: screen.isVisible && starSky.alt > -5,
      };
    });

    const isAnyStarVisible = projectedStars.some((star) => star.isVisible);

    return {
      data: constellation,
      centerScreen: { x: centerScreen.x, y: centerScreen.y },
      projectedStars,
      isAnyStarVisible,
      altitude: skyData.centerAlt,
      azimuth: skyData.centerAz,
    };
  }).sort((a, b) => b.altitude - a.altitude);
}
