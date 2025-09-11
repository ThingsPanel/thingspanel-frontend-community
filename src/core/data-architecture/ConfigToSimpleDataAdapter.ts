/**
 * 配置转换适配器
 * 将现有的复杂配置格式转换为SimpleDataBridge需要的简化格式
 */

import type { ComponentDataRequirement, SimpleDataSourceConfig } from '@/core/data-architecture/SimpleDataBridge'

/**
 * 将复杂的数据源配置转换为简化格式
 * @param componentId 组件ID
 * @param config 原始配置对象
 * @returns 简化的组件数据需求
 */
export function convertToSimpleDataRequirement(componentId: string, config: any): ComponentDataRequirement | null {
  if (!config) {
    return null
  }

  const dataSources: SimpleDataSourceConfig[] = []

  // 处理 dataSourceBindings 格式 (来自 ConfigurationPanel)
  if (config.dataSourceBindings) {
    console.log(`📋 [ConfigAdapter] 处理 dataSourceBindings 格式`)

    Object.entries(config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
      if (binding && binding.rawData) {
        try {
          // 解析rawData
          const parsedData = JSON.parse(binding.rawData)

          dataSources.push({
            id: key,
            type: 'static',
            config: {
              data: parsedData
            }
          })

          console.log(`✅ [ConfigAdapter] 转换数据源: ${key}`)
        } catch (error) {
          console.error(`❌ [ConfigAdapter] 解析rawData失败: ${key}`, error)
        }
      }
    })
  }

  // 处理直接的 config.dataSourceBindings 格式
  if (config.config?.dataSourceBindings) {
    console.log(`📋 [ConfigAdapter] 处理嵌套 dataSourceBindings 格式`)

    Object.entries(config.config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
      if (binding && binding.rawData) {
        try {
          const parsedData = JSON.parse(binding.rawData)

          dataSources.push({
            id: key,
            type: 'static',
            config: {
              data: parsedData
            }
          })

          console.log(`✅ [ConfigAdapter] 转换嵌套数据源: ${key}`)
        } catch (error) {
          console.error(`❌ [ConfigAdapter] 解析嵌套rawData失败: ${key}`, error)
        }
      }
    })
  }

  // 处理简单对象格式
  if (
    typeof config === 'object' &&
    !Array.isArray(config) &&
    !config.type &&
    !config.dataSourceBindings &&
    !config.config
  ) {
    console.log(`📋 [ConfigAdapter] 处理简单对象格式`)

    dataSources.push({
      id: 'main',
      type: 'static',
      config: {
        data: config
      }
    })
  }

  if (dataSources.length === 0) {
    console.warn(`⚠️ [ConfigAdapter] 没有找到有效的数据源配置: ${componentId}`)
    return null
  }

  const requirement: ComponentDataRequirement = {
    componentId,
    dataSources
  }

  console.log(`✅ [ConfigAdapter] 配置转换完成: ${componentId}`, requirement)
  return requirement
}

/**
 * 检查配置是否需要转换
 * @param config 配置对象
 * @returns 是否需要转换
 */
export function shouldConvertConfig(config: any): boolean {
  if (!config || typeof config !== 'object') {
    return false
  }

  // 有dataSourceBindings的需要转换
  if (config.dataSourceBindings || config.config?.dataSourceBindings) {
    return true
  }

  // 简单对象也可以转换
  if (!Array.isArray(config) && !config.type && !config.enabled && !config.metadata) {
    return true
  }

  return false
}

/**
 * 从配置中提取组件类型
 * @param config 配置对象
 * @returns 组件类型
 */
export function extractComponentType(config: any): string {
  return config?.metadata?.componentType || 'unknown'
}

/**
 * 批量转换多个组件配置
 * @param configs 配置映射 {componentId: config}
 * @returns 转换结果映射
 */
export function batchConvertConfigs(configs: Record<string, any>): Record<string, ComponentDataRequirement> {
  const results: Record<string, ComponentDataRequirement> = {}

  Object.entries(configs).forEach(([componentId, config]) => {
    if (shouldConvertConfig(config)) {
      const requirement = convertToSimpleDataRequirement(componentId, config)
      if (requirement) {
        results[componentId] = requirement
      }
    }
  })

  console.log(`🎯 [ConfigAdapter] 批量转换完成，共 ${Object.keys(results).length} 个组件`)
  return results
}
