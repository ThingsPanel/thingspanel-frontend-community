import { shallowRef } from 'vue'
import type { CustomFieldDefinition, CustomFieldType } from '../../../../service/api/template-custom-fields-state'

export type DeviceInfoValueMode = 'unset' | 'null' | 'value'

export interface DeviceInfoFieldDraft {
  mode: DeviceInfoValueMode
  /** Number tokens stay text here so an unchanged or edited large integer is never rounded by JS. */
  text: string
}

export interface DeviceInfoSaveAttempt {
  deviceId: string
  templateId: string | null
  payloadJSON: string
  etag: string
  key: string
  previouslyUnknown: boolean
  sessionGeneration: number
  targetGeneration: number
}

const attempts = new Map<string, DeviceInfoSaveAttempt>()
export const deviceInfoAttemptRevision = shallowRef(0)
const targetGenerations = new Map<string, number>()
let activeTargetKey: string | null = null
let sessionIdentity: string | null = null
let sessionGeneration = 0

function attemptKey(deviceId: string, templateId: string | null): string {
  return JSON.stringify([deviceId, templateId])
}

export function syncDeviceInfoSession(loggedIn: boolean, subjectId: string, tenantId: string): boolean {
  const nextIdentity = JSON.stringify([loggedIn, subjectId, tenantId])
  if (nextIdentity === sessionIdentity) return false
  sessionIdentity = nextIdentity
  sessionGeneration += 1
  attempts.clear()
  deviceInfoAttemptRevision.value += 1
  targetGenerations.clear()
  activeTargetKey = null
  return true
}

/** A detail refresh for the same device/template keeps attempts; switching target invalidates late replies. */
export function syncDeviceInfoTarget(deviceId: string, templateId: string | null): number {
  const key = attemptKey(deviceId, templateId)
  if (activeTargetKey !== key) {
    if (activeTargetKey) {
      targetGenerations.set(activeTargetKey, (targetGenerations.get(activeTargetKey) ?? 0) + 1)
    }
    activeTargetKey = key
  }
  if (!targetGenerations.has(key)) targetGenerations.set(key, 1)
  return targetGenerations.get(key) ?? 1
}

export function isCurrentDeviceInfoTarget(deviceId: string, templateId: string | null, generation: number): boolean {
  return targetGenerations.get(attemptKey(deviceId, templateId)) === generation
}

export function isActiveDeviceInfoTarget(deviceId: string, templateId: string | null): boolean {
  return activeTargetKey === attemptKey(deviceId, templateId)
}

export function getDeviceInfoSessionGeneration(): number {
  return sessionGeneration
}

export function isCurrentDeviceInfoSession(generation: number): boolean {
  return sessionGeneration === generation
}

export function getDeviceInfoAttempt(
  deviceId: string,
  templateId: string | null,
  session: number,
  target: number
): DeviceInfoSaveAttempt | undefined {
  const attempt = attempts.get(attemptKey(deviceId, templateId))
  return attempt?.sessionGeneration === session && attempt.targetGeneration === target ? attempt : undefined
}

/** Return an outstanding request from this actor even when the detail target remounted. */
export function getDeviceInfoAttemptForSession(session: number): DeviceInfoSaveAttempt | undefined {
  return [...attempts.values()].find(attempt => attempt.sessionGeneration === session)
}

export function createDeviceInfoAttempt(
  deviceId: string,
  templateId: string | null,
  payloadJSON: string,
  etag: string,
  key: string,
  session: number,
  target: number
): DeviceInfoSaveAttempt {
  if (!isCurrentDeviceInfoSession(session)) throw new Error('Device info edit session changed')
  const mapKey = attemptKey(deviceId, templateId)
  const existing = attempts.get(mapKey)
  if (existing?.sessionGeneration === session) return existing
  const unresolved = getDeviceInfoAttemptForSession(session)
  if (unresolved) return unresolved
  const attempt: DeviceInfoSaveAttempt = {
    deviceId,
    templateId,
    payloadJSON,
    etag,
    key,
    previouslyUnknown: false,
    sessionGeneration: session,
    targetGeneration: target
  }
  attempts.set(mapKey, attempt)
  deviceInfoAttemptRevision.value += 1
  return attempt
}

