export type CustomFieldType = 'string' | 'number' | 'boolean' | 'enum'

export interface CustomFieldEnumValue {
  value: string
  label: string
}

export interface CustomFieldDefinition {
  key: string
  name: string
  type: CustomFieldType
  defaultValue: string | number | boolean | null
  description: string | null
  enabled: boolean
  enumValues: CustomFieldEnumValue[]
}

export interface CustomFieldChanges {
  upsert: Array<Partial<CustomFieldDefinition> & Pick<CustomFieldDefinition, 'key'>>
  remove: string[]
}

export interface CustomFieldSaveAttempt {
  templateId: string
  payload: CustomFieldChanges
  etag: string
  key: string
  previouslyUnknown: boolean
  generation: number
}

const attempts = new Map<string, CustomFieldSaveAttempt>()
let sessionIdentity: string | null = null
let sessionGeneration = 0

export function syncTemplateCustomFieldSession(loggedIn: boolean, subjectId: string, tenantId: string): boolean {
  const nextIdentity = JSON.stringify([loggedIn, subjectId, tenantId])
  if (nextIdentity === sessionIdentity) return false
  sessionIdentity = nextIdentity
  sessionGeneration += 1
  attempts.clear()
  return true
}

export function getTemplateCustomFieldSessionGeneration(): number {
  return sessionGeneration
}

export function isCurrentTemplateCustomFieldSession(generation: number): boolean {
  return sessionGeneration === generation
}

export function getTemplateCustomFieldAttempt(templateId: string): CustomFieldSaveAttempt | undefined {
  return attempts.get(templateId)
}

export function createTemplateCustomFieldAttempt(
  templateId: string,
  payload: CustomFieldChanges,
  etag: string,
  key: string,
  generation: number
): CustomFieldSaveAttempt {
  if (!isCurrentTemplateCustomFieldSession(generation)) throw new Error('Template edit session changed')
  const existing = attempts.get(templateId)
  if (existing) return existing
  const attempt = {
    templateId,
    payload: {
      upsert: payload.upsert.map(field => ({
        ...field,
        ...(field.enumValues ? { enumValues: field.enumValues.map(value => ({ ...value })) } : {})
      })),
      remove: [...payload.remove]
    },
    etag,
    key,
    previouslyUnknown: false,
    generation
  }
  attempts.set(templateId, attempt)
  return attempt
}

export function markTemplateCustomFieldUnknown(
  templateId: string,
  generation: number
): CustomFieldSaveAttempt | undefined {
  if (!isCurrentTemplateCustomFieldSession(generation)) return undefined
  const attempt = attempts.get(templateId)
  if (!attempt || attempt.generation !== generation) return undefined
  const unknownAttempt = { ...attempt, previouslyUnknown: true }
  attempts.set(templateId, unknownAttempt)
  return unknownAttempt
}

export function clearTemplateCustomFieldAttempt(templateId: string, generation: number): boolean {
  if (!isCurrentTemplateCustomFieldSession(generation)) return false
  const attempt = attempts.get(templateId)
  if (attempt?.generation === generation) attempts.delete(templateId)
  return true
}

/** Only a field explicitly changed by the editor is included; omitted fields keep their exact server value. */
export function buildCustomFieldUpsert(
  baseline: CustomFieldDefinition,
  proposed: Partial<CustomFieldDefinition>
): Partial<CustomFieldDefinition> & Pick<CustomFieldDefinition, 'key'> {
  const result: Partial<CustomFieldDefinition> & Pick<CustomFieldDefinition, 'key'> = { key: baseline.key }
  for (const field of ['name', 'type', 'defaultValue', 'description', 'enabled', 'enumValues'] as const) {
    if (!Object.prototype.hasOwnProperty.call(proposed, field)) continue
    const next = proposed[field]
    const previous = baseline[field]
    const same =
      field === 'enumValues'
        ? areEnumValuesEqual(previous as CustomFieldEnumValue[], next as CustomFieldEnumValue[])
        : Object.is(previous, next)
    if (!same) {
      ;(result as Record<string, unknown>)[field] =
        field === 'enumValues' && Array.isArray(next) ? next.map(value => ({ ...value })) : next
    }
  }
  return result
}

