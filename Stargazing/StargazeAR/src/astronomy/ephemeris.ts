import { atmosphericRefraction, normalizeAngle, raDecToAltAz, toDeg, toRad } from './coordinates';
import { julianDate, localSiderealTime } from './sidereal';
import { altAzToScreenXY } from '../utils/projection';

import type {
  CalibrationData,
  DeviceOrientation,
  ProjectedSolarSystemObject,
  SolarSystemObjectData,
  UserLocation,
} from '../types';

type OrbitalElements = {
  N: number;
  i: number;
  w: number;
  a: number;
  e: number;
  M: number;
};

type PlanetDefinition = {
  id: 'venus' | 'mars' | 'jupiter' | 'saturn';
  name: string;
  color: string;
  elements: (d: number) => OrbitalElements;
};

type MoonPhase = {
  ageDays: number;
  illumination: number;
  waxing: boolean;
};

const DAYS_SINCE_J2000_REFERENCE = 2451543.5;
const SYNODIC_MONTH_DAYS = 29.530588853;
const KNOWN_NEW_MOON_JD = 2451550.1;
const OBLIQUITY_BASE_DEG = 23.4393;
const OBLIQUITY_RATE_DEG = 3.563e-7;

const PLANETS: PlanetDefinition[] = [
  {
    id: 'venus',
    name: 'Wenus',
    color: '#F7D56B',
    elements: (d) => ({
      N: 76.6799 + 2.4659e-5 * d,
      i: 3.3946 + 2.75e-8 * d,
      w: 54.891 + 1.38374e-5 * d,
      a: 0.72333,
      e: 0.006773 - 1.302e-9 * d,
      M: 48.0052 + 1.6021302244 * d,
    }),
  },
  {
    id: 'mars',
    name: 'Mars',
    color: '#FF8166',
    elements: (d) => ({
      N: 49.5574 + 2.11081e-5 * d,
      i: 1.8497 - 1.78e-8 * d,
      w: 286.5016 + 2.92961e-5 * d,
      a: 1.523688,
      e: 0.093405 + 2.516e-9 * d,
      M: 18.6021 + 0.5240207766 * d,
    }),
  },
  {
    id: 'jupiter',
    name: 'Jowisz',
    color: '#F4D8B7',
    elements: (d) => ({
      N: 100.4542 + 2.76854e-5 * d,
      i: 1.303 - 1.557e-7 * d,
      w: 273.8777 + 1.64505e-5 * d,
      a: 5.20256,
      e: 0.048498 + 4.469e-9 * d,
      M: 19.895 + 0.0830853001 * d,
    }),
  },
  {
    id: 'saturn',
    name: 'Saturn',
    color: '#E8C27A',
    elements: (d) => ({
      N: 113.6634 + 2.3898e-5 * d,
      i: 2.4886 - 1.081e-7 * d,
      w: 339.3939 + 2.97661e-5 * d,
      a: 9.55475,
      e: 0.055546 - 9.499e-9 * d,
      M: 316.967 + 0.0334442282 * d,
    }),
  },
];

function normalizeSignedAngle(angleDeg: number) {
  let normalized = normalizeAngle(angleDeg);
  if (normalized > 180) {
    normalized -= 360;
  }
  return normalized;
}

function solveKepler(meanAnomalyDeg: number, eccentricity: number) {
  const meanAnomalyRad = toRad(meanAnomalyDeg);
  let eccentricAnomaly = meanAnomalyRad;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    eccentricAnomaly =
      eccentricAnomaly -
      (eccentricAnomaly -
        eccentricity * Math.sin(eccentricAnomaly) -
        meanAnomalyRad) /
        (1 - eccentricity * Math.cos(eccentricAnomaly));
  }

  return eccentricAnomaly;
}

