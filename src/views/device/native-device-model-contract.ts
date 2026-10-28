import type { DeviceConfigNativeBinding } from '../../service/api/native-template-binding'
import type { ModelDraft, SnapshotDetail } from '../../service/api/thingmodel-native-transport'
import type { PlatformField } from '../../utils/thingsvis/types'
import { nativeModelFieldsToPlatformFields } from './template/native-model-resources'

export function hasNativeDeviceBinding(binding: DeviceConfigNativeBinding | null | undefined) {
  return Boolean(
    binding &&
      (binding.native_thing_model_id != null ||
        binding.native_thing_model_snapshot_id != null ||
        binding.native_thing_model_revision != null)
  )
}

export function deviceBindingRequiresNativeModel(binding: DeviceConfigNativeBinding | null | undefined) {
  return hasNativeDeviceBinding(binding) || Boolean(binding?.device_template_id?.trim())
}

export function assertCompleteNativeDeviceBinding(binding: DeviceConfigNativeBinding | null | undefined) {
  const modelID = binding?.native_thing_model_id?.trim()
  const snapshotID = binding?.native_thing_model_snapshot_id?.trim()
  const revision = Number(binding?.native_thing_model_revision)
  const bindingRevision = Number(binding?.native_binding_revision)
  if (binding?.device_template_id?.trim()) {
    throw new Error('Native thing model binding cannot be combined with a legacy device template')
  }
  if (
    !modelID ||
    !snapshotID ||
    !Number.isInteger(revision) ||
    revision < 1 ||
    !Number.isInteger(bindingRevision) ||
    bindingRevision < 1
  ) {
    throw new Error('Device template has an incomplete native thing model binding')
  }
  return { modelID, snapshotID, revision, bindingRevision }
}

export function assertDeviceSnapshotMatchesBinding(
  binding: DeviceConfigNativeBinding | null | undefined,
  snapshot: SnapshotDetail
) {
  const { modelID, snapshotID, revision } = assertCompleteNativeDeviceBinding(binding)
  if (snapshot.modelID !== modelID || snapshot.snapshotID !== snapshotID || snapshot.publishedRevision !== revision) {
    throw new Error('Bound thing model snapshot does not match the device template binding')
  }
}

export function nativeDevicePlatformFields(model: ModelDraft): PlatformField[] {
  // Native device writes go through COMMAND; even writable ATTRIBUTE metadata is read-only here.
  return nativeModelFieldsToPlatformFields(model).map(field => {
    if (field.dataType === 'command') return field
    const { writable: _writable, write: _write, ...readOnlyField } = field
    return { ...readOnlyField, writable: false }
  })
}

function fieldTypeName(type: PlatformField['type'], isEnum: boolean) {
  if (isEnum) return 'Enum'
  if (type === 'number') return 'Number'
  if (type === 'boolean') return 'Boolean'
  if (type === 'json') return 'JSON'
  return 'String'
}

function identifierFromRow(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return ''
}

function clearRawFieldMetadata<T extends Record<string, any>>(row: T) {
  const decorated = { ...row }
  // These values may have come from legacy templates. A native-bound device
  // must never display them when its pinned snapshot has no matching field.
  for (const key of ['data_name', 'unit', 'data_type', 'type', 'enum', 'enum_config', 'options', 'enum_label']) {
    delete decorated[key]
  }
  return decorated
}

function enumLabel(field: PlatformField, value: unknown) {
  return field.options?.find(option => option.value === value)?.label
}

/** Keep raw values untouched; all three telemetry views share this metadata. */
export function decorateNativeTelemetryRows<T extends Record<string, any>>(rows: T[], fields: PlatformField[]) {
  const metadata = new Map(fields.filter(field => field.dataType === 'telemetry').map(field => [field.id, field]))
  return rows.map(row => {
    const field = metadata.get(row.key)
    const options = field?.options || []
    return {
      ...clearRawFieldMetadata(row),
      label: field ? field.name : `${row.key}（绑定版本未定义）`,
      unit: field?.unit || '',
      data_type: field ? fieldTypeName(field.type, options.length > 0) : '',
      enum: options.map(option => ({
        value_type: field?.type,
        value: option.value,
        description: option.label
      })),
      nativeMetadataSource: 'native' as const
    }
  })
}

/** Decorate raw attribute values only from the pinned native ATTRIBUTE fields. */
export function decorateNativeAttributeRows(
  rows: Record<string, any>[],
  fields: PlatformField[]
): Record<string, any>[] {
  const metadata = new Map(fields.filter(field => field.dataType === 'attribute').map(field => [field.id, field]))
  return rows.map(row => {
    const identifier = identifierFromRow(row, ['key', 'data_identifier', 'identifier'])
    const decorated = clearRawFieldMetadata(row)
    const field = metadata.get(identifier)
    if (!field) {
      return { ...decorated, key: identifier, data_name: identifier, nativeMetadataSource: 'native' as const }
    }
    const options = field.options?.map(option => ({ label: option.label, value: option.value }))
    const resolvedEnumLabel = enumLabel(field, row.value)
    return {
      ...decorated,
      key: identifier,
      data_identifier: identifier,
      data_name: field.name || identifier,
      unit: field.unit || '',
      data_type: fieldTypeName(field.type, Boolean(options?.length)),
      ...(options?.length
        ? {
            enum: options,
            enum_config: options.map(option => ({ value: option.value, desc: option.label }))
          }
        : {}),
      ...(resolvedEnumLabel !== undefined ? { enum_label: resolvedEnumLabel } : {}),
      nativeMetadataSource: 'native' as const
    }
  })
}

