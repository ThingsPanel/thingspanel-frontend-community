import { toRaw } from 'vue'
import type {
  Access,
  FieldKind,
  I18nString,
  ModelField,
  ModelFieldBase,
  Parameters,
  ValueType,
} from '../../../service/api/thingmodel-native-transport'

type LegacyRecord = Record<string, unknown>
type ScalarType = 'INT' | 'FLOAT' | 'NUMBER' | 'BOOL' | 'STRING'
type EnumBaseKind = 'STRING' | 'NUMBER' | 'BOOLEAN'
type Scalar = string | number | boolean

const legacyKindByValue: Record<string, ScalarType> = {
  String: 'STRING',
  Number: 'NUMBER',
  Boolean: 'BOOL',
}

function fail(message: string): never {
  throw new Error(`Cannot map ThingModel field: ${message}`)
}

function record(value: unknown, label: string): LegacyRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return fail(`${label} must be an object`)
  return value as LegacyRecord
}

function optionalRecord(value: unknown): LegacyRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as LegacyRecord : undefined
}

function clone<T>(value: T): T {
  if (value === undefined || value === null) return value
  return structuredClone(toRaw(value))
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string') return fail(`${label} must be a string`)
  return value
}

function i18nText(value: unknown, label: string): I18nString {
  const source = record(value, label)
  if (typeof source.default !== 'string') return fail(`${label}.default must be a string`)
  if (source.locales !== undefined && (source.locales === null || typeof source.locales !== 'object' || Array.isArray(source.locales))) {
    return fail(`${label}.locales must be a string map`)
  }
  if (source.locales !== undefined && Object.entries(source.locales as Record<string, unknown>).some(([, localeText]) => typeof localeText !== 'string')) {
    return fail(`${label}.locales values must be strings`)
  }
  return clone(source) as unknown as I18nString
}

function mergedI18n(existing: unknown, current: unknown, label: string): I18nString | null | undefined {
  const prior = existing === undefined || existing === null ? undefined : i18nText(existing, label)
  if (current === undefined) return prior
  const currentText = text(current, label)
  if (prior && currentText === prior.default) return prior
  if (currentText === '') return prior ? null : undefined
  return { ...(prior ?? {}), default: currentText }
}

function nativeAccess(value: unknown): Access {
  const access = record(value, 'access')
  if (['read', 'write', 'observe'].some(key => typeof access[key] !== 'boolean')) {
    return fail('access.read, access.write and access.observe must be booleans')
  }
  return { read: access.read as boolean, write: access.write as boolean, observe: access.observe as boolean }
}

function scalarKindFromLegacy(value: unknown, stored?: unknown): ScalarType {
  const label = text(value, 'data_type')
  const storedKind = optionalRecord(stored)?.kind
  if (label === 'Enum') return 'STRING'
  const expected = legacyKindByValue[label]
  if (!expected) return fail(`unsupported data_type ${JSON.stringify(label)}`)
  if ((label === 'Number') && ['INT', 'FLOAT', 'NUMBER'].includes(String(storedKind))) return storedKind as ScalarType
  if (storedKind === expected) return expected
  return expected
}

function enumBase(value: unknown): EnumBaseKind {
  if (value === 'Number') return 'NUMBER'
  if (value === 'Boolean') return 'BOOLEAN'
  if (value === 'String') return 'STRING'
  return fail(`unsupported enum value_type ${JSON.stringify(value)}`)
}

function scalarMatches(base: EnumBaseKind, value: unknown): value is Scalar {
  if (base === 'NUMBER') return typeof value === 'number' && Number.isFinite(value)
  if (base === 'BOOLEAN') return typeof value === 'boolean'
  return typeof value === 'string'
}

