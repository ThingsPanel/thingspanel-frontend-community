/**
 * 平台字段提取工具
 * 从设备模板中提取平台字段
 */

import type { PlatformField } from './types'

/**
 * 从设备模板中提取平台字段
 * @param template 设备模板数据
 * @returns 平台字段数组
 */
export function extractPlatformFields(template: any): PlatformField[] {
  const fields: PlatformField[] = []

  if (!template) return fields

  // 解析模板中的字段定义
  try {
    const normalizeField = (item: any, dataType: PlatformField['dataType']): PlatformField | null => {
      // data_identifier is the model contract. Runtime telemetry keys/DB ids are
      // only fallbacks so generated bindings remain stable across API response shapes.
      const id = item?.data_identifier || item?.identifier || item?.key || item?.id
      const name = item?.data_name || item?.name || item?.label || id
      if (!id) return null

      const additionalInfo = parseAdditionalInfo(item?.additional_info)
      const valueSchema = parseAdditionalInfo(additionalInfo?.value_schema || additionalInfo?.valueSchema)
      const options = normalizeOptions(item, valueSchema)
      const payloadType = mapDataType(item?.data_type || item?.type || valueSchema?.type)
      const writable =
        dataType === 'command' ||
        item?.writable === true ||
        String(item?.read_write_flag || item?.access || '')
          .toUpperCase()
          .includes('W')

      return {
        id: String(id),
        name: String(name || id),
        type: payloadType,
        dataType,
        unit: item?.unit,
        description: item?.description || item?.define,
        ...(options.length > 0 ? { options } : {}),
        writable,
        ...(writable
          ? {
              write: {
                target: dataType === 'command' ? 'command' : dataType,
                property: String(id),
                payloadType
              }
            }
          : {})
      }
    }

    // 遥测字段
    if (template.telemetry) {
      const telemetryData = typeof template.telemetry === 'string' ? JSON.parse(template.telemetry) : template.telemetry

      if (Array.isArray(telemetryData)) {
        telemetryData.forEach((item: any) => {
          const field = normalizeField(item, 'telemetry')
          if (field) fields.push(field)
        })
      }
    }

    // 属性字段
    if (template.attributes) {
      const attributesData =
        typeof template.attributes === 'string' ? JSON.parse(template.attributes) : template.attributes

      if (Array.isArray(attributesData)) {
        attributesData.forEach((item: any) => {
          const field = normalizeField(item, 'attribute')
          if (field) fields.push(field)
        })
      }
    }

    // 命令字段
    if (template.commands) {
      const commandsData = typeof template.commands === 'string' ? JSON.parse(template.commands) : template.commands

      if (Array.isArray(commandsData)) {
        commandsData.forEach((item: any) => {
          const field = normalizeField(item, 'command')
          if (field) fields.push(field)
        })
      }
    }

    // 事件字段
    if (template.events) {
      const eventsData = typeof template.events === 'string' ? JSON.parse(template.events) : template.events

      if (Array.isArray(eventsData)) {
        eventsData.forEach((item: any) => {
          const field = normalizeField(item, 'event')
          if (field) fields.push(field)
        })
      }
    }
  } catch (error) {
    console.error('提取平台字段失败:', error)
  }

  return fields
}

/** Preserve model enum values when a widget emits a boolean presentation value. */
export function normalizePlatformWriteValue(field: Partial<PlatformField>, value: unknown): unknown {
  if (typeof value !== 'boolean' || field.type !== 'string' || !Array.isArray(field.options)) return value
  const expected = value ? ['on', 'true', '1'] : ['off', 'false', '0']
  const option = field.options.find(item => {
    const optionValue = String(item.value).toLowerCase()
    const optionLabel = String(item.label).toLowerCase()
    return expected.includes(optionValue) || expected.includes(optionLabel)
  })
  return option?.value ?? value
}

/** Resolve a field by either its stable identifier or its display/name alias. */
export function findPlatformField(fields: unknown[], fieldId: string): PlatformField | undefined {
  return fields.find((field): field is PlatformField => {
    if (!field || typeof field !== 'object') return false
    const candidate = field as Partial<PlatformField>
    return candidate.id === fieldId || candidate.name === fieldId
  })
}

/**
 * Resolve the transport target for a field-bound control.
 *
 * Device state is normally exposed as telemetry, while a same-named command
 * performs the actual write. Prefer that command so a control does not send a
 * synthetic telemetry downlink and mistake delivery for a device state change.
 */
export function findPlatformWriteTarget(fields: unknown[], fieldId: string): PlatformField | undefined {
  const matches = fields.filter((field): field is PlatformField => {
    if (!field || typeof field !== 'object') return false
    const candidate = field as Partial<PlatformField>
    return candidate.id === fieldId || candidate.name === fieldId
  })

  return matches.find(field => field.dataType === 'command') || matches[0]
}

function parseAdditionalInfo(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeOptions(
  item: any,
  valueSchema: Record<string, any>
): Array<{ label: string; value: string | number | boolean }> {
  const params = parseAdditionalInfo(item?.params)
  const parameterSchema = Object.values(params).find(
    (value): value is Record<string, any> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  )
  const raw =
    item?.enum_config ||
    item?.enumConfig ||
    valueSchema?.enum ||
    valueSchema?.options ||
    parameterSchema?.enum ||
    parameterSchema?.options
  if (!Array.isArray(raw)) return []

  return raw.flatMap((option: any) => {
    const value = option && typeof option === 'object' && !Array.isArray(option) ? option.value : option
    if (value === undefined || value === null) return []
    const label =
      option && typeof option === 'object'
        ? option.label || option.desc || option.description || option.name || String(value)
        : String(value)
    return [{ label: String(label), value: value as string | number | boolean }]
  })
}

/**
 * 映射数据类型到 ThingsVis 支持的类型
 */
function mapDataType(type: string): 'number' | 'string' | 'boolean' | 'json' {
  if (!type) return 'string'

  const lowerType = type.toLowerCase()

  if (
    lowerType.includes('int') ||
    lowerType.includes('float') ||
    lowerType.includes('double') ||
    lowerType === 'number'
  ) {
    return 'number'
  }

  if (lowerType.includes('bool')) {
    return 'boolean'
  }

  if (lowerType.includes('json') || lowerType.includes('object') || lowerType.includes('array')) {
    return 'json'
  }

  return 'string'
}
