const key = 'tp-auth-return'

export function safeReturnPath(path: unknown): string {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    Array.from(path).some(char => char.charCodeAt(0) <= 32)
  )
    return '/home'
  const url = new URL(path, window.location.origin)
  if (url.origin !== window.location.origin || /^\/(login|auth-callback)(\/|$)/.test(url.pathname)) return '/home'
  return url.pathname + url.search + url.hash
}

export function rememberAuthReturn(path: unknown) {
  sessionStorage.setItem(key, safeReturnPath(path))
}
export function consumeAuthReturn() {
  const path = safeReturnPath(sessionStorage.getItem(key))
  sessionStorage.removeItem(key)
  return path
}
