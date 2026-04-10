/// <reference types="jest" />

import { raDecToAltAz } from '../coordinates';
import { computeSolarSystemObjects, getMoonPhase } from '../ephemeris';
import {
  greenwichMeanSiderealTime,
  julianDate,
  localSiderealTime,
} from '../sidereal';

describe('astronomy core math', () => {
  it('calculates Julian Date for J2000.0', () => {
    const result = julianDate(new Date('2000-01-01T12:00:00Z'));

    expect(result).toBeCloseTo(2451545.0, 6);
  });

  it('calculates GMST near the J2000.0 reference value', () => {
    const result = greenwichMeanSiderealTime(2451545.0);

    expect(result).toBeCloseTo(280.4606, 3);
  });

  it('calculates LST for Warsaw at J2000.0', () => {
    const result = localSiderealTime(
      new Date('2000-01-01T12:00:00Z'),
      21.0122,
    );

    expect(result).toBeCloseTo(301.4728, 3);
  });

  it('places Polaris near the northern horizon reference for Warsaw', () => {
    const lst = localSiderealTime(new Date('2000-01-01T12:00:00Z'), 21.0122);

    const result = raDecToAltAz({
      raDeg: 37.9546,
      decDeg: 89.2636,
      lst,
      latitudeDeg: 52.2297,
    });

    expect(result.altitude).toBeGreaterThan(51);
    expect(result.altitude).toBeLessThan(53.5);
    expect(result.azimuth).toBeGreaterThanOrEqual(0);
    expect(result.azimuth).toBeLessThan(5);
  });

  it('shows Betelgeuse above the horizon from Warsaw on a winter night', () => {
    const lst = localSiderealTime(new Date('2026-01-15T20:00:00Z'), 21.0122);

    const result = raDecToAltAz({
      raDeg: 88.7929,
      decDeg: 7.4029,
      lst,
      latitudeDeg: 52.2297,
    });

    expect(result.altitude).toBeGreaterThan(30);
    expect(result.altitude).toBeLessThan(60);
    expect(result.azimuth).toBeGreaterThan(120);
    expect(result.azimuth).toBeLessThan(220);
  });

  it('returns finite RA/Dec values for Moon and supported planets', () => {
    const result = computeSolarSystemObjects(new Date('2026-04-10T21:00:00Z'));

    expect(result.map((object) => object.id)).toEqual([
      'moon',
      'venus',
      'mars',
      'jupiter',
      'saturn',
    ]);

    for (const object of result) {
      expect(Number.isFinite(object.ra)).toBe(true);
      expect(Number.isFinite(object.dec)).toBe(true);
      expect(object.ra).toBeGreaterThanOrEqual(0);
      expect(object.ra).toBeLessThan(360);
      expect(object.dec).toBeGreaterThanOrEqual(-90);
      expect(object.dec).toBeLessThanOrEqual(90);
    }
  });

  it('calculates Moon phase age and illumination in stable ranges', () => {
    const result = getMoonPhase(new Date('2026-04-10T21:00:00Z'));

    expect(result.ageDays).toBeGreaterThanOrEqual(0);
    expect(result.ageDays).toBeLessThan(29.6);
    expect(result.illumination).toBeGreaterThanOrEqual(0);
    expect(result.illumination).toBeLessThanOrEqual(1);
    expect(typeof result.waxing).toBe('boolean');
  });
});
