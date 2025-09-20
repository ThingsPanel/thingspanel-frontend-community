/**
 * Visual Editor 数据桥接器
 * 为 Visual Editor 组件提供新架构的数据执行能力
 * 替代原有的 ComponentExecutorManager 直接依赖
 */

import { simpleDataBridge, type ComponentDataRequirement, type DataResult } from '@/core/data-architecture/SimpleDataBridge'
import type { DataSourceDefinition } from '@/core/data-architecture/interfaces/IComponentDataManager'

/**
 * Visual Editor 专用的数据桥接器
 * 封装 SimpleDataBridge，提供与旧API兼容的接口
 */
export class VisualEditorBridge {
  private dataUpdateCallbacks = new Map<string, (componentId: string, data: any) => void>()

  /**
   * 更新组件执行器（兼容旧API）
   * @param componentId 组件ID
   * @param componentType 组件类型
   * @param config 数据源配置
   */
  async updateComponentExecutor(componentId: string, componentType: string, config: any): Promise<DataResult> {


    // 🔥 添加详细的配置结构调试
  

    // 将旧配置格式转换为新的数据需求格式
    const requirement = this.convertConfigToRequirement(componentId, componentType, config)



    const result = await simpleDataBridge.executeComponent(requirement)


    // 通知数据更新回调
    this.notifyDataUpdate(componentId, result.data)

    return result
  }

  /**
   * 监听数据更新（兼容旧API）
   * @param callback 数据更新回调函数
   */
  onDataUpdate(callback: (componentId: string, data: any) => void): () => void {
    const callbackId = Math.random().toString(36).substring(2, 15)
    this.dataUpdateCallbacks.set(callbackId, callback)

    return () => {
      this.dataUpdateCallbacks.delete(callbackId)
    }
  }

  /**
   * 获取组件当前数据
   * @param componentId 组件ID
   */
  getComponentData(componentId: string): Record<string, any> | null {
    return simpleDataBridge.getComponentData(componentId)
  }

  /**
   * 清除组件数据缓存
   * @param componentId 组件ID
   */
  clearComponentCache(componentId: string): void {
    simpleDataBridge.clearComponentCache(componentId)
  }

  /**
   * 通知数据更新
   * @param componentId 组件ID
   * @param data 数据
   */
  private notifyDataUpdate(componentId: string, data: any): void {
    this.dataUpdateCallbacks.forEach(callback => {
      try {
        callback(componentId, data)
      } catch (error) {}
    })
  }

