import { useEffect, useRef } from 'react';

import { audioManager } from '../audio/AudioManager';

import type { ProjectedConstellation } from '../types';

function getPlaybackRate(target: ProjectedConstellation) {
  const normalizedAltitude = Math.min(1, Math.max(0, target.altitude / 90));
  return 0.92 + normalizedAltitude * 0.24;
}

export default function useReticleChime(
  target: ProjectedConstellation | null,
) {
  const previousTargetIdRef = useRef<string | null>(null);

  useEffect(() => {
    void audioManager.ensureLoaded();

    return () => {
      void audioManager.unload();
    };
  }, []);

  useEffect(() => {
    if (!target) {
      previousTargetIdRef.current = null;
      return;
    }

    if (previousTargetIdRef.current === target.data.id) {
      return;
    }

    previousTargetIdRef.current = target.data.id;
    void audioManager.playTargetChime(getPlaybackRate(target));
  }, [target]);
}
