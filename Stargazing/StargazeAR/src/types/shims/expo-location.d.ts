export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export type PermissionResponse = {
  status: PermissionStatus;
  granted?: boolean;
  canAskAgain?: boolean;
  expires?: string;
};

export type LocationObject = {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
  };
  timestamp?: number;
};

export type LocationHeadingObject = {
  trueHeading: number;
  magHeading: number;
  accuracy: number;
};

export type LocationSubscription = {
  remove: () => void;
};

export declare const Accuracy: {
  Balanced: number;
};

export declare function requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
export declare function getForegroundPermissionsAsync(): Promise<PermissionResponse>;
export declare function enableNetworkProviderAsync(): Promise<void>;
export declare function getCurrentPositionAsync(options?: {
  accuracy?: number;
}): Promise<LocationObject>;
export declare function watchHeadingAsync(
  callback: (heading: LocationHeadingObject) => void,
): Promise<LocationSubscription>;
export declare function watchPositionAsync(
  options: { accuracy?: number; timeInterval?: number; distanceInterval?: number; },
  callback: (position: LocationObject) => void,
): Promise<LocationSubscription>;