function orbitalToHeliocentric(elements: OrbitalElements) {
  const eccentricAnomaly = solveKepler(elements.M, elements.e);
  const xv = elements.a * (Math.cos(eccentricAnomaly) - elements.e);
  const yv =
    elements.a *
    (Math.sqrt(1 - elements.e * elements.e) * Math.sin(eccentricAnomaly));
  const trueAnomaly = Math.atan2(yv, xv);
  const distance = Math.sqrt(xv * xv + yv * yv);
  const N = toRad(elements.N);
  const i = toRad(elements.i);
  const w = toRad(elements.w);
  const argument = trueAnomaly + w;

  return {
    x:
      distance *
      (Math.cos(N) * Math.cos(argument) -
        Math.sin(N) * Math.sin(argument) * Math.cos(i)),
    y:
      distance *
      (Math.sin(N) * Math.cos(argument) +
        Math.cos(N) * Math.sin(argument) * Math.cos(i)),
    z: distance * (Math.sin(argument) * Math.sin(i)),
    lon: normalizeAngle(toDeg(trueAnomaly + w + N)),
    distance,
  };
}

function getSunReference(d: number) {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = normalizeAngle(356.047 + 0.9856002585 * d);
  const eccentricAnomaly = solveKepler(M, e);
  const xv = Math.cos(eccentricAnomaly) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);
  const trueAnomaly = Math.atan2(yv, xv);
  const distance = Math.sqrt(xv * xv + yv * yv);
  const lon = normalizeAngle(toDeg(trueAnomaly) + w);
  const x = distance * Math.cos(toRad(lon));
  const y = distance * Math.sin(toRad(lon));

  return {
    xs: x,
    ys: y,
    sunLonDeg: lon,
    meanAnomalyDeg: M,
  };
}

function eclipticToEquatorial(params: {
  x: number;
  y: number;
  z: number;
  d: number;
}) {
  const obliquity = toRad(OBLIQUITY_BASE_DEG - OBLIQUITY_RATE_DEG * params.d);
  const xe = params.x;
  const ye = params.y * Math.cos(obliquity) - params.z * Math.sin(obliquity);
  const ze = params.y * Math.sin(obliquity) + params.z * Math.cos(obliquity);
  const ra = normalizeAngle(toDeg(Math.atan2(ye, xe)));
  const dec = toDeg(Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)));

  return { ra, dec };
}

export function getMoonPhase(date: Date): MoonPhase {
  const jd = julianDate(date);
  const ageDays =
    ((jd - KNOWN_NEW_MOON_JD) % SYNODIC_MONTH_DAYS + SYNODIC_MONTH_DAYS) %
    SYNODIC_MONTH_DAYS;
  const phaseAngle = (ageDays / SYNODIC_MONTH_DAYS) * Math.PI * 2;
  const illumination = (1 - Math.cos(phaseAngle)) / 2;

  return {
    ageDays,
    illumination,
    waxing: ageDays <= SYNODIC_MONTH_DAYS / 2,
  };
}

