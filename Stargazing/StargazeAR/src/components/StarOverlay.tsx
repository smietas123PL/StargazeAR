import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from '../utils/reactNative';
import Svg, {
  Circle,
  G,
  Line,
  Rect as SvgRect,
  Text as SvgText,
} from 'react-native-svg';

import MoonSvg from './MoonSvg';
import { calculateStarRadius } from '../utils/projection';
import { ZIndex } from '../constants/zIndex';
import { useTheme } from '../context/ThemeContext';
import { tapLight } from '../utils/haptics';
import type {
  ProjectedConstellation,
  ProjectedSolarSystemObject,
} from '../types';

type StarOverlayProps = {
  constellations: ProjectedConstellation[];
  solarSystemObjects?: ProjectedSolarSystemObject[];
  onConstellationPress: (id: string) => void;
  selectedConstellationId?: string;
  debugMode?: boolean;
};

type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type ScreenPosition = {
  x: number;
  y: number;
};

type RenderableLabel = {
  constellation: ProjectedConstellation;
  left: number;
  top: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
  debugLabelY: number | null;
  rect: Rect;
};

type CandidateRenderableLabel = RenderableLabel & {
  avoidOverlapPenalty: number;
  visibleStarCount: number;
};

const LABEL_WIDTH = 124;
const LABEL_HEIGHT = 30;
const DEBUG_LABEL_HEIGHT = 42;
const SCREEN_SIDE_PADDING = 14;
const SCREEN_TOP_PADDING = 28;
const SCREEN_BOTTOM_PADDING = 18;
const LABEL_ANCHOR_GAP = 10;
const LABEL_SIDE_OFFSET = 18;
const CENTER_HOT_ZONE_WIDTH = 156;
const CENTER_HOT_ZONE_HEIGHT = 112;
const HUD_AVOID_ZONE_WIDTH = 148;
const HUD_AVOID_ZONE_HEIGHT = 176;
const LOWER_COMPOSITION_ZONE_WIDTH = 212;
const LOWER_COMPOSITION_ZONE_HEIGHT = 124;
const STAR_POSITION_INTERPOLATION = 0.74;
const LABEL_POSITION_INTERPOLATION = 0.76;
const LABEL_TEXT_OFFSET_Y = 16;
const DEBUG_LABEL_OFFSET_Y = 31;
const SELECTED_LINE_OPACITY = 1;
const UNSELECTED_LINE_OPACITY = 0.2;
const UNSELECTED_STAR_OPACITY = 0.25;
const UNSELECTED_LABEL_OPACITY = 0.3;
const SELECTED_LINE_WIDTH = 1.6;
const DEFAULT_LINE_WIDTH = 1;
const SELECTED_STAR_SCALE = 1.15;
const SELECTED_MAIN_GLOW_RADIUS = 2.8;
const DEFAULT_MAIN_GLOW_RADIUS = 2.2;
const SELECTED_MAIN_GLOW_OPACITY = 0.95;
const UNSELECTED_MAIN_GLOW_OPACITY = 0.35;
const DEFAULT_MAIN_GLOW_OPACITY = 0.7;
const CENTER_FOCUS_ATTENUATION_RADIUS = 64;
const CENTER_FOCUS_ATTENUATION_MAX_REDUCTION = 0.08;
const LABEL_PILL_CORNER_RADIUS = 12;
const LABEL_PILL_VERTICAL_INSET = 2;
const LABEL_PILL_HEIGHT_REDUCTION = 4;
const TWINKLE_INTERVAL_MS = 90;
const TWINKLE_LOW_ALTITUDE_THRESHOLD = 30;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const normalized = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function interpolatePosition(
  previous: ScreenPosition | undefined,
  next: ScreenPosition,
  alpha: number,
) {
  if (!previous) {
    return next;
  }

  return {
    x: previous.x + (next.x - previous.x) * alpha,
    y: previous.y + (next.y - previous.y) * alpha,
  };
}

function doRectsOverlap(first: Rect, second: Rect) {
  return !(
    first.right <= second.left ||
    first.left >= second.right ||
    first.bottom <= second.top ||
    first.top >= second.bottom
  );
}

