import { useMemo, useRef, useState } from 'react';

type UseARSessionParams = {
  currentScreen: 'ar' | 'calibration';
};

export default function useARSession({
  currentScreen,
}: UseARSessionParams) {
  const [cameraReady, setCameraReady] = useState(false);
  const wasArSessionActiveRef = useRef(false);

  const isArSessionActive = useMemo(
    () => cameraReady && currentScreen === 'ar',
    [cameraReady, currentScreen],
  );

  return {
    cameraReady,
    setCameraReady,
    isArSessionActive,
    wasArSessionActiveRef,
  };
}
