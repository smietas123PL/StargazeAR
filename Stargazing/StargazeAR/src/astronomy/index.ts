import { CONSTELLATIONS } from './catalog';
import { atmosphericRefraction, raDecToAltAz } from './coordinates';
export * from './ephemeris';
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

export class SkyCache {
  private expireAt: number = 0;
  private latitudeDeg: number = 0;
  private longitudeDeg: number = 0;
  private constellations: Map<string, {
    centerAlt: number;
    centerAz: number;
    stars: Map<string, { alt: number; az: number }>;
  }> | null = null;

  public getCachedSky(location: UserLocation, timestamp: number, date: Date) {
    if (
      !this.constellations ||
      timestamp > this.expireAt ||
      this.latitudeDeg !== location.latitude ||
      this.longitudeDeg !== location.longitude
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

      this.expireAt = timestamp + LST_CACHE_TTL_MS;
      this.latitudeDeg = location.latitude;
      this.longitudeDeg = location.longitude;
      this.constellations = skyMap;
    }

    return this.constellations;
  }

  public clear() {
    this.constellations = null;
    this.expireAt = 0;
  }
}

export function computeVisibleConstellations(params: {
  location: UserLocation;
  orientation: DeviceOrientation;
  calibration: CalibrationData;
  screenWidth: number;
  screenHeight: number;
  skyCache: SkyCache;
  date?: Date;
}): ProjectedConstellation[] {
  const {
    location,
    orientation,
    calibration,
    screenWidth,
    screenHeight,
    skyCache,
    date = new Date(),
  } = params;

  const timestamp = date.getTime();
  const cachedSky = skyCache.getCachedSky(location, timestamp, date);

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
        altitude: starSky.alt,
        azimuth: starSky.az,
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
