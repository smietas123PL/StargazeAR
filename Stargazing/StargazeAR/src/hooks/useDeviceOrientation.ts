import { useEffect, useRef, useState } from 'react';
import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';

import { LowPassFilter } from '../utils/filters';

type UseDeviceOrientationResult = {
  pitch: number;
  roll: number;
  isAvailable: boolean;
};

const DEVICE_MOTION_UPDATE_INTERVAL_MS = 50;
// Umiarkowane alpha wygładza mikrodrgania ręki bez wyraźnego laga overlayu.
const ORIENTATION_SMOOTHING_ALPHA = 0.34;

/**
 * Hook odpowiedzialny za orientację urządzenia.
 *
 * Używamy `DeviceMotion`, bo dostajemy już sensor fusion,
 * zamiast surowego i bardziej dryfującego żyroskopu.
 */
export default function useDeviceOrientation(): UseDeviceOrientationResult {
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const pitchFilterRef = useRef(new LowPassFilter(ORIENTATION_SMOOTHING_ALPHA));
  const rollFilterRef = useRef(new LowPassFilter(ORIENTATION_SMOOTHING_ALPHA));

  useEffect(() => {
    let isMounted = true;

    function handleMotion(measurement: DeviceMotionMeasurement) {
      if (!isMounted || !measurement.rotation) {
        return;
      }

      const pitchDegrees = (measurement.rotation.beta * 180) / Math.PI;
      const rollDegrees = (measurement.rotation.gamma * 180) / Math.PI;

      const smoothedPitch = pitchFilterRef.current.update(pitchDegrees);
      const smoothedRoll = rollFilterRef.current.update(rollDegrees);

      setPitch(smoothedPitch);
      setRoll(smoothedRoll);
      setIsAvailable(true);
    }

    async function subscribeToDeviceMotion() {
      try {
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;
        pitchFilterRef.current.reset();
        rollFilterRef.current.reset();

        const available = await DeviceMotion.isAvailableAsync();

        if (!isMounted || !available) {
          if (isMounted) {
            pitchFilterRef.current.reset();
            rollFilterRef.current.reset();
            setIsAvailable(false);
          }
          return;
        }

        DeviceMotion.setUpdateInterval(DEVICE_MOTION_UPDATE_INTERVAL_MS);
        subscriptionRef.current = DeviceMotion.addListener(handleMotion);
      } catch {
        if (isMounted) {
          subscriptionRef.current?.remove();
          subscriptionRef.current = null;
          pitchFilterRef.current.reset();
          rollFilterRef.current.reset();
          setIsAvailable(false);
        }
      }
    }

    void subscribeToDeviceMotion();

    return () => {
      isMounted = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      pitchFilterRef.current.reset();
      rollFilterRef.current.reset();
    };
  }, []);

  return {
    pitch,
    roll,
    isAvailable,
  };
}
