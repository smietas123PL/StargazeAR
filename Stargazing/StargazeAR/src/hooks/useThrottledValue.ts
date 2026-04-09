import { useEffect, useRef, useState } from 'react';

/**
 * Returns a throttled version of the provided value.
 * The returned value will only update at most once every `delay` milliseconds.
 */
export default function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const timeSinceLastUpdate = Date.now() - lastExecuted.current;

    if (timeSinceLastUpdate >= delay) {
      setThrottledValue(value);
      lastExecuted.current = Date.now();
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastExecuted.current = Date.now();
      }, delay - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, delay]);

  return throttledValue;
}
