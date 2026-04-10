import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from '../utils/reactNative';

import CenterReticle from '../components/CenterReticle';
import EdgePointer from '../components/EdgePointer';
import SkyOverlay from '../components/SkyOverlay';
import StarOverlay from '../components/StarOverlay';
import type {
  ProjectedConstellation,
  ProjectedSolarSystemObject,
} from '../types';
import { tapLight } from '../utils/haptics';

type AROverlayContainerProps = {
  isVisible: boolean;
  isInfoPanelOpen: boolean;
  guidedTarget: ProjectedConstellation | null;
  focusedConstellationId: string | null;
  selectedConstellationId: string | null;
  constellations: ProjectedConstellation[];
  solarSystemObjects: ProjectedSolarSystemObject[];
  onSelectConstellation: (id: string) => void;
};

export default function AROverlayContainer({
  isVisible,
  isInfoPanelOpen,
  guidedTarget,
  focusedConstellationId,
  selectedConstellationId,
  constellations,
  solarSystemObjects,
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
    onSelectConstellation(id);
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="box-none">
      <SkyOverlay isInfoPanelOpen={isInfoPanelOpen} />
      <CenterReticle
        dimmed={isInfoPanelOpen}
        focusActive={focusedConstellationId !== null}
      />
      <EdgePointer target={guidedTarget} />
      <StarOverlay
        constellations={constellations}
        solarSystemObjects={solarSystemObjects}
        onConstellationPress={handleConstellationPress}
        selectedConstellationId={focusedConstellationId ?? undefined}
      />
    </Animated.View>
  );
}