export function markDeviceInfoAttemptUnknown(attempt: DeviceInfoSaveAttempt): DeviceInfoSaveAttempt | undefined {
  if (!isCurrentDeviceInfoSession(attempt.sessionGeneration)) return undefined
  const mapKey = attemptKey(attempt.deviceId, attempt.templateId)
  const stored = attempts.get(mapKey)
  if (stored !== attempt) return undefined
  const unknownAttempt: DeviceInfoSaveAttempt = { ...attempt, previouslyUnknown: true }
  attempts.set(mapKey, unknownAttempt)
  deviceInfoAttemptRevision.value += 1
  return unknownAttempt
}

export function clearDeviceInfoAttempt(attempt: DeviceInfoSaveAttempt): boolean {
  if (!isCurrentDeviceInfoSession(attempt.sessionGeneration)) return false
  const mapKey = attemptKey(attempt.deviceId, attempt.templateId)
  if (attempts.get(mapKey) !== attempt) return false
  attempts.delete(mapKey)
  deviceInfoAttemptRevision.value += 1
  return true
}

export function shouldRetainDeviceInfoAttempt(status: number | undefined, previouslyUnknown: boolean): boolean {
  return previouslyUnknown || status === undefined || status === 401 || status === 408 || status >= 500
}

export function isFiniteJsonNumberToken(token: string): boolean {
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) return false
  return Number.isFinite(Number(token))
}

