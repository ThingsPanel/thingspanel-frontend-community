export interface ServiceDeviceImportDraft {
  device_number?: string
  device_name?: string
  description?: string | null
  device_config_id?: string | null
  protocol_config?: unknown
  additional_info?: unknown
}

export interface ServiceDeviceImportItem {
  device_number: string
  device_name?: string
  description?: string | null
  device_config_id?: string
  protocol_config?: string
  additional_info?: string
}

/**
 * The service-device API stores these JSON documents in nullable string fields.
 * Preserve discovery payloads whether they arrive as parsed objects or JSON text.
 */
export function serializeServiceDeviceJSONField(value: unknown, fieldName: string): string | undefined {
  if (value === null || value === undefined || value === '') return undefined

  let normalizedValue = value
  if (typeof value === 'string') {
    try {
      normalizedValue = JSON.parse(value)
    } catch {
      throw new Error(`${fieldName}不是有效的 JSON，未提交设备`)
    }
  }

  try {
    const serialized = JSON.stringify(normalizedValue)
    if (serialized === undefined) throw new Error('JSON serialization returned undefined')
    return serialized
  } catch {
    throw new Error(`${fieldName}无法转换为 JSON，未提交设备`)
  }
}

/** Build an API item while keeping the device template optional. */
export function buildServiceDeviceImportItem(
  selectedDeviceNumber: string,
  draft?: ServiceDeviceImportDraft
): ServiceDeviceImportItem {
  if (!draft) {
    throw new Error(`无法读取设备 ${selectedDeviceNumber} 的导入信息，请刷新列表后重新选择设备`)
  }

  const deviceNumber = draft.device_number || selectedDeviceNumber
  if (!draft.device_name) {
    throw new Error(`设备 ${deviceNumber} 缺少名称，请刷新列表后重新选择设备`)
  }

  return {
    device_number: deviceNumber,
    device_name: draft.device_name,
    description: draft.description,
    device_config_id: draft.device_config_id || undefined,
    protocol_config: serializeServiceDeviceJSONField(draft.protocol_config, '通信配置'),
    additional_info: serializeServiceDeviceJSONField(draft.additional_info, '附加信息')
  }
}