function createRect(
  left: number,
  top: number,
  width: number,
  height: number,
): Rect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
  };
}

function clampRectToBounds(rect: Rect, bounds: Rect) {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const left = clamp(rect.left, bounds.left, bounds.right - width);
  const top = clamp(rect.top, bounds.top, bounds.bottom - height);

  return createRect(left, top, width, height);
}

function getRectArea(rect: Rect) {
  return (rect.right - rect.left) * (rect.bottom - rect.top);
}

function getOverlapArea(first: Rect, second: Rect) {
  const width = Math.max(
    0,
    Math.min(first.right, second.right) - Math.max(first.left, second.left),
  );
  const height = Math.max(
    0,
    Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top),
  );

  return width * height;
}

function getRectCenter(rect: Rect) {
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
  };
}

function getDistanceScore(rect: Rect, anchor: ScreenPosition) {
  const center = getRectCenter(rect);
  return Math.abs(center.x - anchor.x) + Math.abs(center.y - anchor.y);
}

function getVisibleStarCount(constellation: ProjectedConstellation) {
  return constellation.projectedStars.filter((star) => star.isVisible).length;
}

function getLabelId(label: RenderableLabel) {
  return label.constellation.data.id;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }

  return hash;
}

function getTwinkleMultiplier(
  starId: string,
  altitude: number,
  timeSeconds: number,
) {
  if (altitude >= TWINKLE_LOW_ALTITUDE_THRESHOLD) {
    return 1;
  }

  const horizonFactor = clamp(
    (TWINKLE_LOW_ALTITUDE_THRESHOLD - altitude) /
      TWINKLE_LOW_ALTITUDE_THRESHOLD,
    0,
    1,
  );
  const phase = ((hashString(starId) % 360) * Math.PI) / 180;
  const speed = 0.4 + horizonFactor * 0.6;
  const wave =
    0.5 + 0.5 * Math.sin(timeSeconds * Math.PI * 2 * speed + phase);

  return 0.68 + wave * (0.18 + horizonFactor * 0.24);
}

/**
 * Nakladka nieba renderowana jako jedno pelnoekranowe SVG.
 *
 * Dotyk nie jest obslugiwany bezposrednio przez SVG.
 * Zamiast tego renderujemy osobne absolutne touch targety nad etykietami.
 */