type NativeEventParameter = {
  identifier: string
  nameI18n?: { default?: string }
  valueType?: { kind?: string; baseKind?: string; enumValues?: Array<{ code: unknown; label?: { default?: string } }> }
}

function eventParameterLabel(parameter: NativeEventParameter, value: unknown) {
  const type = parameter.valueType
  if (type?.kind !== 'ENUM') return value
  const match = type.enumValues?.find(option => option.code === value)
  return match?.label?.default ?? value
}

function formatNativeEventData(value: unknown, parameters: NativeEventParameter[]) {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return value
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return value
  const parameterMap = new Map(parameters.map(parameter => [parameter.identifier, parameter]))
  const entries = Object.entries(parsed as Record<string, unknown>)
  const inputKeys = new Set(entries.map(([key]) => key))
  const usedKeys = new Set<string>()
  const display: Record<string, unknown> = {}
  for (const [key, item] of entries) {
    const parameter = parameterMap.get(key)
    const base = parameter ? `${parameter.nameI18n?.default || parameter.identifier} [${parameter.identifier}]` : key
    let displayKey = base
    let suffix = 2
    while (usedKeys.has(displayKey) || (displayKey !== key && inputKeys.has(displayKey))) {
      displayKey = `${base} #${suffix++}`
    }
    usedKeys.add(displayKey)
    display[displayKey] = parameter ? eventParameterLabel(parameter, item) : item
  }
  return JSON.stringify(display)
}

/** Decorate event names and payload parameters only from pinned native EVENT fields. */
export function decorateNativeEventRows(rows: Record<string, any>[], fields: PlatformField[]): Record<string, any>[] {
  const metadata = new Map(fields.filter(field => field.dataType === 'event').map(field => [field.id, field]))
  return rows.map(row => {
    const identifier = identifierFromRow(row, ['identify', 'key', 'data_identifier', 'identifier'])
    const decorated = clearRawFieldMetadata(row)
    const field = metadata.get(identifier)
    if (!field) {
      return {
        ...decorated,
        identify: identifier,
        data_name: identifier,
        data_display: row.data,
        nativeMetadataSource: 'native' as const
      }
    }
    const parameters = (field.nativeSchema?.parameters as { items?: NativeEventParameter[] } | undefined)?.items || []
    return {
      ...decorated,
      identify: identifier,
      data_name: field.name || identifier,
      event_parameters: parameters.map(parameter => ({
        identifier: parameter.identifier,
        name: parameter.nameI18n?.default || parameter.identifier,
        type: parameter.valueType?.kind || 'JSON',
        ...(parameter.valueType?.kind === 'ENUM'
          ? {
              enum: (parameter.valueType.enumValues || []).map(option => ({
                value: option.code,
                label: option.label?.default || String(option.code)
              }))
            }
          : {})
      })),
      data_display: formatNativeEventData(row.data, parameters),
      nativeMetadataSource: 'native' as const
    }
  })
}

export function formatNativeAttributeValue(row: Record<string, any>) {
  if (row.nativeMetadataSource !== 'native') return undefined
  if (row.enum_label !== undefined) return row.enum_label
  return `${row.value ?? ''}${row.unit || ''}`
}

export function nativeCommandOptions(model: ModelDraft) {
  return nativeModelFieldsToPlatformFields(model)
    .filter(field => field.dataType === 'command')
    .map(field => {
      const params = (field.nativeSchema?.parameters as { items?: Array<any> } | undefined)?.items || []
      return {
        data_name: field.name,
        data_identifier: field.id,
        params: JSON.stringify(
          params.map(parameter => {
            const valueType = parameter.valueType
            const paramType =
              valueType?.kind === 'ENUM'
                ? 'Enum'
                : valueType?.kind === 'BOOL'
                  ? 'Boolean'
                  : ['INT', 'FLOAT', 'NUMBER'].includes(valueType?.kind)
                    ? 'Number'
                    : 'String'
            return {
              id: parameter.identifier,
              data_name: parameter.nameI18n?.default || parameter.identifier,
              data_identifier: parameter.identifier,
              param_type: valueType?.kind === 'STRING' ? 'string' : paramType,
              data_type: valueType?.kind === 'ENUM' ? valueType.baseKind : paramType,
              description: parameter.descriptionI18n?.default || '',
              enum_config:
                valueType?.kind === 'ENUM'
                  ? valueType.enumValues.map((option: any) => ({ value: option.code, desc: option.label.default }))
                  : []
            }
          })
        )
      }
    })
}
