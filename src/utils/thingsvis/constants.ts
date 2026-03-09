/**
 * ThingsVis shared constants.
 * Single source of truth for the API proxy path used across the app.
 */

/**
 * Vite proxy path prefix for ThingsVis backend requests.
 * Maps to VITE_THINGSVIS_API_URL env var (fallback: '/thingsvis-api').
 * Vite dev proxy rewrites this prefix to the real backend origin.
 */
export const THINGSVIS_API_PROXY_PATH: string = (import.meta.env.VITE_THINGSVIS_API_URL as string) || '/thingsvis-api'

/**
 * Returns the absolute ThingsVis API base URL suitable for cross-origin
 * postMessage payloads (e.g. inside iframe init messages).
 * Uses the current page origin so it always matches the running host.
 */
export function getThingsVisApiBase(): string {
  return window.location.origin + THINGSVIS_API_PROXY_PATH
}
