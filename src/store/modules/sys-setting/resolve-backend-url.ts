/**
 * ThingsPanel 在子路径（如 /tp/）发布时，VITE_BASE_URL 会把 service URL
 * 编成相对路径 `/tp/api/v1`。`new URL('/tp/api/v1')` 没有 base，浏览器会直接抛
 * Invalid URL，main.ts 顶层 import 失败，#app 永远是空的。
 */
export function resolveBackendAbsoluteUrl(
  demoBase?: string | null,
  origin: string = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost'
): URL {
  const fallback = `${origin.replace(/\/$/, '')}/api/v1`
  return new URL(demoBase || fallback, origin)
}
