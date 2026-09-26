type TelemetryEnumItem = {
  value_type?: string
  value: string | number | boolean
  description?: string
}

export interface DeviceReadingValue {
  key?: string
  label?: string | null
  value: string | number | boolean | Record<string, unknown> | null | undefined
  data_type?: string
  enum?: TelemetryEnumItem[]
}

export interface StandardBooleanCommandBinding {
  identify: string
  parameterIdentifier: string
}

/**
 * Resolve only an explicit, one-Boolean-parameter command for a Boolean model
 * field. A switch must never guess command payloads from incoming telemetry.
 */
export function resolveStandardBooleanCommand(
  reading: DeviceReadingValue,
  commands: unknown[]
): StandardBooleanCommandBinding | null {
  if (!reading.key || !isBooleanReading(reading)) return null

  for (const command of commands) {
    if (!command || typeof command !== 'object') continue
    const item = command as Record<string, unknown>
    const identifier = item.data_identifier || item.identifier || item.key
    if (String(identifier || '') !== reading.key) continue

    const rawParams = item.params ?? item.paramsOrigin
    let params: unknown = rawParams
    if (typeof rawParams === 'string') {
      try {
        params = JSON.parse(rawParams)
      } catch {
        return null
      }
    }
    const parameterList = Array.isArray(params)
      ? params
      : params && typeof params === 'object'
        ? Object.values(params as Record<string, unknown>)
        : []
    if (parameterList.length !== 1) return null

    const parameter = parameterList[0]
    if (!parameter || typeof parameter !== 'object') return null
    const parameterItem = parameter as Record<string, unknown>
    if (
      String(parameterItem.param_type || parameterItem.data_type || '')
        .trim()
        .toLowerCase() !== 'boolean'
    ) {
      return null
    }
    const parameterIdentifier = parameterItem.data_identifier || parameterItem.identifier || parameterItem.key
    if (typeof parameterIdentifier !== 'string' || !parameterIdentifier.trim()) return null

    return { identify: reading.key, parameterIdentifier }
  }

  return null
}

function valuesMatch(option: TelemetryEnumItem, value: unknown) {
  switch (option.value_type?.toLowerCase()) {
    case 'number':
      return Number(option.value) === Number(value)
    case 'boolean':
      return String(option.value).toLowerCase() === String(value).toLowerCase()
    default:
      return String(option.value) === String(value)
  }
}

export function isBooleanReading(reading: DeviceReadingValue) {
  return reading.data_type?.trim().toLowerCase() === 'boolean' && typeof reading.value === 'boolean'
}

export function getBooleanReadingState(reading: DeviceReadingValue): boolean | null {
  return isBooleanReading(reading) ? (reading.value as boolean) : null
}

export function getReadingDisplayValue(reading: DeviceReadingValue) {
  if (reading.value === null || reading.value === undefined || reading.value === '') return '--'
  if (Array.isArray(reading.enum)) {
    const matched = reading.enum.find(option => valuesMatch(option, reading.value))
    if (matched?.description) return matched.description
  }
  if (typeof reading.value === 'object') return JSON.stringify(reading.value)
  return String(reading.value)
}

export function getCompactReadingDisplayValue(reading: DeviceReadingValue) {
  if (!isBooleanReading(reading)) return getReadingDisplayValue(reading)
  const state = getBooleanReadingState(reading)
  return state === null ? getReadingDisplayValue(reading) : state ? '1' : '0'
}

export function isNumericReading(reading: DeviceReadingValue) {
  if (isBooleanReading(reading)) {
    return false
  }
  const dataType = reading.data_type?.toLowerCase() || ''
  if (
    ['number', 'numeric', 'integer', 'int', 'float', 'double', 'long', 'decimal'].some(type => dataType.includes(type))
  ) {
    return true
  }
  return typeof reading.value === 'number'
}

export function isDisplayableReading(reading: DeviceReadingValue) {
  const key = reading.key?.trim().toLowerCase() || ''
  if (['device_id', 'device_number', 'device_name', 'tenant_id', 'values'].includes(key)) return false
  if (key.startsWith('_') && !reading.label?.trim()) return false
  return true
}