  /**
   * 将旧的配置格式转换为新的数据需求格式
   * @param componentId 组件ID
   * @param componentType 组件类型
   * @param config 配置对象
   */
  private convertConfigToRequirement(
    componentId: string,
    componentType: string,
    config: any
  ): ComponentDataRequirement {
    const dataSources: DataSourceDefinition[] = []

    // 🔥 关键修复：提取基础配置属性并注入到数据源参数中
    let resolvedConfig = config
    let baseConfig: any = null

    // 如果配置是 WidgetConfiguration 格式，提取相关部分
    if (config && typeof config === 'object') {
      // 检查是否是新的分层配置格式
      if (config.base || config.dataSource) {
        baseConfig = config.base || {}
        resolvedConfig = {
          // 合并基础配置中的设备属性到主配置中，用于数据源解析
          ...config.dataSource,
          // 将基础配置中的设备属性暴露给数据源使用
          deviceId: baseConfig.deviceId,
          metricsList: baseConfig.metricsList,
          // 保持原有的数据源配置
          ...(config.dataSource || {})
        }



        // 🔥 新增：将基础配置注入到HTTP参数中，确保参数绑定使用最新值
        resolvedConfig = this.injectBaseConfigToDataSource(resolvedConfig, baseConfig)
      }
    }

    // 处理配置中的数据源
    if (resolvedConfig && typeof resolvedConfig === 'object') {
      // 🔥 新增：详细的配置结构调试日志
    

      // 🆕 处理新的 DataSourceConfiguration 格式
      if (resolvedConfig.dataSources && Array.isArray(resolvedConfig.dataSources)) {
        resolvedConfig.dataSources.forEach((dataSource: any) => {
          if (dataSource.sourceId && dataSource.dataItems && Array.isArray(dataSource.dataItems)) {
            // 🔥 关键修复：保持数据源的完整性，不要拆分成独立数据源
            // 保持原有的数据源结构，让 MultiLayerExecutorChain 处理多数据项合并
            const processedDataItems = dataSource.dataItems
              .map((dataItem: any, itemIndex: number) => {
                if (dataItem && dataItem.item) {
                  return {
                    item: {
                      type: dataItem.item.type,
                      config: this.convertItemConfig(dataItem.item)
                    },
                    processing: {
                      filterPath: dataItem.processing?.filterPath || '$',
                      customScript: dataItem.processing?.customScript,
                      defaultValue: {}
                    }
                  }
                }
                return null
              })
              .filter(Boolean)

            // 创建单一数据源配置，包含所有数据项和合并策略
            dataSources.push({
              sourceId: dataSource.sourceId,
              dataItems: processedDataItems,
              mergeStrategy: dataSource.mergeStrategy || { type: 'object' }
            })
          }
        })
      }

      // 🆕 处理 rawDataList 结构（来自数据源配置表单）
      else if (resolvedConfig.rawDataList && Array.isArray(resolvedConfig.rawDataList)) {
        resolvedConfig.rawDataList.forEach((item: any, index: number) => {
          if (item && item.type && item.enabled !== false) {
            dataSources.push({
              id: `dataSource${index + 1}`,
              type: item.type as any,
              config: item.config || {},
              filterPath: item.filterPath,
              processScript: item.processScript
            })
          }
        })
      }

      // 处理多个数据源的情况（如 dataSource1, dataSource2, dataSource3）
      if (dataSources.length === 0) {
        for (const [key, value] of Object.entries(resolvedConfig)) {
          if (key.startsWith('dataSource') && value && typeof value === 'object') {
            // 🔥 关键修复：在数据源配置中注入基础配置属性
            const enhancedDataSourceConfig = this.injectBaseConfigToDataSource(value as any, baseConfig)
            const dataSourceConfig = value as any

            if (enhancedDataSourceConfig.type && enhancedDataSourceConfig.enabled !== false) {
              dataSources.push({
                id: key,
                type: enhancedDataSourceConfig.type as any,
                config: enhancedDataSourceConfig.config || {},
                filterPath: enhancedDataSourceConfig.filterPath,
                processScript: enhancedDataSourceConfig.processScript
              })
            }
          }
        }
      }

      // 处理单一数据源的情况
      if (dataSources.length === 0 && resolvedConfig.type && resolvedConfig.enabled !== false) {
        // 🔥 特殊处理 data-source-bindings 类型
        if (resolvedConfig.type === 'data-source-bindings') {
          // 对于data-source-bindings，数据在config的各个dataSourceX字段中
          for (const [key, value] of Object.entries(resolvedConfig)) {
            if (key.startsWith('dataSource') && value && typeof value === 'object') {
              dataSources.push({
                id: key,
                type: resolvedConfig.type as any,
                config: { dataSourceBindings: { [key]: value } }, // 🔥 关键：正确包装数据
                filterPath: undefined,
                processScript: undefined
              })
            }
          }
        } else {
          // 🔥 关键修复：注入基础配置到单一数据源
          const enhancedConfig = this.injectBaseConfigToDataSource(resolvedConfig, baseConfig)
          dataSources.push({
            id: 'dataSource1',
            type: enhancedConfig.type as any,
            config: enhancedConfig.config || enhancedConfig,
            filterPath: enhancedConfig.filterPath,
            processScript: enhancedConfig.processScript
          })
        }
      }
    }

    // 🔥 最终结果调试日志

    return {
      componentId,
      componentType,
      dataSources,
      enabled: true
    }
  }