function validateValueType(value: unknown, label: string): ValueType {
  const candidate = record(value, label)
  const kind = candidate.kind
  for (const key of Object.keys(candidate)) {
    if (!['kind', 'constraint', 'baseKind', 'enumValues'].includes(key)) fail(`${label} has unsupported property ${JSON.stringify(key)}`)
  }
  if (kind === 'ENUM') {
    if (candidate.constraint !== undefined) fail(`${label}.constraint is not allowed for ENUM`)
    if (!['STRING', 'NUMBER', 'BOOLEAN'].includes(String(candidate.baseKind))) fail(`${label}.baseKind is unsupported`)
    if (!Array.isArray(candidate.enumValues) || candidate.enumValues.length === 0) fail(`${label}.enumValues must be non-empty`)
    for (const [index, raw] of candidate.enumValues.entries()) {
      const option = record(raw, `${label}.enumValues[${index}]`)
      if (Object.keys(option).some(key => key !== 'code' && key !== 'label')) fail(`${label}.enumValues[${index}] has unsupported properties`)
      if (!scalarMatches(candidate.baseKind as EnumBaseKind, option.code)) fail(`${label}.enumValues[${index}].code has the wrong scalar type`)
      i18nText(option.label, `${label}.enumValues[${index}].label`)
    }
    return clone(candidate) as ValueType
  }
  if (!['INT', 'FLOAT', 'NUMBER', 'BOOL', 'STRING'].includes(String(kind))) return fail(`${label}.kind is unsupported`)
  if (candidate.baseKind !== undefined || candidate.enumValues !== undefined) fail(`${label} scalar kind cannot carry enum properties`)
  if (candidate.constraint !== undefined) {
    const constraint = record(candidate.constraint, `${label}.constraint`)
    const allowed = kind === 'INT' || kind === 'FLOAT' || kind === 'NUMBER'
      ? ['min', 'max', 'step', 'precision']
      : kind === 'STRING' ? ['pattern', 'maxLength'] : ['trueText', 'falseText']
    for (const [key, item] of Object.entries(constraint)) {
      if (!allowed.includes(key)) fail(`${label}.constraint has unsupported property ${JSON.stringify(key)}`)
      if (['min', 'max', 'step', 'precision', 'maxLength'].includes(key) && (typeof item !== 'number' || !Number.isFinite(item))) fail(`${label}.constraint.${key} must be a finite number`)
      if (['pattern', 'trueText', 'falseText'].includes(key) && typeof item !== 'string') fail(`${label}.constraint.${key} must be a string`)
    }
  }
  return clone(candidate) as ValueType
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (typeof value === 'string') {
    try { value = JSON.parse(value) } catch { return fail(`${label} must be valid JSON`) }
  }
  if (!Array.isArray(value)) return fail(`${label} must be an array`)
  return value
}

function legacyEnumValues(rowsValue: unknown, existing?: unknown): Extract<ValueType, { kind: 'ENUM' }> {
  const rows = arrayValue(rowsValue, 'Enum rows')
  if (rows.length === 0) return fail('Enum fields require at least one enum row')
  const prior = optionalRecord(existing)
  const priorValues = prior?.kind === 'ENUM' && Array.isArray(prior.enumValues) ? prior.enumValues : []
  const values = rows.map((raw, index) => {
    const row = record(raw, `additional_info[${index}]`)
    rejectUnknown(row, new Set(['value_type', 'value', 'description', 'label']), `additional_info[${index}]`)
    const baseKind = enumBase(row.value_type)
    if (!scalarMatches(baseKind, row.value)) return fail(`additional_info[${index}].value does not match ${row.value_type}`)
    const previous = priorValues[index]
    const hiddenLabel = optionalRecord(row.label)
    const label = hiddenLabel?.default === row.description
      ? i18nText(hiddenLabel, `additional_info[${index}].label`)
      : mergedI18n(hiddenLabel, row.description, `additional_info[${index}].label`)
    return { baseKind, code: row.value as Scalar, label: label ?? { default: '' }, previous }
  })
  const baseKind = values[0].baseKind
  if (values.some(row => row.baseKind !== baseKind)) return fail('enum rows must use one consistent scalar type')
  return {
    kind: 'ENUM',
    baseKind,
    enumValues: values.map(row => ({ code: row.code, label: row.label })) as Extract<ValueType, { kind: 'ENUM' }>['enumValues'],
  }
}

