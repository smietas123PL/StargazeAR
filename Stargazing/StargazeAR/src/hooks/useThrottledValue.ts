import { useEffect, useRef, useState } from 'react';

/**
 * Returns a throttled version of the provided value.
 * The returned value will only update at most once every `delay` milliseconds.
 */
export default function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const valueRef = useRef(value);
  const lastUpdatedRef = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    valueRef.current = value;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdatedRef.current;

    if (timeSinceLastUpdate >= delay) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setThrottledValue(value);
      lastUpdatedRef.current = now;
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(valueRef.current);
        lastUpdatedRef.current = Date.now();
        timeoutRef.current = null;
      }, delay - timeSinceLastUpdate);
    }

    return () => {
      // Note: we don't clear the timeout on typical dependencies unmount because
      // we want the final trailing value to flush if the component stays mounted.
      // But for total cleanup, we should clear it if the component fully unmounts.
    };
  }, [value, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledValue;
}