function getMoonEquatorial(date: Date, d: number): SolarSystemObjectData {
  const sun = getSunReference(d);
  const N = 125.1228 - 0.0529538083 * d;
  const i = 5.1454;
  const w = 318.0634 + 0.1643573223 * d;
  const a = 60.2666;
  const e = 0.0549;
  const M = normalizeAngle(115.3654 + 13.0649929509 * d);
  const eccentricAnomaly = solveKepler(M, e);
  const xv = a * (Math.cos(eccentricAnomaly) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);
  const trueAnomaly = Math.atan2(yv, xv);
  const distance = Math.sqrt(xv * xv + yv * yv);
  let lon = normalizeAngle(toDeg(trueAnomaly) + w + N);
  let lat = 0;
  const D = normalizeSignedAngle(lon - sun.sunLonDeg);
  const F = normalizeSignedAngle(lon - N);

  lon += -1.274 * Math.sin(toRad(M - 2 * D));
  lon += 0.658 * Math.sin(toRad(2 * D));
  lon += -0.186 * Math.sin(toRad(sun.meanAnomalyDeg));
  lon += -0.059 * Math.sin(toRad(2 * M - 2 * D));
  lon += -0.057 * Math.sin(toRad(M - 2 * D + sun.meanAnomalyDeg));
  lon += 0.053 * Math.sin(toRad(M + 2 * D));
  lon += 0.046 * Math.sin(toRad(2 * D - sun.meanAnomalyDeg));
  lon += 0.041 * Math.sin(toRad(M - sun.meanAnomalyDeg));
  lon += -0.035 * Math.sin(toRad(D));
  lon += -0.031 * Math.sin(toRad(M + sun.meanAnomalyDeg));
  lon += -0.015 * Math.sin(toRad(2 * F - 2 * D));
  lon += 0.011 * Math.sin(toRad(M - 4 * D));

  lat += -0.173 * Math.sin(toRad(F - 2 * D));
  lat += -0.055 * Math.sin(toRad(M - F - 2 * D));
  lat += -0.046 * Math.sin(toRad(M + F - 2 * D));
  lat += 0.033 * Math.sin(toRad(F + 2 * D));
  lat += 0.017 * Math.sin(toRad(2 * M + F));

  const x = distance * Math.cos(toRad(lon)) * Math.cos(toRad(lat));
  const y = distance * Math.sin(toRad(lon)) * Math.cos(toRad(lat));
  const z = distance * Math.sin(toRad(lat));
  const equatorial = eclipticToEquatorial({ x, y, z, d });
  const phase = getMoonPhase(date);

  return {
    id: 'moon',
    name: 'Ksiezyc',
    kind: 'moon',
    ra: equatorial.ra,
    dec: equatorial.dec,
    color: '#F2F4FF',
    phaseAgeDays: phase.ageDays,
    illumination: phase.illumination,
    waxing: phase.waxing,
  };
}

function getPlanetEquatorial(
  definition: PlanetDefinition,
  d: number,
  sun: ReturnType<typeof getSunReference>,
): SolarSystemObjectData {
  const heliocentric = orbitalToHeliocentric(definition.elements(d));
  const xg = heliocentric.x + sun.xs;
  const yg = heliocentric.y + sun.ys;
  const zg = heliocentric.z;
  const equatorial = eclipticToEquatorial({
    x: xg,
    y: yg,
    z: zg,
    d,
  });

  return {
    id: definition.id,
    name: definition.name,
    kind: 'planet',
    ra: equatorial.ra,
    dec: equatorial.dec,
    color: definition.color,
  };
}

export function computeSolarSystemObjects(
  date: Date = new Date(),
): SolarSystemObjectData[] {
  const d = julianDate(date) - DAYS_SINCE_J2000_REFERENCE;
  const sun = getSunReference(d);

  return [
    getMoonEquatorial(date, d),
    ...PLANETS.map((planet) => getPlanetEquatorial(planet, d, sun)),
  ];
}

export function computeProjectedSolarSystemObjects(params: {
  location: UserLocation;
  orientation: DeviceOrientation;
  calibration: CalibrationData;
  screenWidth: number;
  screenHeight: number;
  date?: Date;
}): ProjectedSolarSystemObject[] {
  const {
    location,
    orientation,
    calibration,
    screenWidth,
    screenHeight,
    date = new Date(),
  } = params;
  const lst = localSiderealTime(date, location.longitude);

  return computeSolarSystemObjects(date)
    .map((object) => {
      const altAz = raDecToAltAz({
        raDeg: object.ra,
        decDeg: object.dec,
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
        data: object,
        screen: { x: screen.x, y: screen.y },
        isVisible: screen.isVisible && correctedAltitude > -5,
        altitude: correctedAltitude,
        azimuth: altAz.azimuth,
      };
    })
    .sort((first, second) => second.altitude - first.altitude);
}