const parentAllowed = new Set([
  'id', 'fieldID', 'sortOrder', 'kind', 'type', 'device_template_id', 'created_at', 'updated_at',
  'data_name', 'data_identifier', 'data_type', 'unit', 'read_write_flag', 'description',
  'description_i18n', 'name_i18n', 'value_type', 'access', 'additional_info', 'params', 'paramsOrigin',
])
const parameterAllowed = new Set([
  'id', 'data_identifier', 'data_name', 'data_type', 'param_type', 'read_write_flag',
  'description', 'description_i18n', 'name', 'value_type', 'unit', 'enum_config', 'label',
])

function rejectUnknown(source: LegacyRecord, allowed: Set<string>, label: string): void {
  for (const key of Object.keys(source)) if (!allowed.has(key)) fail(`unsupported ${label} field ${JSON.stringify(key)}`)
}

function parameterFromForm(kind: FieldKind, raw: unknown, index: number): Parameters['items'][number] {
  const item = record(raw, `params[${index}]`)
  rejectUnknown(item, parameterAllowed, `params[${index}]`)
  const identifier = text(item.data_identifier, `params[${index}].data_identifier`)
  if (!identifier) return fail(`params[${index}].data_identifier is required`)
  const name = text(item.data_name, `params[${index}].data_name`)
  const descriptionI18n = mergedI18n(item.description_i18n, item.description, `params[${index}].description_i18n`)
  const typeValue = kind === 'COMMAND' ? item.param_type : item.read_write_flag
  let valueType: ValueType
  if (typeValue === 'Enum') {
    const configs = arrayValue(item.enum_config, `params[${index}].enum_config`).map((raw, enumIndex) => {
      const config = record(raw, `params[${index}].enum_config[${enumIndex}]`)
      rejectUnknown(config, new Set(['value', 'desc', 'label']), `params[${index}].enum_config[${enumIndex}]`)
      return {
        value_type: item.data_type,
        value: config.value,
        description: config.desc,
        label: config.label,
      }
    })
    const enumType = legacyEnumValues(configs, item.value_type === undefined ? undefined : validateValueType(item.value_type, `params[${index}].value_type`))
    const dataType = item.data_type
    if (enumType.baseKind !== enumBase(dataType)) return fail(`params[${index}].enum_config conflicts with data_type`)
    valueType = enumType
  } else {
    valueType = { kind: scalarKindFromLegacy(typeValue, item.value_type) }
    const stored = item.value_type === undefined ? undefined : optionalRecord(validateValueType(item.value_type, `params[${index}].value_type`))
    if (stored && stored.kind === valueType.kind) valueType = clone(stored) as ValueType
  }
  if (item.unit !== undefined && item.unit !== null && item.unit !== '') return fail(`params[${index}].unit cannot be represented because Parameters has no unit field`)
  valueType = validateValueType(valueType, `params[${index}].value_type`)
  const native: Parameters['items'][number] = {
    identifier,
    nameI18n: mergedI18n(item.name, name, `params[${index}].name`) ?? { default: name },
    valueType,
  }
  if (descriptionI18n !== undefined) native.descriptionI18n = descriptionI18n
  return native
}

function parametersFromForm(kind: FieldKind, form: LegacyRecord): Parameters {
  if (form.params === undefined && form.paramsOrigin === undefined) return { schemaVersion: 1, items: [] }
  const rows = arrayValue(form.params ?? form.paramsOrigin, 'params')
  return { schemaVersion: 1, items: rows.map((item, index) => parameterFromForm(kind, item, index)) }
}

