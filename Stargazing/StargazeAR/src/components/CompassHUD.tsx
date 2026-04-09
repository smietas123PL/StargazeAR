import {
  StyleSheet,
  Text,
  View,
} from '../utils/reactNative';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';
import { ZIndex } from '../constants/zIndex';
import {
  HEADING_CALIBRATION_LABELS,
  type HeadingCalibrationLevel,
} from '../types';
import useThrottledValue from '../hooks/useThrottledValue';

type CompassHUDProps = {
  heading: number;
  pitch: number;
  headingCalibrationLevel: HeadingCalibrationLevel;
  topOffset: number;
  horizontalPadding: number;
};

const COMPASS_SIZE = 72;
const COMPASS_CENTER = COMPASS_SIZE / 2;

export default function CompassHUD({
  heading,
  pitch,
  headingCalibrationLevel,
  topOffset,
  horizontalPadding,
}: CompassHUDProps) {
  const { theme } = useTheme();
  const isWeak = headingCalibrationLevel < 2;
  const frameColor = isWeak ? theme.compassWeak : theme.compassStrong;
  const statusDotColor = isWeak
    ? theme.compassStatusWeak
    : theme.compassStatusStrong;
  const calibrationSummary = HEADING_CALIBRATION_LABELS[headingCalibrationLevel];
  
  // Throttle numerical values for reading comfort (approx. 4 updates per sec)
  const displayHeading = useThrottledValue(heading, 250);
  const displayPitch = useThrottledValue(pitch, 250);
  const pitchLabel = `${displayPitch >= 0 ? '+' : ''}${displayPitch.toFixed(0)}`;

  return (
    <View
      style={[styles.wrapper, { top: topOffset, right: horizontalPadding }]}
      pointerEvents="none"
    >
      <View
        accessibilityLabel={`Kompas. Heading ${heading.toFixed(0)} stopni. Pitch ${pitchLabel} stopni. Kalibracja: ${calibrationSummary}.`}
        accessibilityRole="text"
        style={[
          styles.card,
          { backgroundColor: theme.overlay, borderColor: frameColor },
        ]}
      >
        <View
          style={[
            styles.innerFrame,
            { borderColor: theme.compassInnerFrame },
          ]}
        />

        <Svg
          accessibilityElementsHidden
          accessible={false}
          width={COMPASS_SIZE}
          height={COMPASS_SIZE}
          importantForAccessibility="no-hide-descendants"
        >
          <Circle
            cx={COMPASS_CENTER}
            cy={COMPASS_CENTER}
            r={34}
            fill="none"
            stroke={frameColor}
            strokeWidth={isWeak ? 2 : 1.5}
          />
          <Circle
            cx={COMPASS_CENTER}
            cy={COMPASS_CENTER}
            r={26}
            fill="none"
            stroke={theme.compassInnerRing}
            strokeWidth={1}
          />
          <Circle
            cx={COMPASS_CENTER}
            cy={COMPASS_CENTER}
            r={2}
            fill={theme.compassCenterDot}
          />
          <G transform={`rotate(${-heading}, ${COMPASS_CENTER}, ${COMPASS_CENTER})`}>
            <Line x1={36} y1={8} x2={36} y2={18} stroke={theme.north} strokeWidth={2} />
            <Line
              x1={36}
              y1={54}
              x2={36}
              y2={64}
              stroke={theme.compassText}
              strokeWidth={1.4}
            />
            <Line
              x1={8}
              y1={36}
              x2={18}
              y2={36}
              stroke={theme.compassText}
              strokeWidth={1.4}
            />
            <Line
              x1={54}
              y1={36}
              x2={64}
              y2={36}
              stroke={theme.compassText}
              strokeWidth={1.4}
            />

            <Line
              x1={21}
              y1={21}
              x2={25}
              y2={25}
              stroke={theme.compassDiagonalTick}
              strokeWidth={1}
            />
            <Line
              x1={51}
              y1={21}
              x2={47}
              y2={25}
              stroke={theme.compassDiagonalTick}
              strokeWidth={1}
            />
            <Line
              x1={51}
              y1={51}
              x2={47}
              y2={47}
              stroke={theme.compassDiagonalTick}
              strokeWidth={1}
            />
            <Line
              x1={21}
              y1={51}
              x2={25}
              y2={47}
              stroke={theme.compassDiagonalTick}
              strokeWidth={1}
            />

            <SvgText
              x={36}
              y={15}
              fill={theme.north}
              fontSize={11}
              fontWeight="700"
              textAnchor="middle"
            >
              N
            </SvgText>
            <SvgText
              x={36}
              y={69}
              fill={theme.compassText}
              fontSize={9}
              fontWeight="600"
              textAnchor="middle"
            >
              S
            </SvgText>
            <SvgText
              x={10}
              y={39}
              fill={theme.compassText}
              fontSize={9}
              fontWeight="600"
              textAnchor="middle"
            >
              W
            </SvgText>
            <SvgText
              x={62}
              y={39}
              fill={theme.compassText}
              fontSize={9}
              fontWeight="600"
              textAnchor="middle"
            >
              E
            </SvgText>
          </G>
          <Line
            x1={36}
            y1={14}
            x2={36}
            y2={34}
            stroke={theme.compassText}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>HEADING</Text>
        <Text style={[styles.primaryText, { color: theme.compassText }]}>
          {displayHeading.toFixed(0)}°
        </Text>

        <Text style={[styles.sectionLabel, styles.pitchLabel, { color: theme.muted }]}>
          PITCH
        </Text>
        <Text style={[styles.secondaryText, { color: theme.muted }]}>
          {pitchLabel}°
        </Text>

        <View style={styles.calibrationRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusDotColor,
                borderColor: isWeak
                  ? frameColor
                  : theme.nightMode
                    ? 'rgba(255, 210, 210, 0.4)'
                    : 'rgba(255, 255, 255, 0.28)',
              },
            ]}
          />
          <Text
            style={[
              styles.secondaryText,
              styles.calibrationText,
              { color: isWeak ? frameColor : theme.muted },
            ]}
          >
            {calibrationSummary}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: ZIndex.compass,
  },
  card: {
    width: 108,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  innerFrame: {
    ...StyleSheet.absoluteFillObject,
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 5,
  },
  pitchLabel: {
    marginTop: 3,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 1,
  },
  secondaryText: {
    fontSize: 11,
    lineHeight: 15,
  },
  calibrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    marginRight: 6,
  },
  calibrationText: {
    fontSize: 10.5,
  },
});
