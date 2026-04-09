import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { LocationErrorKind, UserLocation } from '../types';

type UseLocationResult = {
  location: UserLocation | null;
  errorKind: LocationErrorKind | null;
  isLoading: boolean;
  isHighAccuracyEnabled: boolean;
};

/**
 * Hook odpowiedzialny za pobranie bieżącej lokalizacji użytkownika.
 *
 * Nie ustawia żadnej lokalizacji fallback wewnątrz hooka.
 * Decyzję o fallbacku podejmuje warstwa wyżej.
 */
export default function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorKind, setErrorKind] = useState<LocationErrorKind | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHighAccuracyEnabled, setIsHighAccuracyEnabled] =
    useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (status !== 'granted') {
          setLocation(null);
          setErrorKind('permission_denied');
          setIsLoading(false);
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

        let locationSubscription: Location.LocationSubscription | null = null;

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (currentPosition: Location.LocationObject) => {
            if (!isMounted) {
              locationSubscription?.remove();
              return;
            }

            setLocation({
              latitude: currentPosition.coords.latitude,
              longitude: currentPosition.coords.longitude,
              altitude: currentPosition.coords.altitude ?? null,
              timestamp: currentPosition.timestamp ?? Date.now(),
            });
            setErrorKind(null);
            setIsLoading(false);
          }
        );

        if (!isMounted && locationSubscription) {
          locationSubscription.remove();
        }

      } catch {
        if (!isMounted) {
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
    };
  }, []);

  return {
    location,
    errorKind,
    isLoading,
    isHighAccuracyEnabled,
  };
}