function nativeParameterToForm(kind: FieldKind, item: Parameters['items'][number], index: number): LegacyRecord {
  const valueType = validateValueType(item.valueType, `parameters.items[${index}].valueType`)
  let legacyType: string
  if (valueType.kind === 'ENUM') {
    legacyType = 'Enum'
  } else if (valueType.kind === 'INT' || valueType.kind === 'FLOAT' || valueType.kind === 'NUMBER') legacyType = 'Number'
  else if (valueType.kind === 'BOOL') legacyType = 'Boolean'
  else if (valueType.kind === 'STRING') legacyType = 'String'
  else return fail(`unsupported parameter kind ${JSON.stringify((valueType as { kind: string }).kind)}`)
  const row: LegacyRecord = {
    id: item.identifier,
    data_identifier: item.identifier,
    data_name: item.nameI18n.default,
    name: clone(item.nameI18n),
    description: item.descriptionI18n?.default ?? '',
    description_i18n: clone(item.descriptionI18n),
    value_type: valueType,
    param_type: legacyType,
    read_write_flag: legacyType,
    data_type: legacyType,
  }
  if (valueType.kind === 'ENUM') {
    row.data_type = valueType.baseKind === 'NUMBER' ? 'Number' : valueType.baseKind === 'BOOLEAN' ? 'Boolean' : 'String'
    row.enum_config = valueType.enumValues.map(({ code, label }) => ({ value: code, desc: label.default, label: clone(label) }))
  }
  return row
}

export function toNativeField(kind: FieldKind, oldForm: unknown): ModelField {
  const form = record(oldForm, 'form')
  rejectUnknown(form, parentAllowed, 'form')
  for (const explicitKind of [form.kind, form.type]) {
    if (explicitKind !== undefined && explicitKind !== kind) return fail(`form kind conflicts with requested ${kind}`)
  }
  const identifier = text(form.data_identifier, 'data_identifier')
  if (!identifier) return fail('data_identifier is required')
  const name = text(form.data_name, 'data_name')
  if (!name) return fail('data_name is required')
  const nativeBase: Omit<ModelFieldBase, 'access'> = {
    identifier,
    nameI18n: mergedI18n(form.name_i18n, name, 'name_i18n') ?? { default: name },
  }
  if (form.fieldID !== undefined) nativeBase.fieldID = text(form.fieldID, 'fieldID')
  if (form.sortOrder !== undefined) {
    if (typeof form.sortOrder !== 'number' || !Number.isFinite(form.sortOrder)) return fail('sortOrder must be a finite number')
    nativeBase.sortOrder = form.sortOrder
  }
  const description = mergedI18n(form.description_i18n, form.description, 'description_i18n')
  if (description !== undefined) nativeBase.descriptionI18n = description

  if (kind === 'EVENT' || kind === 'COMMAND') {
    if (form.data_type !== undefined && form.data_type !== '') return fail(`${kind} does not support scalar data_type`)
    if (form.additional_info !== undefined && arrayValue(form.additional_info, 'additional_info').length) return fail(`${kind} does not support scalar additional_info`)
    const access = form.access === undefined
      ? kind === 'EVENT'
        ? { read: false, write: false, observe: true }
        : { read: false, write: true, observe: false }
      : nativeAccess(form.access)
    return { ...nativeBase, kind, access, parameters: parametersFromForm(kind, form) }
  }

  const readWrite = form.read_write_flag
  if (readWrite !== 'R' && readWrite !== 'RW' && readWrite !== 'R-只读' && readWrite !== 'RW-读/写') {
    return fail('read_write_flag must be R or RW')
  }
  const access: Access = form.access === undefined
    ? { read: true, write: readWrite === 'RW' || readWrite === 'RW-读/写', observe: false }
      : clone(record(form.access, 'access')) as unknown as Access
  if (access.read !== true || typeof access.write !== 'boolean' || typeof access.observe !== 'boolean') {
    return fail('the existing scalar editor requires access.read=true and boolean write/observe values')
  }
  access.write = readWrite === 'RW' || readWrite === 'RW-读/写'

  const dataType = text(form.data_type, 'data_type')
  const previousValueType = form.value_type === undefined ? undefined : optionalRecord(validateValueType(form.value_type, 'value_type'))
  let valueType: ValueType
  if (dataType === 'Enum') valueType = legacyEnumValues(form.additional_info, previousValueType)
  else {
    if (form.additional_info !== undefined) {
      if (arrayValue(form.additional_info, 'additional_info').length) return fail('additional_info is only supported for Enum fields')
    }
    valueType = { kind: scalarKindFromLegacy(dataType, previousValueType) }
    if (previousValueType?.kind === valueType.kind) valueType = clone(previousValueType) as ValueType
  }
  valueType = validateValueType(valueType, 'value_type')
  if (optionalRecord(previousValueType?.constraint)?.unit !== undefined) return fail('unit must be stored only in field.unit')
  if (form.unit !== undefined && form.unit !== null && text(form.unit, 'unit') !== '') nativeBase.unit = text(form.unit, 'unit')
  return { ...nativeBase, kind, access, valueType }
}

