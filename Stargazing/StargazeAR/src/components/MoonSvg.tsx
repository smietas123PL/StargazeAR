import { Circle, Ellipse, G } from 'react-native-svg';

type MoonSvgProps = {
  cx: number;
  cy: number;
  radius: number;
  illumination: number;
  waxing: boolean;
  lightColor: string;
  darkColor: string;
  strokeColor: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type CrescentShapeProps = {
  cx: number;
  cy: number;
  radius: number;
  widthScale: number;
  mirror: boolean;
  fill: string;
};

function CrescentShape({
  cx,
  cy,
  radius,
  widthScale,
  mirror,
  fill,
}: CrescentShapeProps) {
  const ellipseCenterX = mirror
    ? cx - radius + radius * widthScale
    : cx + radius - radius * widthScale;

  return (
    <G>
      <Circle
        cx={mirror ? cx - radius / 2 : cx + radius / 2}
        cy={cy}
        r={radius}
        fill={fill}
      />
      <Ellipse
        cx={ellipseCenterX}
        cy={cy}
        rx={Math.max(radius * widthScale, 0.001)}
        ry={radius}
        fill={fill}
      />
    </G>
  );
}

export default function MoonSvg({
  cx,
  cy,
  radius,
  illumination,
  waxing,
  lightColor,
  darkColor,
  strokeColor,
}: MoonSvgProps) {
  const clampedIllumination = clamp(illumination, 0, 1);

  if (clampedIllumination <= 0.01) {
    return (
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={darkColor}
        stroke={strokeColor}
        strokeWidth={1}
      />
    );
  }

  if (clampedIllumination >= 0.99) {
    return (
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={lightColor}
        stroke={strokeColor}
        strokeWidth={1}
      />
    );
  }

  const widthScale = Math.abs(clampedIllumination * 2 - 1);

  return (
    <G>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={clampedIllumination >= 0.5 ? lightColor : darkColor}
        stroke={strokeColor}
        strokeWidth={1}
      />
      {clampedIllumination < 0.5 ? (
        <CrescentShape
          cx={cx}
          cy={cy}
          radius={radius}
          widthScale={widthScale}
          mirror={!waxing}
          fill={lightColor}
        />
      ) : (
        <CrescentShape
          cx={cx}
          cy={cy}
          radius={radius}
          widthScale={widthScale}
          mirror={waxing}
          fill={darkColor}
        />
      )}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1}
      />
    </G>
  );
}
