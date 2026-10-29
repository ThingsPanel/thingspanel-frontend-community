interface AuthHeaders {
  set(name: string, value: string): unknown
  get(name: string): unknown
  has(name: string): boolean
}

export function applyThingsPanelAuth(headers: AuthHeaders, token: string | null | undefined) {
  if (!token) return

  // ThingsPanel authenticates x-token; dashboard APIs forward an explicit
  // ThingsVis Authorization header to the visualization service.
  headers.set('x-token', token)
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
}

export function refreshThingsPanelAuth(headers: AuthHeaders, token: string) {
  const previousToken = headers.get('x-token')
  if (previousToken && headers.get('Authorization') === `Bearer ${previousToken}`) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  applyThingsPanelAuth(headers, token)
}
