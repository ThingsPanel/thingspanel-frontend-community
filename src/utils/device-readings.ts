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
  parameterIdentifier?: string
  payloadMode: 'boolean-parameter' | 'mapped-command'
  onValue?: string
  offValue?: string
}

/**
 * Resolve a strict Boolean command, or an exact on/off state backed by a
 * same-identifier command whose model explicitly declares its two actions.
 */
export function resolveStandardBooleanCommand(
  reading: DeviceReadingValue,
  commands: unknown[]
): StandardBooleanCommandBinding | null {
  if (!reading.key) return null

  const isCanonicalBoolean = isBooleanReading(reading)
  const isExplicitOnOffState = reading.value === 'on' || reading.value === 'off'
  if (!isCanonicalBoolean && !isExplicitOnOffState) return null

  for (const command of commands) {
    if (!command || typeof command !== 'object') continue
    const item = command as Record<string, unknown>
    const identifier = item.data_identifier || item.identifier || item.key
    if (String(identifier || '') !== reading.key) continue

    const rawParams = item.params ?? item.paramsOrigin
    let params: unknown = rawParams
    if (typeof rawParams === 'string') {
      if (!rawParams.trim()) params = []
      else {
        try {
          params = JSON.parse(rawParams)
        } catch {
          return null
        }
      }
    }

    const mapActionPair = (values: unknown[]): StandardBooleanCommandBinding | null => {
      if (values.length !== 2 || !values.every(value => typeof value === 'string')) return null
      const normalized = values.map(value => (value as string).trim().toLowerCase())
      const onIndex = normalized.findIndex(value => value === 'on' || value === 'turn_on')
      const offIndex = normalized.findIndex(value => value === 'off' || value === 'turn_off')
      if (onIndex < 0 || offIndex < 0 || onIndex === offIndex) return null
      return {
        identify: reading.key!,
        parameterIdentifier: 'command',
        payloadMode: 'mapped-command',
        onValue: values[onIndex] as string,
        offValue: values[offIndex] as string
      }
    }

    if (params && typeof params === 'object' && !Array.isArray(params)) {
      const entries = Object.entries(params as Record<string, unknown>)
      if (entries.length === 1 && Array.isArray(entries[0]?.[1])) {
        const mappedCommand = mapActionPair(entries[0][1] as unknown[])
        const parameterIdentifier = entries[0][0].trim()
        if (mappedCommand && parameterIdentifier && (isCanonicalBoolean || isExplicitOnOffState)) {
          return { ...mappedCommand, parameterIdentifier }
        }
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
    const parameterType = String(parameterItem.param_type || parameterItem.data_type || '')
      .trim()
      .toLowerCase()
    if (isCanonicalBoolean && parameterType !== 'boolean') return null
    if (isExplicitOnOffState) {
      const enumValues = Array.isArray(parameterItem.enum_config)
        ? parameterItem.enum_config.map((option: any) => String(option?.value ?? '').toLowerCase())
        : []
      if (
        parameterType !== 'enum' ||
        enumValues.length !== 2 ||
        !enumValues.includes('on') ||
        !enumValues.includes('off')
      ) {
        return null
      }
      const parameterIdentifier = parameterItem.data_identifier || parameterItem.identifier || parameterItem.key
      if (typeof parameterIdentifier !== 'string' || !parameterIdentifier.trim()) return null
      return {
        identify: reading.key,
        parameterIdentifier,
        payloadMode: 'mapped-command',
        onValue: 'on',
        offValue: 'off'
      }
    }
    const parameterIdentifier = parameterItem.data_identifier || parameterItem.identifier || parameterItem.key
    if (typeof parameterIdentifier !== 'string' || !parameterIdentifier.trim()) return null
    if (!isCanonicalBoolean) return null

    return {
      identify: reading.key,
      parameterIdentifier,
      payloadMode: 'boolean-parameter'
    }
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
