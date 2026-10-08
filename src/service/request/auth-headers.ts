import type { AxiosRequestHeaders } from 'axios'

export function applyThingsPanelAuth(headers: AxiosRequestHeaders, token: string | null | undefined) {
  if (!token) return

  // ThingsPanel authenticates x-token; dashboard APIs forward an explicit
  // ThingsVis Authorization header to the visualization service.
  headers.set('x-token', token)
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
}

export function refreshThingsPanelAuth(headers: AxiosRequestHeaders, token: string) {
  const previousToken = headers.get('x-token')
  if (previousToken && headers.get('Authorization') === `Bearer ${previousToken}`) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  applyThingsPanelAuth(headers, token)
}
