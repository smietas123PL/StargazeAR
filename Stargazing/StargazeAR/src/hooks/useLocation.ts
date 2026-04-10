import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { loadLastKnownLocation, saveLastKnownLocation } from '../storage/locationStorage';

import type { LocationErrorKind, UserLocation } from '../types';

type UseLocationResult = {
  location: UserLocation | null;
  errorKind: LocationErrorKind | null;
  isLoading: boolean;
  isHighAccuracyEnabled: boolean;
  isUsingCachedLocation: boolean;
  shouldPromptForOfflineFallback: boolean;
};

const INITIAL_LOCATION_TIMEOUT_MS = 5000;

function normalizeLocation(
  position:
    | Pick<Location.LocationObject, 'coords' | 'timestamp'>
    | {
        coords: {
          latitude: number;
          longitude: number;
          altitude?: number | null;
        };
        timestamp?: number;
      },
): UserLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude ?? null,
    timestamp: position.timestamp ?? Date.now(),
  };
}

function createTimeoutResult() {
  return new Promise<{ type: 'timeout' }>((resolve) => {
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      resolve({ type: 'timeout' });
    }, INITIAL_LOCATION_TIMEOUT_MS);
  });
}

export default function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorKind, setErrorKind] = useState<LocationErrorKind | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHighAccuracyEnabled, setIsHighAccuracyEnabled] =
    useState<boolean>(false);
  const [isUsingCachedLocation, setIsUsingCachedLocation] =
    useState<boolean>(false);
  const [shouldPromptForOfflineFallback, setShouldPromptForOfflineFallback] =
    useState<boolean>(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const hasResolvedLocationRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    function applyLiveLocation(nextLocation: UserLocation) {
      if (!isMounted) {
        return;
      }

      hasResolvedLocationRef.current = true;
      setLocation(nextLocation);
      setErrorKind(null);
      setIsLoading(false);
      setIsUsingCachedLocation(false);
      setShouldPromptForOfflineFallback(false);
      void saveLastKnownLocation(nextLocation).catch(() => {
        // Cache write errors should not break the live location flow.
      });
    }

    function applyCachedLocation(
      cachedLocation: UserLocation,
      nextErrorKind: LocationErrorKind,
    ) {
      if (!isMounted) {
        return;
      }

      hasResolvedLocationRef.current = true;
      setLocation(cachedLocation);
      setErrorKind(nextErrorKind);
      setIsLoading(false);
      setIsUsingCachedLocation(true);
      setShouldPromptForOfflineFallback(false);
    }

    async function loadLocation() {
      const cachedLocation = await loadLastKnownLocation();

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (status !== 'granted') {
          if (cachedLocation) {
            applyCachedLocation(cachedLocation, 'permission_denied');
          } else {
            setLocation(null);
            setErrorKind('permission_denied');
            setIsLoading(false);
          }
          return;
        }

        if (Platform.OS === 'android') {
          try {
            await Location.enableNetworkProviderAsync();

            if (isMounted) {
              setIsHighAccuracyEnabled(true);
            }
          } catch {
            if (isMounted) {
              setIsHighAccuracyEnabled(false);
            }
          }
        }

        const initialResult = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
            .then((position) => ({
              type: 'success' as const,
              position,
            }))
            .catch(() => ({
              type: 'error' as const,
            })),
          createTimeoutResult(),
        ]);

        if (!isMounted) {
          return;
        }

        if (initialResult.type === 'success') {
          applyLiveLocation(normalizeLocation(initialResult.position));
        } else if (initialResult.type === 'timeout') {
          if (cachedLocation) {
            applyCachedLocation(cachedLocation, 'timeout');
          } else {
            setLocation(null);
            setErrorKind('timeout');
            setIsLoading(false);
            setShouldPromptForOfflineFallback(true);
          }
        } else if (cachedLocation) {
          applyCachedLocation(cachedLocation, 'location_failed');
        } else {
          setLocation(null);
          setErrorKind('location_failed');
          setIsLoading(false);
        }

        try {
          const locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000,
              distanceInterval: 10,
            },
            (currentPosition: Location.LocationObject) => {
              applyLiveLocation(normalizeLocation(currentPosition));
            },
          );

          if (!isMounted) {
            locationSubscription.remove();
          } else {
            subscriptionRef.current = locationSubscription;
          }
        } catch {
          if (!isMounted || hasResolvedLocationRef.current || cachedLocation) {
            return;
          }

          setLocation(null);
          setErrorKind((previous) =>
            previous === 'timeout' ? previous : 'location_failed',
          );
          setIsLoading(false);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        if (cachedLocation) {
          applyCachedLocation(cachedLocation, 'location_failed');
          return;
        }

        setLocation(null);
        setErrorKind('location_failed');
        setIsLoading(false);
      }
    }

    void loadLocation();

    return () => {
      isMounted = false;
      subscriptionRef.current?.remove();
    };
  }, []);

  return {
    location,
    errorKind,
    isLoading,
    isHighAccuracyEnabled,
    isUsingCachedLocation,
    shouldPromptForOfflineFallback,
  };
}
