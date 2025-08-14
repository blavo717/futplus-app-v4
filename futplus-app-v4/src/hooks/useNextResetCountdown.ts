import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getNextAppDayStart, formatHMS } from '../utils/appDay';

/**
 * Shape de la cuenta atrás hacia el siguiente reinicio del día de app.
 */
export interface NextResetCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;   // "HH:MM:SS"
  msRemaining: number; // clamp >= 0
  isElapsed: boolean;  // msRemaining === 0
  nextReset: Date;     // Próximo inicio de día de app
}

/**
 * Hook de cuenta atrás al próximo inicio del "día de app".
 * - Tick cada 1s.
 * - Resiliente a background/foreground (AppState).
 * - Tolerante a cambios de reloj/SO (recalcula en foreground y corrige en tick).
 *
 * No lee useDayZero internamente. El valor `dayZeroOffsetHours` debe inyectarse externamente.
 */
export function useNextResetCountdown(dayZeroOffsetHours = 0): NextResetCountdown {
  // Estado y refs
  const nextResetRef = useRef<Date>(getNextAppDayStart(new Date(), dayZeroOffsetHours));
  const [nextReset, setNextReset] = useState<Date>(nextResetRef.current);
  const [msRemaining, setMsRemaining] = useState<number>(() => {
    const now = Date.now();
    return Math.max(0, nextResetRef.current.getTime() - now);
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Helper para actualizar nextReset en ref + state de forma consistente
  const setNextResetSafe = (d: Date) => {
    nextResetRef.current = d;
    setNextReset(d);
  };

  // Configura intervalo de 1s y AppState listener; reconfigura si cambia el offset.
  useEffect(() => {
    // Limpieza por si estuviera activo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Al cambiar el offset recalculamos ancla inmediatamente
    {
      const now = new Date();
      const newNext = getNextAppDayStart(now, dayZeroOffsetHours);
      setNextResetSafe(newNext);
      setMsRemaining(Math.max(0, newNext.getTime() - now.getTime()));
    }

    const tick = () => {
      const nowMs = Date.now();
      let remaining = nextResetRef.current.getTime() - nowMs;

      if (remaining <= 0) {
        const newNext = getNextAppDayStart(new Date(), dayZeroOffsetHours);
        setNextResetSafe(newNext);
        remaining = Math.max(0, newNext.getTime() - nowMs);
        setMsRemaining(remaining);
        return;
      }

      // Corrección por drift/cambios de reloj: si el "siguiente" canónico difiere, corregir.
      const canonicalNext = getNextAppDayStart(new Date(), dayZeroOffsetHours);
      if (canonicalNext.getTime() !== nextResetRef.current.getTime()) {
        setNextResetSafe(canonicalNext);
        remaining = Math.max(0, canonicalNext.getTime() - nowMs);
        setMsRemaining(remaining);
        return;
      }

      setMsRemaining(remaining);
    };

    // Inicia intervalo y ejecuta primer tick inmediato
    intervalRef.current = setInterval(tick, 1000);
    tick();

    const sub = AppState.addEventListener('change', (state) => {
      const prev = appStateRef.current;
      appStateRef.current = state;
      if ((prev === 'inactive' || prev === 'background') && state === 'active') {
        const now = new Date();
        const newNext = getNextAppDayStart(now, dayZeroOffsetHours);
        setNextResetSafe(newNext);
        setMsRemaining(Math.max(0, newNext.getTime() - now.getTime()));
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // RN moderno expone remove(); RN antiguos usaban AppState.removeEventListener.
      sub.remove?.();
    };
  }, [dayZeroOffsetHours]);

  // Derivados para exponer HH, MM, SS y formato
  const derived = useMemo(() => {
    const clamped = Math.max(0, Math.floor(msRemaining));
    const totalSeconds = Math.floor(clamped / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours,
      minutes,
      seconds,
      formatted: formatHMS(msRemaining),
    };
  }, [msRemaining]);

  return {
    hours: derived.hours,
    minutes: derived.minutes,
    seconds: derived.seconds,
    formatted: derived.formatted,
    msRemaining: Math.max(0, msRemaining),
    isElapsed: Math.max(0, msRemaining) === 0,
    nextReset,
  };
}