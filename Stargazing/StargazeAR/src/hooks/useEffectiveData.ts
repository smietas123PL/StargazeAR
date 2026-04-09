import { useEffect, useMemo, useState } from 'react';

import {
  getMockOrientation,
  MOCK_CALIBRATION,
  MOCK_LOCATION,
} from '../utils/sensorMock';
import type {
  CalibrationData,
  DeviceOrientation,
  HeadingCalibrationLevel,
  UserLocation,
} from '../types';

type UseEffectiveDataParams = {
  isMockEnabled: boolean;
  heading: number;
  headingCalibrationLevel: HeadingCalibrationLevel;
  isHeadingReliable: boolean;
  pitch: number;
  roll: number;
  location: UserLocation | null;
  calibration: CalibrationData;
};

export default function useEffectiveData({
  isMockEnabled,
  heading,
  headingCalibrationLevel,
  isHeadingReliable,
  pitch,
  roll,
  location,
  calibration,
}: UseEffectiveDataParams) {
  const [mockSecondsElapsed, setMockSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!isMockEnabled) {
      return;
    }

    const startTime = Date.now();
    const intervalId = setInterval(() => {
      setMockSecondsElapsed((Date.now() - startTime) / 1000);
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [isMockEnabled]);

  const effectiveOrientation = useMemo<DeviceOrientation>(
    () =>
      isMockEnabled
        ? getMockOrientation(mockSecondsElapsed)
        : {
            heading,
            headingCalibrationLevel,
            isHeadingReliable,
            pitch,
            roll,
          },
    [
      heading,
      headingCalibrationLevel,
      isHeadingReliable,
      isMockEnabled,
      mockSecondsElapsed,
      pitch,
      roll,
    ],
  );

  const effectiveLocation = useMemo(
    () => (isMockEnabled ? MOCK_LOCATION : location),
    [isMockEnabled, location],
  );

  const effectiveCalibration = useMemo(
    () => (isMockEnabled ? MOCK_CALIBRATION : calibration),
    [calibration, isMockEnabled],
  );

  return {
    effectiveOrientation,
    effectiveLocation,
    effectiveCalibration,
  };
}
