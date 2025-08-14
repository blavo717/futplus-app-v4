/**
 * Utilidades para manejar el "día de app" con un offset horario local.
 * No depende de React; pensado para ejecutarse en cualquier entorno JS/TS.
 */

/** Milisegundos en una hora. */
const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = 24 * MS_IN_HOUR;

/**
 * Retorna el Date del comienzo del "día de app" que contiene a `now`,
 * tomando como referencia la medianoche local desplazada por `dayZeroOffsetHours`.
 *
 * Ejemplo: si dayZeroOffsetHours = 5, el "día de app" inicia a las 05:00 locales.
 * - Si now = 2025-08-13 03:00, el inicio corresponde al día anterior 2025-08-12 05:00.
 * - Si now = 2025-08-13 06:00, el inicio es 2025-08-13 05:00.
 */
export function getAppDayStart(now: Date, dayZeroOffsetHours = 0): Date {
  const start = new Date(now);
  // Medianoche local del día de `now`
  start.setHours(0, 0, 0, 0);
  // Desplazar por offset horario
  start.setHours(start.getHours() + dayZeroOffsetHours, 0, 0, 0);

  // Si aún no se alcanzó el inicio de hoy, retroceder un día
  if (now.getTime() < start.getTime()) {
    start.setDate(start.getDate() - 1);
  }
  return start;
}

/**
 * Retorna el próximo inicio de "día de app" posterior a `now`.
 * Equivalente a: getAppDayStart(now, offset) + 24h.
 */
export function getNextAppDayStart(now: Date, dayZeroOffsetHours = 0): Date {
  const currentStart = getAppDayStart(now, dayZeroOffsetHours);
  const next = new Date(currentStart.getTime() + MS_IN_DAY);
  return next;
}

/**
 * Milisegundos restantes hasta el próximo inicio de "día de app".
 * Clamp a 0 para evitar negativos.
 */
export function computeMsToNextReset(
  nowMs: number,
  dayZeroOffsetHours = 0
): number {
  const now = new Date(nowMs);
  const next = getNextAppDayStart(now, dayZeroOffsetHours);
  const diff = next.getTime() - nowMs;
  return diff > 0 ? diff : 0;
}

/**
 * Formatea milisegundos como "HH:MM:SS" con 2 dígitos por componente.
 * Usa Math.floor y clamp en 0 si ms < 0.
 */
export function formatHMS(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad2 = (n: number) => n.toString().padStart(2, '0');
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}