  /**
   * 🔥 关键新增：将基础配置属性注入到数据源配置中
   * 确保 deviceId 和 metricsList 等基础配置能被数据源正确使用
   * @param dataSourceConfig 数据源配置
   * @param baseConfig 基础配置
   */
  private injectBaseConfigToDataSource(dataSourceConfig: any, baseConfig: any): any {
    if (!baseConfig) {
      return dataSourceConfig
    }

    console.log(`🔥 [VisualEditorBridge] injectBaseConfigToDataSource开始:`, {
      baseConfig,
      dataSourceConfig类型: typeof dataSourceConfig,
      是否有config: !!(dataSourceConfig?.config)
    })

    // 创建增强的配置对象
    const enhanced = JSON.parse(JSON.stringify(dataSourceConfig)) // 深拷贝

    // 🚀 关键扩展：不仅注入基础配置，还要处理所有绑定表达式替换
    this.processBindingReplacements(enhanced, baseConfig)

    console.log(`🔥 [VisualEditorBridge] injectBaseConfigToDataSource完成`)

    return enhanced
  }

  /**
   * 🚀 新增：处理所有绑定表达式替换
   * 包括基础配置注入和组件属性绑定替换
   * ⚠️ 关键警告：此方法修改传入的配置对象，确保传入的是克隆对象！
   */
  private processBindingReplacements(config: any, baseConfig: any): void {
    console.log(`🔥 [VisualEditorBridge] processBindingReplacements开始:`, {
      配置类型: typeof config,
      配置键: config && typeof config === 'object' ? Object.keys(config) : [],
      基础配置: baseConfig,
      配置内容预览: config
    })

    // 1. 首先处理基础配置注入（原有逻辑，模拟设备ID的硬编码机制）
    if (config.config && typeof config.config === 'object') {
      console.log(`🔥 [VisualEditorBridge] 注入基础配置到config层:`, {
        原config: config.config,
        注入的deviceId: baseConfig.deviceId,
        注入的metricsList: baseConfig.metricsList
      })
      config.config = {
        ...config.config,
        // 注入基础配置中的设备属性（模拟设备ID硬编码逻辑）
        ...(baseConfig.deviceId && { deviceId: baseConfig.deviceId }),
        ...(baseConfig.metricsList && { metricsList: baseConfig.metricsList })
      }
    } else {
      console.log(`🔥 [VisualEditorBridge] 注入基础配置到顶层:`, {
        注入的deviceId: baseConfig.deviceId,
        注入的metricsList: baseConfig.metricsList
      })
      // 如果没有 config 对象，直接在顶层注入
      config.deviceId = config.deviceId || baseConfig.deviceId
      config.metricsList = config.metricsList || baseConfig.metricsList
    }

    // 2. 🔥 关键新增：然后处理所有绑定表达式替换（这是组件属性绑定的核心逻辑）
    console.log(`🔥 [VisualEditorBridge] 开始递归绑定表达式替换...`)
    this.recursivelyReplaceBindings(config)

    console.log(`🔥 [VisualEditorBridge] processBindingReplacements完成:`, {
      处理后的配置: config,
      说明: '基础配置注入 + 绑定表达式替换完成'
    })
  }

  /**
   * 🚀 新增：递归替换所有绑定表达式
   * 从 useCard2Props 获取当前组件的所有属性值，并替换绑定表达式
   * 🔥 关键修复：精确检测和替换组件属性绑定表达式，支持多种绑定格式
   */
  private recursivelyReplaceBindings(obj: any, path: string = 'root'): void {
    if (!obj || typeof obj !== 'object') {
      return
    }

    console.log(`🔥 [VisualEditorBridge] 检查对象层级:`, {
      路径: path,
      对象类型: typeof obj,
      对象键: typeof obj === 'object' && obj !== null ? Object.keys(obj) : []
    })

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key]
        const currentPath = `${path}.${key}`

