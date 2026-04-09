import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import { CircularLowPassFilter } from '../utils/filters';
import type { HeadingCalibrationLevel } from '../types';

type UseHeadingResult = {
  heading: number;
  headingCalibrationLevel: HeadingCalibrationLevel;
  isHeadingReliable: boolean;
};

type RemovableSubscription = {
  remove: () => void;
};

// Wyższe alpha utrzymuje szybką reakcję kompasu, a nadal tłumi drobny jitter.
const HEADING_SMOOTHING_ALPHA = 0.42;

/**
 * Hook odpowiedzialny za heading kompasu.
 *
 * Krytyczna zasada:
 * `LocationHeadingObject.accuracy` oznacza poziom kalibracji 0-3,
 * a nie dokładność podaną w stopniach.
 */
export default function useHeading(): UseHeadingResult {
  const [heading, setHeading] = useState<number>(0);
  const [headingCalibrationLevel, setHeadingCalibrationLevel] =
    useState<HeadingCalibrationLevel>(0);
  const [isHeadingReliable, setIsHeadingReliable] = useState<boolean>(false);

  const headingSubscriptionRef = useRef<RemovableSubscription | null>(null);
  const headingFilterRef = useRef(
    new CircularLowPassFilter(HEADING_SMOOTHING_ALPHA),
  );

  useEffect(() => {
    let isMounted = true;

    async function subscribeToHeading() {
      try {
        headingSubscriptionRef.current?.remove();
        headingSubscriptionRef.current = null;
        headingFilterRef.current.reset();

        const permission = await Location.getForegroundPermissionsAsync();
        const status =
          permission.status === 'granted'
            ? permission.status
            : (await Location.requestForegroundPermissionsAsync()).status;

        if (!isMounted || status !== 'granted') {
          if (isMounted) {
            headingFilterRef.current.reset();
            setHeadingCalibrationLevel(0);
            setIsHeadingReliable(false);
          }
          return;
        }

        const subscription = await Location.watchHeadingAsync((headingObject) => {
          if (!isMounted) {
            return;
          }

          const rawHeading =
            headingObject.trueHeading >= 0
              ? headingObject.trueHeading
              : headingObject.magHeading;

          const normalizedHeading = ((rawHeading % 360) + 360) % 360;
          const smoothedHeading =
            headingFilterRef.current.update(normalizedHeading);

          const calibrationLevel = Math.max(
            0,
            Math.min(3, Math.floor(headingObject.accuracy)),
          ) as HeadingCalibrationLevel;

          setHeading(smoothedHeading);
          setHeadingCalibrationLevel(calibrationLevel);
          setIsHeadingReliable(calibrationLevel >= 2);
        });

        headingSubscriptionRef.current = subscription;
      } catch {
        if (!isMounted) {
          return;
        }

        headingSubscriptionRef.current?.remove();
        headingSubscriptionRef.current = null;
        headingFilterRef.current.reset();
        setHeadingCalibrationLevel(0);
        setIsHeadingReliable(false);
      }
    }

    void subscribeToHeading();

    return () => {
      isMounted = false;
      headingSubscriptionRef.current?.remove();
      headingSubscriptionRef.current = null;
      headingFilterRef.current.reset();
    };
  }, []);

  return {
    heading,
    headingCalibrationLevel,
    isHeadingReliable,
  };
}
