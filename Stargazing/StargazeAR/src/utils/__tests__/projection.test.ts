import { getFovForAspectRatio, altAzToScreenXY } from '../projection';
import type { CalibrationData } from '../../types';

describe('projection.ts utils', () => {
  const defaultCalibration: CalibrationData = {
    version: 1,
    azimuthOffset: 0,
    pitchOffset: 0,
    fovDegrees: 60,
    calibratedAt: Date.now(),
  };

  describe('getFovForAspectRatio', () => {
    it('returns original fov if dimensions are invalid', () => {
      expect(getFovForAspectRatio(60, 0, 800)).toBe(60);
      expect(getFovForAspectRatio(60, -10, -10)).toBe(60);
    });

    it('calculates vertical FOV for a square screen', () => {
      // For square screen, aspect ratio is 1, tan(h/2) * 1 = tan(v/2) => vertical FOV = horizontal FOV
      expect(getFovForAspectRatio(60, 500, 500)).toBeCloseTo(60, 5);
    });

    it('calculates vertical FOV for a tall screen (portrait)', () => {
      const vFov = getFovForAspectRatio(60, 400, 800);
      // With width=400, height=800, aspectRatio = 2
      // tan(30deg) * 2 = 1.154 => atan(1.154) = 49.1 deg => * 2 = ~98.2 deg
      expect(vFov).toBeCloseTo(98.213, 2);
    });
  });

  describe('altAzToScreenXY', () => {
    it('projects object perfectly in the center of the screen', () => {
      const result = altAzToScreenXY({
        objectAltitude: 45,
        objectAzimuth: 180,
        phoneHeading: 180,
        phonePitch: 45,
        screenWidth: 400,
        screenHeight: 800,
        calibration: defaultCalibration,
      });

      expect(result.x).toBe(200); // 400 / 2
      expect(result.y).toBe(400); // 800 / 2
      expect(result.isVisible).toBe(true);
    });

    it('projects object near the boundary but still visible', () => {
      const result = altAzToScreenXY({
        objectAltitude: 45,
        objectAzimuth: 205, // 25 degrees away, fov is 60 (±30). So it's inside.
        phoneHeading: 180,
        phonePitch: 45,
        screenWidth: 400, // 400 / 60 = 6.66 px/deg -> 200 + 25 * 6.66 = 366.6px
        screenHeight: 800,
        calibration: defaultCalibration,
      });

      expect(result.x).toBeGreaterThan(300);
      expect(result.x).toBeLessThan(400); 
      expect(result.isVisible).toBe(true);
    });

    it('object is out of bounds backwards (behind the player)', () => {
      const result = altAzToScreenXY({
        objectAltitude: 45,
        objectAzimuth: 0, // 180 degrees away
        phoneHeading: 180,
        phonePitch: 45,
        screenWidth: 400,
        screenHeight: 800,
        calibration: defaultCalibration,
      });

      expect(result.isVisible).toBe(false);
    });

    it('applies calibration offsets correctly', () => {
      const result = altAzToScreenXY({
        objectAltitude: 45,
        objectAzimuth: 190,
        phoneHeading: 180,
        phonePitch: 45,
        screenWidth: 400,
        screenHeight: 800,
        calibration: {
          ...defaultCalibration,
          azimuthOffset: 10, // effectively makes phone heading = 190
        },
      });

      expect(result.x).toBe(200); // Because object is at 190, phone effectively at 190
      expect(result.isVisible).toBe(true);
    });
    
    it('handles negative altitude limits appropriately', () => {
      // Testing object very low in pitch
      const result = altAzToScreenXY({
        objectAltitude: -80,
        objectAzimuth: 180,
        phoneHeading: 180,
        phonePitch: -20,
        screenWidth: 400,
        screenHeight: 800,
        calibration: defaultCalibration,
      });

      // -80 is 60 below -20. vertical Fov is ~98 => +/- 49.
      // margin extends it slightly, but delta(60) is greater than 49+10 = 59.
      expect(result.isVisible).toBe(false);
    });
  });
});
