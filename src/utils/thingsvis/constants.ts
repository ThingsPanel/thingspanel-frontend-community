/**
 * ThingsVis shared constants.
 * Single source of truth for the API proxy path used across the app.
 */

import { createProxyPattern } from '../../../env.config'

/**
 * Vite proxy path prefix for ThingsVis backend requests.
 *
 * This MUST match the key registered in build/config/proxy.ts — always '/thingsvis-api'.
 * Do NOT read VITE_THINGSVIS_API_URL here: that env var holds the proxy TARGET (a full
 * http address used by Vite at build-time), not the frontend path prefix.
 */
export const THINGSVIS_API_PROXY_PATH = '/thingsvis-api'
export const PLATFORM_API_BASE_PATH = '/api/v1'
export const PLATFORM_API_PROXY_PATH = createProxyPattern()

/**
 * Resolve the platform API path used by ThingsVis runtime REST data sources.
 * In proxy mode `/api/v1` is not a Vite proxy entry and would be served by the
 * SPA fallback as HTML, so it must use the default backend proxy prefix.
 */
export function resolvePlatformApiBasePath(isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y'): string {
  return isHttpProxy ? PLATFORM_API_PROXY_PATH : PLATFORM_API_BASE_PATH
}

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
  return window.location.origin + resolvePlatformApiBasePath()
}
