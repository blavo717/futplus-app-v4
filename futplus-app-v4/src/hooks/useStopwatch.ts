import { useCallback, useEffect, useRef, useState } from 'react';

interface UseStopwatchOptions {
  autoStart?: boolean;
  intervalMs?: number; // default 1000
}

export function useStopwatch(options: UseStopwatchOptions = {}) {
  const { autoStart = false, intervalMs = 1000 } = options;
  const [timeMs, setTimeMs] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeMs((t) => t + intervalMs);
    }, intervalMs) as any;
  }, [intervalMs]);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current as any);
      intervalRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    setTimeMs(0);
  }, []);

  useEffect(() => {
    if (autoStart) start();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(timeMs / 60000);
  const seconds = Math.floor((timeMs % 60000) / 1000);
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    timeMs,
    minutes,
    seconds,
    mmss,
    isRunning,
    start,
    pause,
    toggle,
    reset,
  };
}

export default useStopwatch;