export function parseJsonScalarToken(token: string): string | number | boolean | null {
  let value: unknown
  try {
    value = JSON.parse(token)
  } catch {
    throw new Error('Device info value is not valid JSON')
  }
  if (value === null) return null
  if (typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  throw new Error('Device info value must be a finite JSON scalar')
}

export function makeDeviceInfoFieldDraft(
  type: CustomFieldType,
  assigned: boolean,
  token?: string
): DeviceInfoFieldDraft {
  if (!assigned) return { mode: 'unset', text: '' }
  if (token === undefined) throw new Error('Assigned device info value is missing its token')
  const value = parseJsonScalarToken(token)
  if (value === null) return { mode: 'null', text: '' }
  if (type === 'number') {
    if (typeof value !== 'number' || !isFiniteJsonNumberToken(token)) {
      throw new Error('Stored numeric device info value is invalid')
    }
    return { mode: 'value', text: token }
  }
  if (type === 'boolean') {
    if (typeof value !== 'boolean') throw new Error('Stored boolean device info value is invalid')
    return { mode: 'value', text: token }
  }
  if (typeof value !== 'string') throw new Error('Stored textual device info value is invalid')
  return { mode: 'value', text: value }
}

export function serializeDeviceInfoFieldDraft(type: CustomFieldType, draft: DeviceInfoFieldDraft): string | undefined {
  if (draft.mode === 'unset') return undefined
  if (draft.mode === 'null') return 'null'
  if (type === 'number') {
    if (!isFiniteJsonNumberToken(draft.text)) throw new Error('请输入有限的合法 JSON 数字')
    return draft.text
  }
  if (type === 'boolean') {
    if (draft.text !== 'true' && draft.text !== 'false') throw new Error('布尔值必须是 true 或 false')
    return draft.text
  }
  return JSON.stringify(draft.text)
}

/**
 * Apply only enabled fields explicitly changed by the user. The input map contains raw JSON tokens,
 * so unrelated historical values (including large numeric literals) are copied byte-for-byte.
 */
export function applyDeviceInfoFieldDrafts(
  originalTokens: Record<string, string>,
  definitions: CustomFieldDefinition[],
  drafts: Record<string, DeviceInfoFieldDraft>
): { tokens: Record<string, string>; changed: boolean } {
  const tokens: Record<string, string> = Object.assign(Object.create(null), originalTokens)
  let changed = false
  for (const definition of definitions) {
    if (!definition.enabled) continue
    const draft = Object.prototype.hasOwnProperty.call(drafts, definition.key) ? drafts[definition.key] : undefined
    if (!draft) continue
    const beforeAssigned = Object.prototype.hasOwnProperty.call(originalTokens, definition.key)
    const after = serializeDeviceInfoFieldDraft(definition.type, draft)
    const before = beforeAssigned ? parseJsonScalarToken(originalTokens[definition.key]) : undefined
    const semanticMatch =
      beforeAssigned &&
      ((draft.mode === 'null' && before === null) ||
        (draft.mode === 'value' &&
          (definition.type === 'number'
            ? originalTokens[definition.key] === after
            : definition.type === 'boolean'
              ? before === (draft.text === 'true')
              : before === draft.text)))
    if (semanticMatch) continue
    if (after === undefined) {
      if (beforeAssigned) {
        delete tokens[definition.key]
        changed = true
      }
    } else if (!beforeAssigned || originalTokens[definition.key] !== after) {
      tokens[definition.key] = after
      changed = true
    }
  }
  return { tokens, changed }
}

export interface DeviceInfoLocationDraft {
  latitude: string
  longitude: string
  address: string
}

export function getDeviceInfoLocationValidationError(draft: DeviceInfoLocationDraft): string | null {
  const latitude = draft.latitude.trim()
  const longitude = draft.longitude.trim()
  if (Boolean(latitude) !== Boolean(longitude)) return '纬度和经度必须同时填写；也可以只填写地址。'
  if (!latitude) return null
  if (!isFiniteJsonNumberToken(latitude)) return '纬度必须是有限数字。'
  if (!isFiniteJsonNumberToken(longitude)) return '经度必须是有限数字。'
  if (Number(latitude) < -90 || Number(latitude) > 90) return '纬度必须在 -90 到 90 之间。'
  if (Number(longitude) < -180 || Number(longitude) > 180) return '经度必须在 -180 到 180 之间。'
  return null
}

export function makeDeviceInfoLocationDraft(tokens: Record<string, string> | null): DeviceInfoLocationDraft {
  if (tokens === null) return { latitude: '', longitude: '', address: '' }
  const readCoordinate = (key: string) => {
    const token = tokens[key]
    if (token === undefined) return ''
    const value = parseJsonScalarToken(token)
    if (value === null) return ''
    if (typeof value !== 'number' || !isFiniteJsonNumberToken(token))
      throw new Error('Stored location coordinate is invalid')
    return token
  }
  const addressToken = tokens.address
  let address = ''
  if (addressToken !== undefined) {
    const value = parseJsonScalarToken(addressToken)
    if (value !== null && typeof value !== 'string') throw new Error('Stored location address is invalid')
    address = typeof value === 'string' ? value : ''
  }
  return { latitude: readCoordinate('latitude'), longitude: readCoordinate('longitude'), address }
}

export function makeDeviceInfoLocationTokens(
  draft: DeviceInfoLocationDraft,
  originalTokens: Record<string, string> | null
): Record<string, string> {
  const validationError = getDeviceInfoLocationValidationError(draft)
  if (validationError) throw new Error(validationError)
  const addressToken = JSON.stringify(draft.address)
  let sameAddress = false
  if (originalTokens?.address !== undefined)
    sameAddress = parseJsonScalarToken(originalTokens.address) === draft.address
  const preserveNullAddress =
    originalTokens?.address !== undefined &&
    parseJsonScalarToken(originalTokens.address) === null &&
    draft.address === ''
  const latitudeToken = draft.latitude.trim() === '' ? 'null' : draft.latitude
  const longitudeToken = draft.longitude.trim() === '' ? 'null' : draft.longitude
  if (latitudeToken !== 'null' && !isFiniteJsonNumberToken(latitudeToken)) throw new Error('纬度必须是有限数字')
  if (longitudeToken !== 'null' && !isFiniteJsonNumberToken(longitudeToken)) throw new Error('经度必须是有限数字')
  const tokens: Record<string, string> = Object.assign(Object.create(null), originalTokens ?? {})
  tokens.latitude = originalTokens?.latitude === latitudeToken ? originalTokens.latitude : latitudeToken
  tokens.longitude = originalTokens?.longitude === longitudeToken ? originalTokens.longitude : longitudeToken
  tokens.address = sameAddress || preserveNullAddress ? originalTokens!.address : addressToken
  return tokens
}
