import type { components } from './generated/device-metadata/types'
import { createMetadataNativeRequester, type MetadataNativeErrorBody } from './metadata-native-http'

export type SimulatorProfile = components['schemas']['SimulatorProfile']
export type UpdateSimulatorProfile = components['schemas']['UpdateSimulatorProfile']
export type SimulationSession = components['schemas']['SimulationSession']
export type SimulationRun = components['schemas']['SimulationRun']

export interface DeviceSimulatorNativeOptions {
  fetch: typeof globalThis.fetch
  getToken: () => string | undefined | null
  getLanguage: () => string | undefined | null
}

export class DeviceSimulatorNativeError extends Error {
  constructor(
    readonly status: number,
    readonly body?: MetadataNativeErrorBody
  ) {
    super(body && 'detail' in body ? body.detail : body?.message || `Device simulator request failed (${status})`)
    this.name = 'DeviceSimulatorNativeError'
  }
}

export interface DeviceSimulatorNativeClient {
  /** null when nothing has been saved yet (the server answers 404). */
  getProfile(deviceId: string): Promise<{ profile: SimulatorProfile; etag: string } | null>
  /** The first save sends ifMatch `"sim-profile-0"`. */
  saveProfile(
    deviceId: string,
    body: UpdateSimulatorProfile,
    ifMatch: string,
    idempotencyKey: string
  ): Promise<{ profile: SimulatorProfile; etag: string }>
  createSession(deviceId: string, profileVersion: number, idempotencyKey: string): Promise<SimulationSession>
  closeSession(deviceId: string, sessionId: string): Promise<SimulationSession>
  run(deviceId: string, sessionId: string, messageCount: number, idempotencyKey: string): Promise<SimulationRun>
}

export const FIRST_PROFILE_ETAG = '"sim-profile-0"'

function requireKey(key: string): string {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) throw new Error('Idempotency-Key must be 8 to 128 allowed characters')
  return key
}

export function createDeviceSimulatorNativeClient(options: DeviceSimulatorNativeOptions): DeviceSimulatorNativeClient {
  const request = createMetadataNativeRequester({ ...options, resourceName: 'Device simulator' })
  const fail = (status: number, body: MetadataNativeErrorBody | undefined) =>
    new DeviceSimulatorNativeError(status, body)
  const base = (id: string) => `/api/v2/devices/${encodeURIComponent(id)}`
  const json = (key: string) => new Headers({ 'Content-Type': 'application/json', 'Idempotency-Key': requireKey(key) })
  return {
    async getProfile(deviceId) {
      try {
        const { data, response } = await request<SimulatorProfile, DeviceSimulatorNativeError>(
          `${base(deviceId)}/simulator-profile`,
          200,
          fail,
          { method: 'GET' }
        )
        return { profile: data, etag: response.headers.get('ETag') ?? `"sim-profile-${data.resourceVersion}"` }
      } catch (error) {
        if (error instanceof DeviceSimulatorNativeError && error.status === 404) return null
        throw error
      }
    },
    async saveProfile(deviceId, body, ifMatch, key) {
      const headers = json(key)
      headers.set('If-Match', ifMatch)
      const { data, response } = await request<SimulatorProfile, DeviceSimulatorNativeError>(
        `${base(deviceId)}/simulator-profile`,
        200,
        fail,
        { method: 'PUT', headers, body: JSON.stringify(body) }
      )
      return { profile: data, etag: response.headers.get('ETag') ?? `"sim-profile-${data.resourceVersion}"` }
    },
    async createSession(deviceId, profileVersion, key) {
      const { data } = await request<SimulationSession, DeviceSimulatorNativeError>(
        `${base(deviceId)}/simulator-sessions`,
        201,
        fail,
        { method: 'POST', headers: json(key), body: JSON.stringify({ profileVersion }) }
      )
      return data
    },
    async closeSession(deviceId, sessionId) {
      const { data } = await request<SimulationSession, DeviceSimulatorNativeError>(
        `${base(deviceId)}/simulator-sessions/${encodeURIComponent(sessionId)}`,
        200,
        fail,
        { method: 'DELETE' }
      )
      return data
    },
    async run(deviceId, sessionId, messageCount, key) {
      const { data } = await request<SimulationRun, DeviceSimulatorNativeError>(
        `${base(deviceId)}/simulation-runs`,
        201,
        fail,
        { method: 'POST', headers: json(key), body: JSON.stringify({ sessionId, messageCount }) }
      )
      return data
    }
  }
}
