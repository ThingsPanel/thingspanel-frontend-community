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
export const PLATFORM_API_BASE_PATH = '/api/v1'

/**
 * Returns the absolute ThingsVis API base URL suitable for cross-origin
 * postMessage payloads (e.g. inside iframe init messages).
 * Uses the current page origin so it always matches the running host.
 */
export function getThingsVisApiBase(): string {
  return window.location.origin + THINGSVIS_API_PROXY_PATH
}

/**
 * Returns the absolute platform API base URL used by ThingsVis runtime REST
 * data sources. Keep this pinned to the current host origin so embedded
 * dashboards follow the deployed system instead of a build-time demo target.
 */
export function getPlatformApiBase(): string {
  return window.location.origin + PLATFORM_API_BASE_PATH
}
