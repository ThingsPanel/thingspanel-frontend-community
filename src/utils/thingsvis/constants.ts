/**
 * ThingsVis shared constants.
 * Single source of truth for the API proxy path used across the app.
 */

/**
 * Vite proxy path prefix for ThingsVis backend requests.
 *
 * This MUST match the key registered in build/config/proxy.ts — always '/thingsvis-api'.
 * Do NOT read VITE_THINGSVIS_API_URL here: that env var holds the proxy TARGET (a full
 * http address used by Vite at build-time), not the frontend path prefix.
 */
export const THINGSVIS_API_PROXY_PATH = '/thingsvis-api'

/**
 * Returns the absolute ThingsVis API base URL suitable for cross-origin
 * postMessage payloads (e.g. inside iframe init messages).
 * Uses the current page origin so it always matches the running host.
 */
export function getThingsVisApiBase(): string {
  return window.location.origin + THINGSVIS_API_PROXY_PATH
}
