import type { ModelDraft, ModelField, NativeModelProfile, ResourcesDocument } from '../../../service/api/thingmodel-native-transport'
import type { PlatformField } from '../../../utils/thingsvis/types'

export const EMPTY_NATIVE_PROFILE: NativeModelProfile = {
  author: '',
  tags: [],
  cover: '',
  version: '',
  brand: '',
  modelNumber: ''
}

export const EMPTY_NATIVE_RESOURCES: ResourcesDocument = {
  profile: { ...EMPTY_NATIVE_PROFILE, tags: [] },
  webChartConfig: null,
  appChartConfig: null
}

/** Compare JSON payloads independently of object-key order while preserving array order. */
export function stableFingerprint(value: unknown): string {
  const sortObjectKeys = (current: unknown): unknown => {
    if (Array.isArray(current)) return current.map(sortObjectKeys)
    if (current !== null && typeof current === 'object') {
      return Object.fromEntries(
        Object.keys(current).sort().map(key => [key, sortObjectKeys((current as Record<string, unknown>)[key])])
      )
    }
    return current
  }

  return JSON.stringify(sortObjectKeys(value)) ?? 'undefined'
}

export function normalizeNativeProfile(value: Partial<NativeModelProfile> | null | undefined): NativeModelProfile {
  return {
    author: typeof value?.author === 'string' ? value.author : '',
    tags: Array.isArray(value?.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    cover: typeof value?.cover === 'string' ? value.cover : '',
    version: typeof value?.version === 'string' ? value.version : '',
    brand: typeof value?.brand === 'string' ? value.brand : '',
    modelNumber: typeof value?.modelNumber === 'string' ? value.modelNumber : ''
  }
}

export function normalizeResourcesDocument(value: Partial<ResourcesDocument> | null | undefined): ResourcesDocument {
  const asConfig = (config: unknown): Record<string, unknown> | null =>
    config && typeof config === 'object' && !Array.isArray(config) ? config as Record<string, unknown> : null
  return {
    profile: normalizeNativeProfile(value?.profile),
    webChartConfig: asConfig(value?.webChartConfig),
    appChartConfig: asConfig(value?.appChartConfig)
  }
}

function valueTypeFor(field: ModelField): PlatformField['type'] {
  if (!('valueType' in field) || !field.valueType) return 'json'
  const type = field.valueType
  if (type.kind === 'ENUM') return type.baseKind === 'NUMBER' ? 'number' : type.baseKind === 'BOOLEAN' ? 'boolean' : 'string'
  if (type.kind === 'INT' || type.kind === 'FLOAT' || type.kind === 'NUMBER') return 'number'
  if (type.kind === 'BOOL') return 'boolean'
  return 'string'
}

function optionsFor(field: ModelField): PlatformField['options'] {
  const type = field.valueType
  if (type?.kind === 'ENUM') return type.enumValues.map(option => ({ label: option.label.default, value: option.code }))
  if (type?.kind === 'BOOL' && type.constraint) {
    const { trueText, falseText } = type.constraint
    return [
      ...(trueText ? [{ label: trueText, value: true }] : []),
      ...(falseText ? [{ label: falseText, value: false }] : [])
    ]
  }
  return undefined
}

/** Build the complete ThingsVis field catalog directly from the native model draft. */
export function nativeModelFieldsToPlatformFields(model: ModelDraft): PlatformField[] {
  return model.fields.map(field => {
    const dataType: PlatformField['dataType'] = field.kind.toLowerCase() as PlatformField['dataType']
    const writable = field.kind === 'COMMAND' || field.access.write
    const type = valueTypeFor(field)
    return {
      id: field.identifier,
      name: field.nameI18n.default || field.identifier,
      type,
      dataType,
      ...(field.kind === 'TELEMETRY' || field.kind === 'ATTRIBUTE'
        ? field.unit ? { unit: field.unit } : {}
        : {}),
      ...(field.descriptionI18n?.default ? { description: field.descriptionI18n.default } : {}),
      ...(optionsFor(field)?.length ? { options: optionsFor(field) } : {}),
      writable,
      nativeSchema: field.kind === 'EVENT' || field.kind === 'COMMAND'
        ? { kind: field.kind, parameters: field.parameters }
        : { kind: field.kind, valueType: field.valueType },
      ...(writable ? {
        write: {
          target: field.kind === 'COMMAND' ? 'command' : field.kind === 'ATTRIBUTE' ? 'attribute' : 'telemetry',
          property: field.identifier,
          payloadType: type
        }
      } : {})
    }
  })
}