/** Remove explicit editor-only state before applying the strict legacy-form mapper. */
export function toNativeFieldFromEditor(kind: FieldKind, editorForm: unknown): ModelField {
  const source = record(editorForm, 'editor form')
  const { enum_base: _enumBase, ...legacyForm } = source
  return toNativeField(kind, legacyForm)
}

function nativeEnumToLegacyRows(valueType: Extract<ValueType, { kind: 'ENUM' }>): LegacyRecord[] {
  return valueType.enumValues.map(({ code, label }) => {
    const row: LegacyRecord = {
      value_type: valueType.baseKind === 'NUMBER' ? 'Number' : valueType.baseKind === 'BOOLEAN' ? 'Boolean' : 'String',
      value: code,
      description: label.default,
      label: clone(label),
    }
    return row
  })
}

export function fromNativeField(fieldValue: ModelField): LegacyRecord {
  record(fieldValue, 'native field')
  const field = fieldValue
  const kind = field.kind as FieldKind
  if (!['TELEMETRY', 'ATTRIBUTE', 'EVENT', 'COMMAND'].includes(kind)) return fail(`unsupported kind ${JSON.stringify(field.kind)}`)
  const identifier = text(field.identifier, 'identifier')
  const nameI18n = i18nText(field.nameI18n, 'nameI18n')
  const descriptionI18n = field.descriptionI18n == null ? undefined : i18nText(field.descriptionI18n, 'descriptionI18n')
  const stableKey = field.fieldID || `${kind}:${identifier}`
  const form: LegacyRecord = {
    id: stableKey,
    fieldID: field.fieldID,
    kind,
    type: kind,
    sortOrder: field.sortOrder,
    data_identifier: identifier,
    data_name: nameI18n.default,
    name_i18n: clone(nameI18n),
    description: descriptionI18n?.default ?? '',
    description_i18n: clone(descriptionI18n),
  }
  if (field.fieldID === undefined) delete form.fieldID

  if (kind === 'TELEMETRY' || kind === 'ATTRIBUTE') {
    const valueType = validateValueType(field.valueType, 'valueType')
    form.value_type = clone(valueType)
    form.access = clone(field.access)
    form.read_write_flag = field.access.write ? 'RW' : 'R'
    if (field.unit !== undefined && field.unit !== null && typeof field.unit !== 'string') return fail('unit must be a string or null')
    if (field.unit !== undefined) form.unit = field.unit
    if (valueType.kind === 'ENUM') {
      form.data_type = 'Enum'
      form.additional_info = nativeEnumToLegacyRows(valueType)
    } else if (valueType.kind === 'INT' || valueType.kind === 'FLOAT' || valueType.kind === 'NUMBER') form.data_type = 'Number'
    else if (valueType.kind === 'BOOL') form.data_type = 'Boolean'
    else if (valueType.kind === 'STRING') form.data_type = 'String'
    else return fail(`unsupported scalar kind ${JSON.stringify((valueType as { kind: string }).kind)}`)
    if (valueType.kind !== 'ENUM') form.additional_info = []
    return form
  }

  if (field.valueType !== undefined) return fail(`${kind} must not have scalar valueType`)
  if (!field.parameters || field.parameters.schemaVersion !== 1 || !Array.isArray(field.parameters.items)) {
    return fail(`${kind} requires version 1 flat parameters`)
  }
  form.access = nativeAccess(field.access)
  form.params = JSON.stringify(field.parameters.items.map((item, index) => nativeParameterToForm(kind, item, index)))
  form.paramsOrigin = form.params
  return form
}
