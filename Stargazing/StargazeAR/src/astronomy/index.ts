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

/**
 * Główny orkiestrator obliczeń astronomicznych dla aktualnego widoku.
 */
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

  const lst = localSiderealTime(date, location.longitude);

  return CONSTELLATIONS.map((constellation) => {
    const centerAltAz = raDecToAltAz({
      raDeg: constellation.centerRa,
      decDeg: constellation.centerDec,
      lst,
      latitudeDeg: location.latitude,
    });

    const correctedCenterAltitude =
      centerAltAz.altitude + atmosphericRefraction(centerAltAz.altitude);

    const centerScreen = altAzToScreenXY({
      objectAltitude: correctedCenterAltitude,
      objectAzimuth: centerAltAz.azimuth,
      phoneHeading: orientation.heading,
      phonePitch: orientation.pitch,
      screenWidth,
      screenHeight,
      calibration,
    });

    const projectedStars: ProjectedStar[] = constellation.stars.map((star) => {
      const altAz = raDecToAltAz({
        raDeg: star.ra,
        decDeg: star.dec,
        lst,
        latitudeDeg: location.latitude,
      });

      const correctedAltitude =
        altAz.altitude + atmosphericRefraction(altAz.altitude);

      const screen = altAzToScreenXY({
        objectAltitude: correctedAltitude,
        objectAzimuth: altAz.azimuth,
        phoneHeading: orientation.heading,
        phonePitch: orientation.pitch,
        screenWidth,
        screenHeight,
        calibration,
      });

      return {
        star,
        screen: { x: screen.x, y: screen.y },
        isVisible: screen.isVisible && correctedAltitude > -5,
      };
    });

    const isAnyStarVisible = projectedStars.some((star) => star.isVisible);

    return {
      data: constellation,
      centerScreen: { x: centerScreen.x, y: centerScreen.y },
      projectedStars,
      isAnyStarVisible,
      altitude: correctedCenterAltitude,
      azimuth: centerAltAz.azimuth,
    };
  }).sort((a, b) => b.altitude - a.altitude);
}
