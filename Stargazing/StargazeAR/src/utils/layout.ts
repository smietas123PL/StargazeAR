export type LayoutMetrics = {
  horizontalPadding: number;
  topSafeOffset: number;
  bottomSafeOffset: number;
  hintBottomOffset: number;
  compassTopOffset: number;
  infoPanelMaxHeight: number;
  controlClusterBottom: number;
  isCompactFloatingUi: boolean;
};

const SMALL_SCREEN_HEIGHT = 700;
const LARGE_SCREEN_HEIGHT = 880;
export const SCREEN_COMPACT_MAX = 800;
export const SCREEN_MEDIUM_MAX = 840;
const MIN_BOTTOM_SAFE_OFFSET = 12;
const ESTIMATED_HINT_HEIGHT = 84;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getLayoutMetrics(params: {
  screenWidth: number;
  screenHeight: number;
  safeTop: number;
  safeBottom: number;
  isInfoPanelOpen: boolean;
}): LayoutMetrics {
  const {
    screenWidth,
    screenHeight,
    safeTop,
    safeBottom,
    isInfoPanelOpen,
  } = params;
  const isSmallScreen = screenHeight < SMALL_SCREEN_HEIGHT;
  const isLargeScreen = screenHeight >= LARGE_SCREEN_HEIGHT;
  const isCompactScreen = screenHeight <= SCREEN_COMPACT_MAX;
  const isMediumScreen = screenHeight <= SCREEN_MEDIUM_MAX;

  const horizontalPadding = isCompactScreen ? 16 : isLargeScreen ? 24 : 20;
  const topSafeOffset = safeTop + (isCompactScreen ? 12 : isLargeScreen ? 16 : 14);
  const bottomSafeOffset = Math.max(safeBottom, MIN_BOTTOM_SAFE_OFFSET);

  const lowerSafeZoneRatio = isInfoPanelOpen
    ? isMediumScreen
      ? 0.46
      : 0.44
    : isMediumScreen
      ? 0.25
      : 0.23;
  const lowerSafeZoneAwareOffset =
    screenHeight * lowerSafeZoneRatio - ESTIMATED_HINT_HEIGHT;
  const adaptiveHintOffset = isInfoPanelOpen
    ? screenHeight * 0.21
    : screenHeight * 0.14;
  const hintOffsetMin = isInfoPanelOpen
    ? isCompactScreen
      ? 148
      : isLargeScreen
        ? 180
        : 164
    : isCompactScreen
      ? 92
      : isLargeScreen
        ? 120
        : 106;
  const hintOffsetMax = isInfoPanelOpen
    ? isCompactScreen
      ? 162
      : isLargeScreen
        ? 192
        : 176
    : isCompactScreen
      ? 104
      : isLargeScreen
        ? 128
        : 116;
  const hintBottomOffset =
    bottomSafeOffset +
    clamp(
      Math.max(adaptiveHintOffset, lowerSafeZoneAwareOffset),
      hintOffsetMin,
      hintOffsetMax,
    );
  const infoPanelMaxHeight = Math.min(
    Math.max(screenHeight * 0.46, 240),
    Math.max(240, screenHeight - safeTop - 176),
  );
  const floatingControlsOpenBottom = Math.min(
    infoPanelMaxHeight + bottomSafeOffset + 16,
    Math.max(bottomSafeOffset + 132, screenHeight - safeTop - 180),
  );
  const isCompactFloatingUi = isInfoPanelOpen || screenWidth < 360;
  const controlClusterBottom = isInfoPanelOpen
    ? floatingControlsOpenBottom
    : bottomSafeOffset + 92;

  return {
    horizontalPadding,
    topSafeOffset,
    bottomSafeOffset,
    hintBottomOffset,
    compassTopOffset: topSafeOffset,
    infoPanelMaxHeight,
    controlClusterBottom,
    isCompactFloatingUi,
  };
}
