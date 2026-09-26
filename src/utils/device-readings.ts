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
  const dataType = reading.data_type?.toLowerCase() || ''
  if (dataType.includes('bool')) return true
  if (typeof reading.value === 'boolean') return true
  if (
    typeof reading.value === 'string' &&
    ['on', 'off', 'open', 'opened', 'close', 'closed'].includes(reading.value.trim().toLowerCase())
  ) {
    return true
  }

  return Boolean(
    reading.enum?.length === 2 && reading.enum.every(option => option.value_type?.toLowerCase() === 'boolean')
  )
}

export function getBooleanReadingState(reading: DeviceReadingValue): boolean | null {
  const value = reading.value
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'on', 'yes', 'open', 'opened'].includes(normalized)) return true
    if (['false', '0', 'off', 'no', 'close', 'closed'].includes(normalized)) return false
  }
  return null
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
    if (typeof reading.value === 'boolean') return true
    if (typeof reading.value === 'number') return reading.value === 0 || reading.value === 1
    return typeof reading.value === 'string' && ['0', '1'].includes(reading.value.trim())
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
