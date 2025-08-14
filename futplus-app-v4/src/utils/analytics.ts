/**
 * Mínimo wrapper de analítica para no romper builds.
 * Reemplazar por integración real (Amplitude, GA4, Segment, Sentry, etc.).
 */
export type AnalyticsPayload = Record<string, any> | undefined;

export function logEvent(eventName: string, payload?: AnalyticsPayload) {
  try {
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${eventName}`, payload || {});
    // TODO: Integrar proveedor real de analítica aquí
    // e.g., Analytics.track(eventName, payload);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[analytics] error logging event', { eventName, payload, error: e });
  }
}