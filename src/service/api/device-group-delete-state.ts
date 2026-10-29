export interface DeviceGroupDeleteIntent {
  groupId: string
  etag: string
  key: string
  outcomeUnknown: boolean
}

const intents = new Map<string, DeviceGroupDeleteIntent>()
const inFlight = new Map<string, number>()
let sessionIdentity: string | null = null
let sessionGeneration = 0

export class DeviceGroupDeleteSessionChangedError extends Error {
  constructor() {
    super('Device group delete session changed')
    this.name = 'DeviceGroupDeleteSessionChangedError'
  }
}

export function syncDeviceGroupDeleteSession(loggedIn: boolean, subjectId: string, tenantId: string): boolean {
  const nextIdentity = JSON.stringify([loggedIn, subjectId, tenantId])
  if (nextIdentity === sessionIdentity) return false
  sessionIdentity = nextIdentity
  sessionGeneration += 1
  intents.clear()
  inFlight.clear()
  return true
}

export function getDeviceGroupDeleteSessionGeneration(): number {
  return sessionGeneration
}

export function isCurrentDeviceGroupDeleteSession(generation: number): boolean {
  return generation === sessionGeneration
}

export function beginDeviceGroupDelete(groupId: string, generation: number): boolean {
  if (!isCurrentDeviceGroupDeleteSession(generation) || inFlight.has(groupId)) return false
  inFlight.set(groupId, generation)
  return true
}

export function finishDeviceGroupDelete(groupId: string, generation: number): void {
  if (inFlight.get(groupId) === generation) inFlight.delete(groupId)
}

export function getDeviceGroupDeleteIntent(groupId: string): DeviceGroupDeleteIntent | undefined {
  return intents.get(groupId)
}

export function listDeviceGroupDeleteIntents(): DeviceGroupDeleteIntent[] {
  return [...intents.values()]
}

export function createDeviceGroupDeleteIntent(
  groupId: string,
  etag: string,
  key: string,
  generation: number
): DeviceGroupDeleteIntent {
  if (!isCurrentDeviceGroupDeleteSession(generation)) throw new DeviceGroupDeleteSessionChangedError()
  const intent = { groupId, etag, key, outcomeUnknown: false }
  intents.set(groupId, intent)
  return intent
}

export async function prepareDeviceGroupDeleteIntent(
  groupId: string,
  readEtag: () => Promise<string>,
  createKey: () => string,
  generation: number
): Promise<DeviceGroupDeleteIntent> {
  if (!isCurrentDeviceGroupDeleteSession(generation)) throw new DeviceGroupDeleteSessionChangedError()
  const existing = intents.get(groupId)
  if (existing) return existing
  const etag = await readEtag()
  if (!isCurrentDeviceGroupDeleteSession(generation)) throw new DeviceGroupDeleteSessionChangedError()
  return createDeviceGroupDeleteIntent(groupId, etag, createKey(), generation)
}

export function completeDeviceGroupDelete(groupId: string, generation: number): boolean {
  if (!isCurrentDeviceGroupDeleteSession(generation)) return false
  intents.delete(groupId)
  return true
}

/** Explicit first-attempt conflicts are safe to discard; after uncertainty every retry keeps the receipt identity. */
export function failDeviceGroupDelete(
  groupId: string,
  status: number | undefined,
  generation: number
): { retained: boolean; intent?: DeviceGroupDeleteIntent } {
  if (!isCurrentDeviceGroupDeleteSession(generation)) return { retained: false }
  const intent = intents.get(groupId)
  if (!intent) return { retained: false }
  if ((status === 409 || status === 412) && !intent.outcomeUnknown) {
    intents.delete(groupId)
    return { retained: false }
  }
  intent.outcomeUnknown = true
  return { retained: true, intent }
}

export function deviceGroupDeleteErrorStatus(error: unknown): number | undefined {
  const candidate = error as { status?: unknown } | null
  return typeof candidate?.status === 'number' ? candidate.status : undefined
}
