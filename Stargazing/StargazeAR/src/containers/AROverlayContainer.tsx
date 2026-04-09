import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from '../utils/reactNative';

import CenterReticle from '../components/CenterReticle';
import SkyOverlay from '../components/SkyOverlay';
import StarOverlay from '../components/StarOverlay';
import type { ProjectedConstellation } from '../types';
import { tapLight } from '../utils/haptics';

type AROverlayContainerProps = {
  isVisible: boolean;
  isInfoPanelOpen: boolean;
  selectedConstellationId: string | null;
  constellations: ProjectedConstellation[];
  onSelectConstellation: (id: string) => void;
};

export default function AROverlayContainer({
  isVisible,
  isInfoPanelOpen,
  selectedConstellationId,
  constellations,
  onSelectConstellation,
}: AROverlayContainerProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [isVisible, opacity]);

  if (!isVisible) {
    return null;
  }

  function handleConstellationPress(id: string) {
    void tapLight();
    onSelectConstellation(id);
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="box-none">
      <SkyOverlay isInfoPanelOpen={isInfoPanelOpen} />
      <CenterReticle
        dimmed={isInfoPanelOpen}
        focusActive={selectedConstellationId !== null}
      />
      <StarOverlay
        constellations={constellations}
        onConstellationPress={handleConstellationPress}
        selectedConstellationId={selectedConstellationId ?? undefined}
      />
    </Animated.View>
  );
}
