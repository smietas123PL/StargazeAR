import type { JSX } from 'react';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export type PermissionResponse = {
  granted: boolean;
  status: PermissionStatus;
  canAskAgain?: boolean;
  expires?: string;
};

export type CameraViewProps = {
  facing?: 'front' | 'back';
  style?: unknown;
};

export declare function CameraView(props: CameraViewProps): JSX.Element | null;

export declare function useCameraPermissions(): [
  PermissionResponse | null,
  () => Promise<PermissionResponse>,
  () => Promise<PermissionResponse>,
];
