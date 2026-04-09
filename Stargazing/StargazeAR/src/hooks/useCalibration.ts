import { useEffect, useState } from 'react';

import { DEFAULT_CALIBRATION } from '../constants/defaults';
import {
  loadCalibration,
  saveCalibration,
} from '../storage/calibrationStorage';
import type { CalibrationData } from '../types';

type UseCalibrationParams = {
  isMockEnabled: boolean;
  onSaved?: () => void;
};

export default function useCalibration({
  isMockEnabled,
  onSaved,
}: UseCalibrationParams) {
  const [calibration, setCalibration] =
    useState<CalibrationData>(DEFAULT_CALIBRATION);

  useEffect(() => {
    if (isMockEnabled) {
      return;
    }

    let isMounted = true;

    async function initializeCalibration() {
      const storedCalibration = await loadCalibration();

      if (!isMounted) {
        return;
      }

      setCalibration(storedCalibration ?? DEFAULT_CALIBRATION);
    }

    void initializeCalibration();

    return () => {
      isMounted = false;
    };
  }, [isMockEnabled]);

  function handleSaveCalibration(nextCalibration: CalibrationData) {
    setCalibration(nextCalibration);
    onSaved?.();
    void saveCalibration(nextCalibration, (error) => {
      console.error('[StargazeAR] Failed to persist calibration', error);
    });
  }

  return {
    calibration,
    handleSaveCalibration,
  };
}
