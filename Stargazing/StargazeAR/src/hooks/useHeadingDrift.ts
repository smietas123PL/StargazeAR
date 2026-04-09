import { useEffect, useRef } from 'react';

const HEADING_DRIFT_PITCH_STABLE_MAX = 20;
const HEADING_DRIFT_STEP_MIN = 0.03;
const HEADING_DRIFT_STEP_MAX = 0.35;
const HEADING_DRIFT_MIN_FRAMES = 8;
const HEADING_DRIFT_COMPENSATION = 0.08;
const HEADING_DRIFT_MAX_STEP = 0.025;

function normalizeHeading(value: number) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function getHeadingDelta(next: number, previous: number) {
  const delta = normalizeHeading(next) - normalizeHeading(previous);

  if (delta > 180) {
    return delta - 360;
  }

  if (delta < -180) {
    return delta + 360;
  }

  return delta;
}

type UseHeadingDriftParams = {
  heading: number;
  pitch: number;
  isMockEnabled: boolean;
};

export default function useHeadingDrift({
  heading,
  pitch,
  isMockEnabled,
}: UseHeadingDriftParams) {
  const headingDriftRef = useRef(0);
  const previousHeadingRef = useRef<number | null>(null);
  const headingDriftFramesRef = useRef(0);
  const headingDriftDirectionRef = useRef(0);

  useEffect(() => {
    if (isMockEnabled) {
      return;
    }

    if (previousHeadingRef.current === null) {
      previousHeadingRef.current = heading;
      return;
    }

    const delta = getHeadingDelta(heading, previousHeadingRef.current);
    previousHeadingRef.current = heading;

    const isPitchStable = Math.abs(pitch) < HEADING_DRIFT_PITCH_STABLE_MAX;
    const absDelta = Math.abs(delta);
    const direction = Math.sign(delta);
    const isPotentialDriftStep =
      absDelta >= HEADING_DRIFT_STEP_MIN &&
      absDelta <= HEADING_DRIFT_STEP_MAX &&
      direction !== 0;

    if (!isPitchStable || !isPotentialDriftStep) {
      headingDriftFramesRef.current = 0;
      headingDriftDirectionRef.current = 0;
      return;
    }

    if (headingDriftDirectionRef.current !== direction) {
      headingDriftDirectionRef.current = direction;
      headingDriftFramesRef.current = 1;
      return;
    }

    headingDriftFramesRef.current += 1;

    if (headingDriftFramesRef.current < HEADING_DRIFT_MIN_FRAMES) {
      return;
    }

    const driftStep = Math.min(
      absDelta * HEADING_DRIFT_COMPENSATION,
      HEADING_DRIFT_MAX_STEP,
    );

    headingDriftRef.current += direction * driftStep;
  }, [heading, isMockEnabled, pitch]);

  return normalizeHeading(heading - headingDriftRef.current);
}
