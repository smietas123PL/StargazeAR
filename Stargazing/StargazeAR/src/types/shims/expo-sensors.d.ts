export type DeviceMotionMeasurement = {
  rotation?: {
    alpha: number;
    beta: number;
    gamma: number;
  };
};

export declare const DeviceMotion: {
  isAvailableAsync(): Promise<boolean>;
  setUpdateInterval(intervalMs: number): void;
  addListener(
    listener: (measurement: DeviceMotionMeasurement) => void,
  ): { remove: () => void };
};
