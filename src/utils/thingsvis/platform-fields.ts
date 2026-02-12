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
            const id = item?.key || item?.data_identifier || item?.identifier || item?.id
            const name = item?.name || item?.data_name || item?.label || id
            if (!id) return null

            return {
                id,
                name: name || id,
                type: mapDataType(item?.data_type || item?.type),
                dataType,
                unit: item?.unit,
                description: item?.description || item?.define
            }
        }

        // 遥测字段
        if (template.telemetry) {
            const telemetryData =
                typeof template.telemetry === 'string' ? JSON.parse(template.telemetry) : template.telemetry

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
            const commandsData =
                typeof template.commands === 'string' ? JSON.parse(template.commands) : template.commands

            if (Array.isArray(commandsData)) {
                commandsData.forEach((item: any) => {
                    const field = normalizeField(item, 'command')
                    if (field) fields.push(field)
                })
            }
        }
    } catch (error) {
        console.error('提取平台字段失败:', error)
    }

    return fields
}

/**
 * 映射数据类型到 ThingsVis 支持的类型
 */
function mapDataType(type: string): 'number' | 'string' | 'boolean' | 'json' {
    if (!type) return 'string'

    const lowerType = type.toLowerCase()

    if (lowerType.includes('int') || lowerType.includes('float') || lowerType.includes('double') || lowerType === 'number') {
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