        if (typeof val === 'string') {
          console.log(`🔥 [VisualEditorBridge] 检查字符串值:`, {
            路径: currentPath,
            键: key,
            值: val,
            值长度: val.length
          })

          // 🔥 关键修复：检查多种绑定表达式格式
          // 格式1: componentId.component.propertyName （标准组件属性绑定）
          const componentBindingMatch = val.match(/^([^.]+)\.component\.(.+)$/)

          // 格式2: componentId.base.propertyName （基础配置绑定）
          const baseBindingMatch = val.match(/^([^.]+)\.base\.(.+)$/)

          // 格式3: componentId.whitelist.propertyName （旧格式兼容，已废弃但需要兼容）
          const whitelistBindingMatch = val.match(/^([^.]+)\.whitelist\.(.+)$/)

          if (componentBindingMatch) {
            const [, componentId, propertyName] = componentBindingMatch
            console.log(`🔥 [VisualEditorBridge] 发现组件属性绑定:`, {
              路径: currentPath,
              键: key,
              原值: val,
              componentId,
              propertyName,
              绑定类型: 'component'
            })

            // 🚀 关键修复：获取组件的当前属性值，使用正确的获取逻辑
            const actualValue = this.getComponentPropertyValueFixed(componentId, propertyName)
            if (actualValue !== undefined) {
              console.log(`🔥 [VisualEditorBridge] 组件属性绑定替换成功:`, {
                路径: currentPath,
                键: key,
                原值: val,
                新值: actualValue,
                数据类型: typeof actualValue
              })
              obj[key] = String(actualValue)
            } else {
              console.log(`🔥 [VisualEditorBridge] 组件属性未找到，保持原值:`, {
                路径: currentPath,
                原值: val,
                componentId,
                propertyName
              })
            }
          } else if (baseBindingMatch) {
            const [, componentId, propertyName] = baseBindingMatch
            console.log(`🔥 [VisualEditorBridge] 发现基础配置绑定:`, {
              路径: currentPath,
              键: key,
              原值: val,
              componentId,
              propertyName,
              绑定类型: 'base'
            })

            // 尝试获取基础配置值（使用已有的获取逻辑）
            const actualValue = this.getBaseConfigPropertyValue(componentId, propertyName)
            if (actualValue !== undefined) {
              console.log(`🔥 [VisualEditorBridge] 基础配置绑定替换成功:`, {
                路径: currentPath,
                键: key,
                原值: val,
                新值: actualValue,
                数据类型: typeof actualValue
              })
              obj[key] = String(actualValue)
            } else {
              console.log(`🔥 [VisualEditorBridge] 基础配置未找到，保持原值:`, {
                路径: currentPath,
                原值: val,
                componentId,
                propertyName
              })
            }
          } else if (whitelistBindingMatch) {
            // 🔥 兼容性处理：将旧的whitelist格式转换为component格式再处理
            const [, componentId, propertyName] = whitelistBindingMatch
            console.log(`🔥 [VisualEditorBridge] 发现旧格式绑定（whitelist），转换为component格式:`, {
              路径: currentPath,
              键: key,
              原值: val,
              componentId,
              propertyName,
              绑定类型: 'whitelist（已废弃）'
            })

            // 转换为标准component格式再处理
            const actualValue = this.getComponentPropertyValueFixed(componentId, propertyName)
            if (actualValue !== undefined) {
              console.log(`🔥 [VisualEditorBridge] 旧格式绑定替换成功:`, {
                路径: currentPath,
                键: key,
                原值: val,
                新值: actualValue,
                数据类型: typeof actualValue,
                说明: '已自动转换旧格式'
              })
              obj[key] = String(actualValue)
            } else {
              console.log(`🔥 [VisualEditorBridge] 旧格式绑定未找到属性值，保持原值:`, {
                路径: currentPath,
                原值: val,
                componentId,
                propertyName
              })
            }
          } else {
            // 不是绑定表达式，无需处理
            if (val.includes('.')) {
              console.log(`🔥 [VisualEditorBridge] 字符串包含点号但不是绑定表达式:`, {
                路径: currentPath,
                键: key,
                值: val,
                说明: '可能是普通URL或其他格式'
              })
            }
          }
        } else if (typeof val === 'object' && val !== null) {
          // 递归处理嵌套对象
          console.log(`🔥 [VisualEditorBridge] 递归处理嵌套对象:`, {
            路径: currentPath,
            对象类型: Array.isArray(val) ? 'array' : 'object',
            子键数量: Array.isArray(val) ? val.length : Object.keys(val).length
          })
          this.recursivelyReplaceBindings(val, currentPath)
        }
      }
    }
  }

  /**
   * 🔥 新增：获取基础配置属性值（用于base层绑定）
   */
  private getBaseConfigPropertyValue(componentId: string, propertyName: string): any {
    try {
      const { configurationIntegrationBridge } = require('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      const config = configurationIntegrationBridge.getConfiguration(componentId)

      if (config?.base?.[propertyName] !== undefined) {
        const value = config.base[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从基础配置获取属性值:`, {
          componentId,
          propertyName,
          value,
          配置来源: 'config.base'
        })
        return value
      }

      console.log(`🔥 [VisualEditorBridge] 基础配置中未找到属性:`, {
        componentId,
        propertyName,
        基础配置键: config?.base ? Object.keys(config.base) : []
      })
      return undefined
    } catch (error) {
      console.error(`❌ [VisualEditorBridge] 获取基础配置属性值失败:`, {
        componentId,
        propertyName,
        error: error instanceof Error ? error.message : error
      })
      return undefined
    }
  }

  /**
   * 🚀 修复版本：获取组件的当前属性值
   * 专门处理实际的属性值获取，优先级：最新配置 > 编辑器节点 > DOM
   */
  private getComponentPropertyValueFixed(componentId: string, propertyName: string): any {
    try {
      console.log(`🔥 [VisualEditorBridge] getComponentPropertyValueFixed开始:`, {
        componentId,
        propertyName,
        说明: '修复版本的属性值获取'
      })

      // 🚀 关键修复：直接从配置管理器获取最新的组件配置
      const { configurationIntegrationBridge } = require('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)

      console.log(`🔥 [VisualEditorBridge] 获取到的完整配置:`, {
        componentId,
        propertyName,
        hasConfig: !!fullConfig,
        hasComponent: !!(fullConfig?.component),
        componentConfig: fullConfig?.component,
        说明: '检查component层配置中的属性',
        关键检查: `寻找属性 ${propertyName} 在配置中的值`
      })

      // 1. 优先从component层直接获取属性
      if (fullConfig?.component?.[propertyName] !== undefined) {
        const value = fullConfig.component[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从component层获取属性值成功:`, {
          componentId,
          propertyName,
          value,
          type: typeof value
        })
        return value
      }

      // 2. 检查customize层（兼容某些组件结构）
      if (fullConfig?.component?.customize?.[propertyName] !== undefined) {
        const value = fullConfig.component.customize[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从customize层获取属性值成功:`, {
          componentId,
          propertyName,
          value,
          type: typeof value
        })
        return value
      }

      // 3. 从编辑器节点获取（备用方案）
      const { useEditorStore } = require('@/components/visual-editor/store/editor')
      const editorStore = useEditorStore()
      const node = editorStore.nodes?.find((n: any) => n.id === componentId)

      if (node?.properties?.[propertyName] !== undefined) {
        const value = node.properties[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从编辑器节点获取属性值:`, {
          componentId,
          propertyName,
          value,
          type: typeof value
        })
        return value
      }

      // 4. 检查编辑器节点的统一配置
      if (node?.metadata?.unifiedConfig?.component?.[propertyName] !== undefined) {
        const value = node.metadata.unifiedConfig.component[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从编辑器节点统一配置获取属性值:`, {
          componentId,
          propertyName,
          value,
          type: typeof value
        })
        return value
      }

      console.log(`🔥 [VisualEditorBridge] 未找到属性值:`, {
        componentId,
        propertyName,
        检查的配置: {
          hasFullConfig: !!fullConfig,
          hasComponent: !!(fullConfig?.component),
          componentKeys: fullConfig?.component ? Object.keys(fullConfig.component) : [],
          hasNode: !!node,
          nodePropertyKeys: node?.properties ? Object.keys(node.properties) : []
        }
      })
      return undefined
    } catch (error) {
      console.error(`❌ [VisualEditorBridge] getComponentPropertyValueFixed失败:`, {
        componentId,
        propertyName,
        error: error instanceof Error ? error.message : error
      })
      return undefined
    }
  }

  /**
   * 🚀 原版本：获取组件的当前属性值（保留兼容）
   * 从配置管理器或其他数据源获取组件属性的实际值
   * 🔥 关键修复：确保获取到最新的属性值，优先级：配置管理器 > 编辑器节点 > DOM暴露属性
   */
  private getComponentPropertyValue(componentId: string, propertyName: string): any {
    try {
      console.log(`🔥 [VisualEditorBridge] 开始获取组件属性值:`, {
        componentId,
        propertyName,
        调用位置: '绑定表达式替换'
      })

      // 方法1: 从配置管理器的component层获取（最高优先级）
      const { configurationIntegrationBridge } = require('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      const config = configurationIntegrationBridge.getConfiguration(componentId)

      console.log(`🔥 [VisualEditorBridge] 配置管理器返回的配置:`, {
        componentId,
        propertyName,
        hasConfig: !!config,
        hasComponent: !!(config?.component),
        componentKeys: config?.component ? Object.keys(config.component) : [],
        配置结构: {
          base: config?.base ? Object.keys(config.base) : [],
          component: config?.component ? Object.keys(config.component) : [],
          dataSource: config?.dataSource ? Object.keys(config.dataSource) : []
        }
      })

      // 🔥 关键修复：优先从component层获取，然后检查customize层（兼容不同组件结构）
      let value = undefined
      if (config?.component?.[propertyName] !== undefined) {
        value = config.component[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从配置管理器component层获取属性值:`, {
          componentId,
          propertyName,
          value,
          配置来源: 'config.component'
        })
        return value
      }

      // 兼容性检查：某些组件可能将属性存储在customize层
      if (config?.component?.customize?.[propertyName] !== undefined) {
        value = config.component.customize[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从配置管理器customize层获取属性值:`, {
          componentId,
          propertyName,
          value,
          配置来源: 'config.component.customize'
        })
        return value
      }

      // 🚀 关键新增：检查根层级的component配置（Card2.1的新格式）
      if (config?.component !== undefined) {
        // 遍历component层的所有属性，寻找匹配的属性名
        const componentConfig = config.component
        for (const [key, val] of Object.entries(componentConfig)) {
          if (key === propertyName && val !== undefined) {
            console.log(`🔥 [VisualEditorBridge] 从配置管理器component层根级获取属性值:`, {
              componentId,
              propertyName,
              value: val,
              配置来源: 'config.component.root'
            })
            return val
          }
        }
      }

      // 方法2: 从编辑器节点获取（第二优先级）
      const { useEditorStore } = require('@/components/visual-editor/store/editor')
      const editorStore = useEditorStore()
      const node = editorStore.nodes?.find((n: any) => n.id === componentId)

      console.log(`🔥 [VisualEditorBridge] 编辑器节点信息:`, {
        componentId,
        propertyName,
        hasNode: !!node,
        nodeId: node?.id,
        hasProperties: !!(node?.properties),
        propertyKeys: node?.properties ? Object.keys(node.properties) : [],
        节点属性结构: node?.properties
      })

      if (node?.properties?.[propertyName] !== undefined) {
        value = node.properties[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从编辑器节点获取属性值:`, {
          componentId,
          propertyName,
          value,
          配置来源: 'editorStore.node.properties'
        })
        return value
      }

      // 检查编辑器节点的component层属性
      if (node?.properties?.component?.[propertyName] !== undefined) {
        value = node.properties.component[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从编辑器节点component层获取属性值:`, {
          componentId,
          propertyName,
          value,
          配置来源: 'editorStore.node.properties.component'
        })
        return value
      }

      // 🚀 关键新增：检查统一配置格式（metadata.unifiedConfig）
      if (node?.metadata?.unifiedConfig?.component?.[propertyName] !== undefined) {
        value = node.metadata.unifiedConfig.component[propertyName]
        console.log(`🔥 [VisualEditorBridge] 从编辑器节点统一配置获取属性值:`, {
          componentId,
          propertyName,
          value,
          配置来源: 'editorStore.node.metadata.unifiedConfig.component'
        })
        return value
      }

      // 方法3: 从DOM元素获取（最后选择）
      if (typeof window !== 'undefined') {
        const element = document.querySelector(`[data-component-id="${componentId}"]`)
        if (element) {
          const exposedProps = (element as any).__exposedProperties
          if (exposedProps?.[propertyName] !== undefined) {
            value = exposedProps[propertyName]
            console.log(`🔥 [VisualEditorBridge] 从DOM元素获取属性值:`, {
              componentId,
              propertyName,
              value,
              配置来源: 'DOM.__exposedProperties'
            })
            return value
          }
        }
      }

      console.log(`🔥 [VisualEditorBridge] 未找到属性值:`, {
        componentId,
        propertyName,
        检查的来源: ['config.component', 'config.component.customize', 'node.properties', 'node.properties.component', 'DOM.__exposedProperties'],
        配置内容预览: {
          hasConfig: !!config,
          hasComponent: !!(config?.component),
          componentKeys: config?.component ? Object.keys(config.component) : [],
          hasNode: !!node,
          nodePropertyKeys: node?.properties ? Object.keys(node.properties) : []
        }
      })
      return undefined
    } catch (error) {
      console.error(`❌ [VisualEditorBridge] 获取组件属性值失败:`, {
        componentId,
        propertyName,
        error: error instanceof Error ? error.message : error
      })
      return undefined
    }
  }

  /**
   * 转换数据项配置，处理字段映射
   */
  private convertItemConfig(item: any): any {
    const { type, config } = item

    switch (type) {
      case 'json':
        // JSON类型：jsonString → jsonContent
        return {
          ...config,
          jsonContent: config.jsonString || config.jsonContent
        }

      case 'http':
        // HTTP类型：保持原有字段
        return config

      case 'script':
        // Script类型：script → scriptContent
        return {
          ...config,
          scriptContent: config.script || config.scriptContent
        }

      default:
        return config
    }
  }
}

// 端口隔离的VisualEditorBridge实例管理
const bridgeInstances = new Map<string, VisualEditorBridge>()

/**
 * 获取端口ID（用于多端口开发环境的实例隔离）
 */
function getPortId(): string {
  if (typeof window !== 'undefined') {
    return window.location.port || 'default'
  }
  return 'default'
}

/**
 * 获取当前端口的VisualEditorBridge实例
 * 确保不同端口使用独立的桥接器实例，避免数据回调干扰
 */
export function getVisualEditorBridge(): VisualEditorBridge {
  const portId = getPortId()

  if (!bridgeInstances.has(portId)) {
    bridgeInstances.set(portId, new VisualEditorBridge())
  }

  return bridgeInstances.get(portId)!
}

/**
 * Visual Editor 桥接器单例实例
 * 用于替代原有的 componentExecutorManager
 * @deprecated 使用 getVisualEditorBridge() 替代，以支持端口隔离
 */
export const visualEditorBridge = getVisualEditorBridge()