export function areEnumValuesEqual(left: CustomFieldEnumValue[], right: CustomFieldEnumValue[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value.value === right[index]?.value && value.label === right[index]?.label)
  )
}

export function makeCustomFieldChanges(
  upsert: Array<Partial<CustomFieldDefinition> & Pick<CustomFieldDefinition, 'key'>> = [],
  remove: string[] = []
): CustomFieldChanges {
  const upsertKeys = new Set(upsert.map(field => field.key))
  if (remove.some(key => upsertKeys.has(key)))
    throw new Error('A custom field cannot be upserted and removed in the same change')
  if (upsert.length + remove.length < 1 || upsert.length + remove.length > 100) {
    throw new Error('Custom field changes must contain between 1 and 100 fields')
  }
  return {
    upsert: upsert.map(field => ({
      ...field,
      ...(field.enumValues ? { enumValues: field.enumValues.map(value => ({ ...value })) } : {})
    })),
    remove: [...remove]
  }
}

export function makeNewCustomFieldDefinition(input: Omit<CustomFieldDefinition, 'enabled'>): CustomFieldDefinition {
  return {
    key: input.key,
    name: input.name,
    type: input.type,
    defaultValue: input.defaultValue,
    description: input.description,
    enabled: false,
    enumValues: input.enumValues.map(value => ({ ...value }))
  }
}

export function parseCustomFieldDefault(
  type: CustomFieldType,
  input: { text: string; isNull: boolean; booleanValue: boolean | null }
): string | number | boolean | null {
  if (type === 'boolean') return input.booleanValue
  if (input.isNull) return null
  if (type === 'string') return input.text
  if (type === 'number') {
    if (input.text.trim() === '') return null
    const value = Number(input.text)
    if (!Number.isFinite(value)) throw new Error('请输入有限数字；留空表示 null。')
    return value
  }
  return input.text
}

export function validateNewCustomField(
  field: CustomFieldDefinition,
  existing: CustomFieldDefinition[]
): string | undefined {
  if (!field.key || field.key.trim() !== field.key) return '请输入稳定且不含首尾空格的字段 key。'
  if (existing.some(item => item.key === field.key)) return '字段 key 已存在。'
  if (!field.name.trim()) return '请输入字段名称。'
  if (field.type === 'number' && field.defaultValue !== null && typeof field.defaultValue !== 'number')
    return '数字字段默认值无效。'
  if (field.type === 'boolean' && field.defaultValue !== null && typeof field.defaultValue !== 'boolean')
    return '布尔字段默认值无效。'
  if (field.type === 'string' && field.defaultValue !== null && typeof field.defaultValue !== 'string')
    return '字符串字段默认值无效。'
  if (field.type === 'enum') {
    const values = field.enumValues.map(item => item.value)
    if (
      values.length === 0 ||
      field.enumValues.some(item => !item.value.trim() || !item.label.trim()) ||
      new Set(values).size !== values.length
    )
      return '枚举选项的值和名称必须非空，且值需唯一。'
    if (field.defaultValue !== null && (typeof field.defaultValue !== 'string' || !values.includes(field.defaultValue)))
      return '枚举默认值必须为 null 或属于选项。'
  } else if (field.enumValues.length !== 0) {
    return '非枚举字段不能包含枚举选项。'
  }
  return undefined
}

export function templateCustomFieldErrorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' ? status : undefined
}

/** A known first conflict can be corrected; any failure after uncertainty keeps the frozen receipt. */
export function shouldRetainTemplateCustomFieldAttempt(
  status: number | undefined,
  previouslyUnknown: boolean
): boolean {
  if (previouslyUnknown) return true
  return status !== 409 && status !== 412 && status !== 422 && status !== 400
}