export default function StarOverlay({
  constellations,
  solarSystemObjects = [],
  onConstellationPress,
  selectedConstellationId,
  debugMode = false,
}: StarOverlayProps) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const starScreenPositionsRef = useRef<Record<string, ScreenPosition>>({});
  const labelScreenPositionsRef = useRef<Record<string, ScreenPosition>>({});
  const [twinkleTimeSeconds, setTwinkleTimeSeconds] = useState(
    () => Date.now() / 1000,
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTwinkleTimeSeconds(Date.now() / 1000);
    }, TWINKLE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  function handleConstellationPress(id: string) {
    void tapLight();
    onConstellationPress(id);
  }

  const visibleConstellations = useMemo(
    () =>
      constellations.filter((constellation) => constellation.isAnyStarVisible),
    [constellations],
  );

  const renderableLabels = useMemo(() => {
    const labelHeight = debugMode ? DEBUG_LABEL_HEIGHT : LABEL_HEIGHT;
    const safeBounds = createRect(
      SCREEN_SIDE_PADDING,
      SCREEN_TOP_PADDING,
      width - SCREEN_SIDE_PADDING * 2,
      height - SCREEN_TOP_PADDING - SCREEN_BOTTOM_PADDING,
    );
    const centerHotZone = createRect(
      width / 2 - CENTER_HOT_ZONE_WIDTH / 2,
      height / 2 - CENTER_HOT_ZONE_HEIGHT / 2,
      CENTER_HOT_ZONE_WIDTH,
      CENTER_HOT_ZONE_HEIGHT,
    );
    const hudAvoidZone = createRect(
      width - SCREEN_SIDE_PADDING - HUD_AVOID_ZONE_WIDTH,
      SCREEN_TOP_PADDING,
      HUD_AVOID_ZONE_WIDTH,
      HUD_AVOID_ZONE_HEIGHT,
    );
    const lowerCompositionZone = createRect(
      width / 2 - LOWER_COMPOSITION_ZONE_WIDTH / 2,
      height - SCREEN_BOTTOM_PADDING - LOWER_COMPOSITION_ZONE_HEIGHT,
      LOWER_COMPOSITION_ZONE_WIDTH,
      LOWER_COMPOSITION_ZONE_HEIGHT,
    );
    const avoidZones = [centerHotZone, hudAvoidZone, lowerCompositionZone];

    const candidates = visibleConstellations
      .map((constellation) => {
        const { x, y } = constellation.centerScreen;
        const prefersLeft = x >= width / 2;
        const primarySideX = prefersLeft
          ? x - LABEL_WIDTH - LABEL_SIDE_OFFSET
          : x + LABEL_SIDE_OFFSET;
        const secondarySideX = prefersLeft
          ? x + LABEL_SIDE_OFFSET
          : x - LABEL_WIDTH - LABEL_SIDE_OFFSET;
        const candidateRects = [
          createRect(
            x - LABEL_WIDTH / 2,
            y - labelHeight - LABEL_ANCHOR_GAP,
            LABEL_WIDTH,
            labelHeight,
          ),
          createRect(
            primarySideX,
            y - labelHeight - LABEL_ANCHOR_GAP,
            LABEL_WIDTH,
            labelHeight,
          ),
          createRect(
            secondarySideX,
            y - labelHeight - LABEL_ANCHOR_GAP,
            LABEL_WIDTH,
            labelHeight,
          ),
          createRect(primarySideX, y + LABEL_ANCHOR_GAP, LABEL_WIDTH, labelHeight),
          createRect(x - LABEL_WIDTH / 2, y + LABEL_ANCHOR_GAP, LABEL_WIDTH, labelHeight),
          createRect(secondarySideX, y + LABEL_ANCHOR_GAP, LABEL_WIDTH, labelHeight),
        ]
          .map((rect) => clampRectToBounds(rect, safeBounds))
          .filter((rect, index, rects) => {
            const key = `${rect.left}:${rect.top}`;
            return (
              rects.findIndex(
                (candidate) => `${candidate.left}:${candidate.top}` === key,
              ) === index
            );
          });
        const bestRect = candidateRects
          .map((rect) => {
            const overlapPenalty = avoidZones.reduce((total, zone) => {
              const overlapArea = getOverlapArea(rect, zone);
              return total + overlapArea / Math.max(getRectArea(rect), 1);
            }, 0);

            return {
              rect,
              overlapPenalty,
              distanceScore: getDistanceScore(rect, constellation.centerScreen),
            };
          })
          .sort((first, second) => {
            if (first.overlapPenalty !== second.overlapPenalty) {
              return first.overlapPenalty - second.overlapPenalty;
            }

            return first.distanceScore - second.distanceScore;
          })[0];

        if (!bestRect) {
          return null;
        }

        const rect = bestRect.rect;
        const left = rect.left;
        const top = rect.top;

        return {
          constellation,
          left,
          top,
          width: LABEL_WIDTH,
          height: labelHeight,
          labelX: left + LABEL_WIDTH / 2,
          labelY: top + LABEL_TEXT_OFFSET_Y,
          debugLabelY: debugMode ? top + DEBUG_LABEL_OFFSET_Y : null,
          rect,
          avoidOverlapPenalty: bestRect.overlapPenalty,
          visibleStarCount: getVisibleStarCount(constellation),
        };
      })
      .filter(
        (label): label is CandidateRenderableLabel =>
          label !== null,
      )
      .sort((first, second) => {
        if (second.constellation.altitude !== first.constellation.altitude) {
          return second.constellation.altitude - first.constellation.altitude;
        }

        if (second.visibleStarCount !== first.visibleStarCount) {
          return second.visibleStarCount - first.visibleStarCount;
        }

        return first.constellation.data.name.localeCompare(
          second.constellation.data.name,
          'pl-PL',
        );
      });

    const accepted: RenderableLabel[] = [];

    for (const candidate of candidates) {
      const collides = accepted.some((label) =>
        doRectsOverlap(candidate.rect, label.rect),
      );
      const blocksComposition = avoidZones.some((zone) =>
        doRectsOverlap(candidate.rect, zone),
      );

      if (collides) {
        continue;
      }

      if (blocksComposition && candidate.avoidOverlapPenalty > 0.12) {
        continue;
      }

      accepted.push({
        constellation: candidate.constellation,
        left: candidate.left,
        top: candidate.top,
        width: candidate.width,
        height: candidate.height,
        labelX: candidate.labelX,
        labelY: candidate.labelY,
        debugLabelY: candidate.debugLabelY,
        rect: candidate.rect,
      });
    }

    return accepted;
  }, [debugMode, height, visibleConstellations, width]);

  const smoothedStarPositions = useMemo(() => {
    const nextPositions: Record<string, ScreenPosition> = {};

    for (const constellation of visibleConstellations) {
      for (const projectedStar of constellation.projectedStars) {
        if (!projectedStar.isVisible) {
          continue;
        }

        const id = `${constellation.data.id}:${projectedStar.star.id}`;
        const nextScreen = {
          x: projectedStar.screen.x,
          y: projectedStar.screen.y,
        };

        nextPositions[id] = interpolatePosition(
          starScreenPositionsRef.current[id],
          nextScreen,
          STAR_POSITION_INTERPOLATION,
        );
      }
    }

    starScreenPositionsRef.current = nextPositions;
    return nextPositions;
  }, [visibleConstellations]);

  const smoothedRenderableLabels = useMemo(() => {
    const nextPositions: Record<string, ScreenPosition> = {};
    const nextLabels = renderableLabels.map((label) => {
      const id = getLabelId(label);
      const nextBoxPosition = {
        x: label.left,
        y: label.top,
      };
      const smoothedBoxPosition = interpolatePosition(
        labelScreenPositionsRef.current[id],
        nextBoxPosition,
        LABEL_POSITION_INTERPOLATION,
      );

      nextPositions[id] = smoothedBoxPosition;

      return {
        ...label,
        left: smoothedBoxPosition.x,
        top: smoothedBoxPosition.y,
        labelX: smoothedBoxPosition.x + label.width / 2,
        labelY: smoothedBoxPosition.y + LABEL_TEXT_OFFSET_Y,
        debugLabelY: debugMode
          ? smoothedBoxPosition.y + DEBUG_LABEL_OFFSET_Y
          : null,
        rect: {
          left: smoothedBoxPosition.x,
          top: smoothedBoxPosition.y,
          right: smoothedBoxPosition.x + label.width,
          bottom: smoothedBoxPosition.y + label.height,
        },
      };
    });

    labelScreenPositionsRef.current = nextPositions;
    return nextLabels;
  }, [debugMode, renderableLabels]);

  const isFocusActive = selectedConstellationId != null;
  const screenCenter = {
    x: width / 2,
    y: height / 2,
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Svg
        width={width}
        height={height}
        style={styles.svg}
        pointerEvents="none"
      >
        {debugMode ? (
          <G>
            {Array.from({ length: Math.ceil(width / 60) + 1 }).map(
              (_, index) => {
                const x = index * 60;
                return (
                  <Line
                    key={`grid-v-${x}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={height}
                    stroke={theme.starDebug}
                    strokeWidth={1}
                  />
                );
              },
            )}
            {Array.from({ length: Math.ceil(height / 60) + 1 }).map(
              (_, index) => {
                const y = index * 60;
                return (
                  <Line
                    key={`grid-h-${y}`}
                    x1={0}
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke={theme.starDebug}
                    strokeWidth={1}
                  />
                );
              },
            )}
            <SvgText x={16} y={24} fill={theme.starDebugText} fontSize={12}>
              Widoczne konstelacje: {visibleConstellations.length} | Etykiety:{' '}
              {renderableLabels.length}
            </SvgText>
          </G>
        ) : null}

        {visibleConstellations.map((constellation) => {
          const isSelected =
            constellation.data.id === selectedConstellationId;
          const normalizedAltitude = clamp(constellation.altitude / 90, 0, 1);
          const depthOpacity = 0.4 + normalizedAltitude * 0.6;
          const depthScale = 0.8 + normalizedAltitude * 0.6;
          const horizonStart = 0.15;
          const horizonEnd = 0.0;
          const horizonFactor =
            normalizedAltitude <= horizonStart
              ? clamp(
                  (normalizedAltitude - horizonEnd) / (horizonStart - horizonEnd),
                  0,
                  1,
                )
              : 1;
          const finalOpacity = depthOpacity * horizonFactor;
          const lineOpacity = isFocusActive
            ? isSelected
              ? SELECTED_LINE_OPACITY
              : UNSELECTED_LINE_OPACITY
            : 1;
          const lineWidth =
            isFocusActive && isSelected ? SELECTED_LINE_WIDTH : DEFAULT_LINE_WIDTH;

          return (
            <G key={constellation.data.id}>
              {constellation.data.lines.map(([fromIndex, toIndex], lineIndex) => {
                const start = constellation.projectedStars[fromIndex];
                const end = constellation.projectedStars[toIndex];
                const startPosition =
                  smoothedStarPositions[
                    `${constellation.data.id}:${start?.star.id ?? ''}`
                  ];
                const endPosition =
                  smoothedStarPositions[
                    `${constellation.data.id}:${end?.star.id ?? ''}`
                  ];

                if (!start || !end || !start.isVisible || !end.isVisible) {
                  return null;
                }

                return (
                  <Line
                    key={`${constellation.data.id}-line-${lineIndex}`}
                    x1={startPosition?.x ?? start.screen.x}
                    y1={startPosition?.y ?? start.screen.y}
                    x2={endPosition?.x ?? end.screen.x}
                    y2={endPosition?.y ?? end.screen.y}
                    stroke={theme.starLine}
                    strokeWidth={lineWidth}
                    opacity={lineOpacity}
                  />
                );
              })}

              {constellation.projectedStars.map((projectedStar) => {
                if (!projectedStar.isVisible) {
                  return null;
                }

                const baseRadius = calculateStarRadius(projectedStar.star.magnitude);
                const radius =
                  baseRadius *
                  depthScale *
                  (isFocusActive && isSelected ? SELECTED_STAR_SCALE : 1);
                const starPosition =
                  smoothedStarPositions[
                    `${constellation.data.id}:${projectedStar.star.id}`
                  ] ?? projectedStar.screen;
                const distanceToCenter = Math.hypot(
                  starPosition.x - screenCenter.x,
                  starPosition.y - screenCenter.y,
                );
                const centerAttenuationFactor =
                  1 -
                  CENTER_FOCUS_ATTENUATION_MAX_REDUCTION *
                    (1 -
                      smoothstep(
                        0,
                        CENTER_FOCUS_ATTENUATION_RADIUS,
                        distanceToCenter,
                      ));
                const starOpacity =
                  finalOpacity *
                  (isFocusActive && !isSelected ? UNSELECTED_STAR_OPACITY : 1) *
                  centerAttenuationFactor *
                  getTwinkleMultiplier(
                    `${constellation.data.id}:${projectedStar.star.id}`,
                    projectedStar.altitude,
                    twinkleTimeSeconds,
                  );
                const glowRadiusMultiplier =
                  isFocusActive && isSelected
                    ? SELECTED_MAIN_GLOW_RADIUS
                    : DEFAULT_MAIN_GLOW_RADIUS;
                const glowOpacity = isFocusActive
                  ? isSelected
                    ? SELECTED_MAIN_GLOW_OPACITY
                    : UNSELECTED_MAIN_GLOW_OPACITY
                  : DEFAULT_MAIN_GLOW_OPACITY;

                return (
                  <G key={`${constellation.data.id}-${projectedStar.star.id}`}>
                    {projectedStar.star.isMain ? (
                      <Circle
                        cx={starPosition.x}
                        cy={starPosition.y}
                        r={radius * glowRadiusMultiplier}
                        fill="none"
                        stroke={theme.starGlow}
                        strokeWidth={radius}
                        opacity={glowOpacity}
                      />
                    ) : null}
                    <Circle
                      cx={starPosition.x}
                      cy={starPosition.y}
                      r={radius}
                      fill={theme.star}
                      opacity={starOpacity}
                    />
                  </G>
                );
              })}
            </G>
          );
        })}

        {solarSystemObjects.map((object) => {
          if (!object.isVisible) {
            return null;
          }

          const isMoon = object.data.kind === 'moon';
          const objectRadius = isMoon ? 8 : 5;
          const labelY = object.screen.y - (isMoon ? 16 : 14);

          return (
            <G key={`solar-${object.data.id}`}>
              {isMoon ? (
                <MoonSvg
                  cx={object.screen.x}
                  cy={object.screen.y}
                  radius={objectRadius}
                  illumination={object.data.illumination ?? 0}
                  waxing={object.data.waxing ?? true}
                  lightColor={theme.white}
                  darkColor={theme.overlay}
                  strokeColor={theme.starLabel}
                />
              ) : (
                <>
                  <Circle
                    cx={object.screen.x}
                    cy={object.screen.y}
                    r={objectRadius * 2.1}
                    fill="none"
                    stroke={object.data.color}
                    strokeWidth={objectRadius * 0.9}
                    opacity={0.24}
                  />
                  <Circle
                    cx={object.screen.x}
                    cy={object.screen.y}
                    r={objectRadius}
                    fill={object.data.color}
                  />
                </>
              )}

              <SvgText
                x={object.screen.x}
                y={labelY}
                fill={theme.starLabel}
                fontSize={11}
                fontWeight="700"
                textAnchor="middle"
              >
                {object.data.kind === 'moon'
                  ? `Ksiezyc ${Math.round((object.data.illumination ?? 0) * 100)}%`
                  : object.data.name}
              </SvgText>
            </G>
          );
        })}

        {smoothedRenderableLabels.map((label) => {
          const isSelected =
            label.constellation.data.id === selectedConstellationId;
          const labelOpacity =
            isFocusActive && !isSelected ? UNSELECTED_LABEL_OPACITY : 1;
          const labelPillFill = isSelected
            ? theme.starLabelSelectedFill
            : theme.starLabelFill;
          const labelPillStroke = isSelected
            ? theme.starLabelSelectedStroke
            : theme.starLabelStroke;

          return (
            <G key={`label-${getLabelId(label)}`} opacity={labelOpacity}>
              <SvgRect
                x={label.left}
                y={label.top + LABEL_PILL_VERTICAL_INSET}
                width={label.width}
                height={label.height - LABEL_PILL_HEIGHT_REDUCTION}
                rx={LABEL_PILL_CORNER_RADIUS}
                ry={LABEL_PILL_CORNER_RADIUS}
                fill={labelPillFill}
                stroke={labelPillStroke}
                strokeWidth={1}
              />
              <SvgText
                x={label.labelX}
                y={label.labelY}
                fill={theme.starLabel}
                fontSize={12}
                fontWeight="700"
                textAnchor="middle"
              >
                {label.constellation.data.name}
              </SvgText>

              {debugMode && label.debugLabelY !== null ? (
                <SvgText
                  x={label.labelX}
                  y={label.debugLabelY}
                  fill={theme.starDebugText}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {`Az ${label.constellation.azimuth.toFixed(0)}\u00B0 Alt ${label.constellation.altitude.toFixed(0)}\u00B0`}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>

      <View style={styles.touchLayer} pointerEvents="box-none">
        {smoothedRenderableLabels.map((label) => (
          <Pressable
            key={`touch-${label.constellation.data.id}`}
            accessibilityHint="Otwiera panel ze szczegolami gwiazdozbioru."
            accessibilityLabel={`Otworz szczegoly: ${label.constellation.data.name}`}
            accessibilityRole="button"
            hitSlop={8}
            style={[
              styles.touchTarget,
              {
                left: label.left,
                top: label.top,
                width: label.width,
                height: label.height,
              },
            ]}
            onPress={() => handleConstellationPress(label.constellation.data.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: ZIndex.reticle,
  },
  svg: {
    ...StyleSheet.absoluteFillObject,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  touchTarget: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
});
