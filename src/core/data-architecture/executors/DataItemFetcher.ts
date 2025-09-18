/**
 * 第一层：数据项获取器 (DataItemFetcher)
 * 职责：根据配置类型获取原始数据
 * 已集成 script-engine 安全脚本执行系统
 * 支持新的 HttpConfig 类型和正确的 HTTP 方法处理
 */

import { defaultScriptEngine } from '@/core/script-engine'
import type { HttpConfig, HttpParameter, PathParameter } from '@/core/data-architecture/types/http-config'
import { convertValue } from '@/core/data-architecture/types/http-config'
import { request } from '@/service/request'
// 导入Visual Editor store以获取组件实例
import { useEditorStore } from '@/components/visual-editor/store/editor'

// 类型安全的数据项配置
export type DataItem =
  | {
      type: 'json'
      config: JsonDataItemConfig
    }
  | {
      type: 'http'
      config: HttpDataItemConfig
    }
  | {
      type: 'websocket'
      config: WebSocketDataItemConfig
    }
  | {
      type: 'script'
      config: ScriptDataItemConfig
    }

export interface JsonDataItemConfig {
  jsonString: string
}

// 兼容原有接口，同时支持新的 HttpConfig
export interface HttpDataItemConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number

  // 🔥 新增：地址类型支持
  addressType?: 'internal' | 'external'
  selectedInternalAddress?: string
  enableParams?: boolean

  // 路径参数支持
  pathParameter?: PathParameter
  pathParams?: HttpParameter[]

  // 扩展支持新的 HttpConfig 格式
  params?: HttpParameter[]
  // 向后兼容：统一参数系统
  parameters?: HttpParameter[]

  // 🔥 新增：脚本支持
  preRequestScript?: string
  postResponseScript?: string
}

// 或者直接使用 HttpConfig 类型
export type HttpDataItemConfigV2 = HttpConfig

export interface WebSocketDataItemConfig {
  url: string
  protocols?: string[]
  reconnectInterval?: number
}

export interface ScriptDataItemConfig {
  script: string
  context?: Record<string, any>
}

/**
 * 数据项获取器接口
 */
export interface IDataItemFetcher {
  /**
   * 根据数据项配置获取原始数据
   * @param item 数据项配置
   * @returns 原始数据，出错时返回 {}
   */
  fetchData(item: DataItem): Promise<any>

  /**
   * 设置当前执行上下文的组件ID
   * @param componentId 组件ID
   */
  setCurrentComponentId(componentId: string): void
}

/**
 * 数据项获取器实现类
 */
export class DataItemFetcher implements IDataItemFetcher {
  // 🔥 新增：请求去重缓存，防止重复HTTP请求
  private requestCache = new Map<string, Promise<any>>()
  // 请求缓存TTL：200毫秒内的相同请求会被去重
  private readonly REQUEST_CACHE_TTL = 200

  // 🔥 新增：组件ID上下文，用于参数绑定
  private currentComponentId?: string

  /**
   * 🔥 新增：设置当前执行上下文的组件ID
   * @param componentId 组件ID
   */
  setCurrentComponentId(componentId: string): void {
    this.currentComponentId = componentId
    console.log(`🔥 [DataItemFetcher] 设置当前组件上下文: ${componentId}`)
  }
  /**
   * 🔥 新增：运行时智能检测参数是否应该是动态参数
   * 防御性编程：在执行时检测并修正错误的isDynamic设置
   */
  private detectRuntimeIsDynamic(param: HttpParameter): boolean {
    // 检测明显的绑定特征
    const hasBindingFeatures =
      // 特征1：valueMode为component
      param.valueMode === 'component' ||
      // 特征2：selectedTemplate为组件属性绑定
      param.selectedTemplate === 'component-property-binding' ||
      // 特征3：value值看起来像绑定路径（包含.且格式正确）
      (typeof param.value === 'string' &&
       param.value.includes('.') &&
       param.value.split('.').length >= 3 &&
       param.value.length > 10 &&
       // 确保不是错误的短数字值
       !/^\d{1,4}$/.test(param.value)) ||
      // 特征4：有variableName且包含组件ID格式
      (param.variableName && param.variableName.includes('_') && param.variableName.length > 5)

    return hasBindingFeatures
  }

  /**
   * 从组件实例中获取属性值
   * @param bindingPath 绑定路径，格式：组件实例ID.属性路径
   * @returns 组件属性的实际值
   */
  private async getComponentPropertyValue(bindingPath: string): Promise<any> {
    try {
      // 🔥 关键调试：输出绑定路径解析过程
      console.log(`🔥 [DataItemFetcher] 开始解析属性绑定路径:`, {
        bindingPath,
        currentComponentId: this.currentComponentId
      })

      if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
        console.error(`⚠️ [DataItemFetcher] 属性绑定路径格式错误`, { bindingPath })
        return undefined
      }

      const parts = bindingPath.split('.')
      const componentId = parts[0]
      const propertyPath = parts.slice(1).join('.')

      console.log(`🔥 [DataItemFetcher] 路径解析结果:`, {
        原始路径: bindingPath,
        组件ID: componentId,
        属性路径: propertyPath
      })

      // 🔥 关键修复：优先从ConfigurationIntegrationBridge获取最新配置
      try {
        console.log(`🔥 [DataItemFetcher] 准备从ConfigurationIntegrationBridge获取配置`, {
          componentId,
          currentComponentId: this.currentComponentId
        })

        // 🔥 修复：使用直接导入替代动态require，避免循环依赖问题
        const { configurationIntegrationBridge } = await import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')

        console.log(`🔥 [DataItemFetcher] 成功导入configurationIntegrationBridge`, {
          bridgeExists: !!configurationIntegrationBridge,
          bridgeType: typeof configurationIntegrationBridge,
          bridgeMethods: configurationIntegrationBridge ? Object.getOwnPropertyNames(Object.getPrototypeOf(configurationIntegrationBridge)) : []
        })

        // 🔥 智能组件ID映射：如果原始组件ID无法找到配置，尝试使用当前上下文组件ID
        let targetComponentId = componentId
        let latestConfig = configurationIntegrationBridge.getConfiguration(componentId)

        console.log(`🔥 [DataItemFetcher] 配置获取结果:`, {
          原始ComponentId: componentId,
          当前ComponentId: this.currentComponentId,
          找到配置: !!latestConfig,
          配置类型: typeof latestConfig,
          配置内容: latestConfig ? {
            hasBase: !!latestConfig.base,
            hasComponent: !!latestConfig.component,
            baseKeys: latestConfig.base ? Object.keys(latestConfig.base) : [],
            componentKeys: latestConfig.component ? Object.keys(latestConfig.component) : [],
            baseContent: latestConfig.base,
            componentContent: latestConfig.component
          } : null,
          请求的属性路径: propertyPath,
          完整配置对象: latestConfig
        })

        if (!latestConfig && this.currentComponentId && this.currentComponentId !== componentId) {
          console.warn(`⚠️ [DataItemFetcher] 原始组件ID ${componentId} 无配置，尝试使用当前组件ID ${this.currentComponentId}`)
          targetComponentId = this.currentComponentId
          latestConfig = configurationIntegrationBridge.getConfiguration(this.currentComponentId)
        }

        if (latestConfig) {
          console.log(`🔥 [DataItemFetcher] 从ConfigurationIntegrationBridge获取最新配置:`, {
            原始ComponentId: componentId,
            实际使用ComponentId: targetComponentId,
            propertyPath,
            hasBase: !!latestConfig.base,
            hasComponent: !!latestConfig.component,
            baseDeviceId: latestConfig.base?.deviceId,
            componentDeviceId: latestConfig.component?.deviceId,
            完整base配置: latestConfig.base,
            完整component配置: latestConfig.component
          })

          // 🔥 关键：支持多层级属性路径解析
          if (propertyPath.startsWith('customize.')) {
            // 处理 customize.deviceId 格式 - 映射到 component 层
            const customizePropertyPath = propertyPath.replace('customize.', '')
            const componentValue = this.getNestedProperty(latestConfig.component, customizePropertyPath)

            console.log(`🔥 [DataItemFetcher] 检查customize路径 -> component层:`, {
              customizePropertyPath,
              componentValue
            })

            if (componentValue !== undefined) {
              console.log(`✅ [DataItemFetcher] 从component层获取属性值:`, {
                componentId: targetComponentId,
                propertyPath: customizePropertyPath,
                value: componentValue
              })
              return componentValue
            }

            // 回退到base层查找
            const baseValue = this.getNestedProperty(latestConfig.base, customizePropertyPath)
            console.log(`🔥 [DataItemFetcher] 检查customize路径 -> base层:`, {
              customizePropertyPath,
              baseValue
            })

            if (baseValue !== undefined) {
              console.log(`✅ [DataItemFetcher] 从base层获取属性值:`, {
                componentId: targetComponentId,
                propertyPath: customizePropertyPath,
                value: baseValue
              })
              return baseValue
            }
          } else if (propertyPath.startsWith('base.')) {
            // 🔥 关键修复：处理 base.deviceId 格式路径
            const actualPropertyPath = propertyPath.replace('base.', '')
            console.log(`🔥 [DataItemFetcher] 检测到base.属性路径，提取实际属性名:`, {
              原始路径: propertyPath,
              实际属性名: actualPropertyPath
            })

            // 直接从 base 层获取属性（去掉base前缀）
            const baseValue = this.getNestedProperty(latestConfig.base, actualPropertyPath)
            console.log(`🔥 [DataItemFetcher] 检查base层(修正后):`, {
              actualPropertyPath,
              baseValue,
              baseConfig: latestConfig.base,
              查找路径: `latestConfig.base.${actualPropertyPath}`,
              base层所有键: latestConfig.base ? Object.keys(latestConfig.base) : []
            })

            if (baseValue !== undefined) {
              console.log(`✅ [DataItemFetcher] 从base层获取属性值(修正后):`, {
                componentId: targetComponentId,
                originalPath: propertyPath,
                actualPropertyPath,
                value: baseValue,
                valueType: typeof baseValue
              })
              return baseValue
            }

            // 如果base层没有，也尝试component层
            const componentValue = this.getNestedProperty(latestConfig.component, actualPropertyPath)
            console.log(`🔥 [DataItemFetcher] 检查component层(修正后):`, {
              actualPropertyPath,
              componentValue,
              componentConfig: latestConfig.component,
              查找路径: `latestConfig.component.${actualPropertyPath}`,
              component层所有键: latestConfig.component ? Object.keys(latestConfig.component) : []
            })

            if (componentValue !== undefined) {
              console.log(`✅ [DataItemFetcher] 从component层获取属性值(修正后):`, {
                componentId: targetComponentId,
                originalPath: propertyPath,
                actualPropertyPath,
                value: componentValue,
                valueType: typeof componentValue
              })
              return componentValue
            }
          } else {
            // 处理其他属性路径
            // 首先尝试从 base 层获取（优先级更高，因为交互通常修改 base 层）
            const baseValue = this.getNestedProperty(latestConfig.base, propertyPath)
            console.log(`🔥 [DataItemFetcher] 检查base层:`, {
              propertyPath,
              baseValue,
              baseConfig: latestConfig.base,
              查找路径: `latestConfig.base.${propertyPath}`,
              base层所有键: latestConfig.base ? Object.keys(latestConfig.base) : []
            })

            if (baseValue !== undefined) {
              console.log(`✅ [DataItemFetcher] 从base层获取属性值:`, {
                componentId: targetComponentId,
                propertyPath,
                value: baseValue,
                valueType: typeof baseValue
              })
              return baseValue
            }

            // 然后从 component 层获取
            const componentValue = this.getNestedProperty(latestConfig.component, propertyPath)
            console.log(`🔥 [DataItemFetcher] 检查component层:`, {
              propertyPath,
              componentValue,
              componentConfig: latestConfig.component,
              查找路径: `latestConfig.component.${propertyPath}`,
              component层所有键: latestConfig.component ? Object.keys(latestConfig.component) : []
            })

            if (componentValue !== undefined) {
              console.log(`✅ [DataItemFetcher] 从component层获取属性值:`, {
                componentId: targetComponentId,
                propertyPath,
                value: componentValue,
                valueType: typeof componentValue
              })
              return componentValue
            }
          }

          console.warn(`⚠️ [DataItemFetcher] 在配置中未找到属性值:`, {
            componentId: targetComponentId,
            propertyPath,
            配置结构: {
              base: latestConfig.base,
              component: latestConfig.component
            }
          })
        } else {
          console.error(`❌ [DataItemFetcher] 无法获取组件配置:`, { componentId, currentComponentId: this.currentComponentId })
        }
      } catch (configError) {
        console.warn(`⚠️ [DataItemFetcher] 从配置管理器获取属性失败，回退到编辑器存储:`, {
          configError: configError.message || configError,
          bindingPath,
          componentId,
          propertyPath
        })
      }

      // 🔥 回退：从编辑器store获取属性值（兼容性处理）
      const editorStore = useEditorStore()

      // 🔥 改进的组件查找策略：支持模糊匹配
      let targetComponent = editorStore.nodes?.find(node => node.id === componentId)

      if (!targetComponent) {
        // 尝试模糊匹配：查找包含componentId的组件
        targetComponent = editorStore.nodes?.find(node =>
          node.id.includes(componentId) || componentId.includes(node.id)
        )

        if (targetComponent) {
          console.warn(`🔧 [DataItemFetcher] 使用模糊匹配找到组件:`, {
            原始ComponentId: componentId,
            匹配到的ComponentId: targetComponent.id,
            匹配类型: 'fuzzy'
          })
        }
      }

      if (!targetComponent && this.currentComponentId) {
        // 最终回退：使用当前组件ID
        targetComponent = editorStore.nodes?.find(node => node.id === this.currentComponentId)
        if (targetComponent) {
          console.warn(`🔧 [DataItemFetcher] 使用当前组件ID作为回退:`, {
            原始ComponentId: componentId,
            当前ComponentId: this.currentComponentId,
            匹配类型: 'fallback'
          })
        }
      }

      if (!targetComponent) {
        console.error('[DataItemFetcher] 组件属性绑定失败: 未找到组件', {
          目标ComponentId: componentId,
          当前ComponentId: this.currentComponentId,
          可用组件: editorStore.nodes?.map(n => ({ id: n.id, type: n.type })) || []
        })
        return undefined
      }

      // 从组件properties中获取属性值
      const propertyValue = this.getNestedProperty(targetComponent.properties, propertyPath)

      console.log(`🔥 [DataItemFetcher] fallback从editor store获取属性值:`, {
        bindingPath,
        componentId,
        propertyPath,
        targetComponent: {
          id: targetComponent.id,
          type: targetComponent.type,
          properties: targetComponent.properties
        },
        获取到的propertyValue: propertyValue,
        propertyValueType: typeof propertyValue
      })

      if (propertyValue !== undefined) {
        console.log(`✅ [DataItemFetcher] fallback成功获取属性值: ${propertyValue}`)
      }

      return propertyValue
    } catch (error) {
      console.error('[DataItemFetcher] 组件属性绑定错误:', error)
      return undefined
    }
  }

  /**
   * 获取嵌套对象属性
   * @param obj 目标对象
   * @param path 属性路径，如 'customize.title'
   * @returns 属性值
   */
  private getNestedProperty(obj: any, path: string): any {
    if (!obj || !path) return undefined

    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * 解析参数值，支持默认值回退机制和组件属性绑定
   * @param param HTTP参数
   * @returns 解析后的参数值
   */
  private async resolveParameterValue(param: HttpParameter): Promise<any> {
    let resolvedValue = param.value

    // 🔥 防御性检测：运行时智能修正isDynamic字段
    const shouldBeDynamic = this.detectRuntimeIsDynamic(param)
    if (shouldBeDynamic && !param.isDynamic) {
      console.warn(`🔧 [DataItemFetcher] 运行时检测到参数应为动态但设置为静态，临时修正:`, {
        paramKey: param.key,
        原始isDynamic: param.isDynamic,
        临时修正为: true,
        检测依据: {
          selectedTemplate: param.selectedTemplate,
          valueMode: param.valueMode,
          value: param.value,
          variableName: param.variableName
        }
      })
      // 🔥 临时修正，不修改原参数对象
      param = { ...param, isDynamic: true }
    }

    // 🔥 关键调试：详细输出参数信息
    console.log(`🔥 [DataItemFetcher] 参数解析详细信息:`, {
      paramKey: param.key,
      paramValue: param.value,
      paramValueType: typeof param.value,
      selectedTemplate: param.selectedTemplate,
      valueMode: param.valueMode,
      variableName: param.variableName,
      defaultValue: param.defaultValue,
      isDynamic: param.isDynamic,
      是否为属性绑定: param.selectedTemplate === 'component-property-binding' || param.valueMode === 'component'
    })

    // 🔥 修复：优先使用isDynamic字段判断，支持属性绑定
    if (param.isDynamic || param.selectedTemplate === 'component-property-binding' || param.valueMode === 'component') {
      console.log(`🔥 [DataItemFetcher] 检测到动态参数，开始属性绑定解析:`, {
        paramKey: param.key,
        isDynamic: param.isDynamic,
        selectedTemplate: param.selectedTemplate,
        valueMode: param.valueMode,
        bindingValue: param.value,
        variableName: param.variableName
      })

      // 🔥 关键修复：使用深拷贝保护原始参数，防止数据被意外修改
      let bindingPath = param.value

      // 🔥 超强防护：如果bindingPath看起来不像绑定路径但variableName是正确的，说明value被损坏了
      const isBindingPathCorrupted = bindingPath &&
        typeof bindingPath === 'string' &&
        !bindingPath.includes('.') &&
        bindingPath.length < 10 && // 绑定路径通常很长
        param.variableName &&
        param.variableName.includes('_')

      if (isBindingPathCorrupted) {
        console.error(`🚨 [DataItemFetcher] 检测到bindingPath被损坏! 尝试从variableName恢复:`, {
          损坏的bindingPath: bindingPath,
          variableName: param.variableName,
          description: param.description,
          原始参数: param,
          损坏原因分析: {
            不包含点: !bindingPath.includes('.'),
            长度太短: bindingPath.length < 10,
            看起来像数值: /^\d+$/.test(bindingPath),
            variableName正常: param.variableName && param.variableName.includes('_')
          }
        })

        // 🔥 关键修复：强制阻止损坏的绑定路径继续传播
        console.error(`❌ [DataItemFetcher] 绑定路径已损坏，这是一个严重的配置错误！请检查参数保存逻辑`)
        console.error(`❌ [DataItemFetcher] 绑定路径不应该是实际值，而应该是组件属性路径！`)

        // 从variableName重建绑定路径
        if (param.variableName.includes('_')) {
          const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
          if (lastUnderscoreIndex > 0) {
            const componentId = param.variableName.substring(0, lastUnderscoreIndex)
            const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
            const reconstructedPath = `${componentId}.base.${propertyName}`

            console.log(`🔧 [DataItemFetcher] 成功从variableName重建绑定路径:`, {
              原损坏值: bindingPath,
              重建路径: reconstructedPath,
              variableName: param.variableName,
              推断的组件ID: componentId,
              推断的属性名: propertyName
            })

            bindingPath = reconstructedPath

            // 🔥 关键：强制输出警告，提醒修复配置保存逻辑
            console.error(`⚠️ ⚠️ ⚠️ [CRITICAL] 绑定路径损坏问题需要修复！`)
            console.error(`⚠️ 绑定路径不应该被替换为实际值，这表明配置保存或恢复逻辑存在严重错误！`)
            console.error(`⚠️ 需要检查SimpleConfigurationEditor或ConfigurationIntegrationBridge中的保存逻辑！`)
          }
        }
      }

      console.log(`🔥 [DataItemFetcher] 最终使用的绑定路径:`, {
        paramKey: param.key,
        finalBindingPath: bindingPath,
        bindingPathType: typeof bindingPath,
        bindingPathLength: bindingPath ? bindingPath.length : 0,
        isValidBindingPath: bindingPath && typeof bindingPath === 'string' && bindingPath.includes('.')
      })

      // 🔥 最终验证：如果修复后的绑定路径仍然不正确，才报错
      if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
        console.error(`❌ [DataItemFetcher] 属性绑定路径格式异常，修复失败:`, {
          paramKey: param.key,
          bindingPath,
          bindingPathType: typeof bindingPath,
          expectedFormat: 'componentId.layer.propertyName',
          原始参数对象: param,
          variableName: param.variableName,
          description: param.description
        })

        // 🔥 如果修复后仍然无效，返回null使用默认值
        if (!bindingPath || typeof bindingPath !== 'string' || !bindingPath.includes('.')) {
          console.warn(`⚠️ [DataItemFetcher] 无法修复绑定路径，将使用默认值:`, {
            paramKey: param.key,
            defaultValue: param.defaultValue
          })
          return param.defaultValue || null
        }
      }

      if (bindingPath && typeof bindingPath === 'string') {
        const actualValue = await this.getComponentPropertyValue(bindingPath)

        console.log(`🔥 [DataItemFetcher] 属性绑定解析完成:`, {
          paramKey: param.key,
          bindingPath,
          actualValue,
          actualValueType: typeof actualValue,
          将使用的值: actualValue !== undefined && actualValue !== null && actualValue !== '' ? actualValue : param.defaultValue
        })

        // 🔥 修复：移除愚蠢的"像不像属性值"判断，直接使用获取到的值
        if (actualValue !== undefined && actualValue !== null && actualValue !== '') {
          resolvedValue = actualValue
          console.log(`✅ [DataItemFetcher] 成功设置resolvedValue为actualValue:`, {
            paramKey: param.key,
            resolvedValue: actualValue,
            resolvedValueType: typeof actualValue
          })
        } else {
          // 当组件属性值为空时，设置 resolvedValue 为 undefined，触发默认值机制
          resolvedValue = undefined
          console.log(`⚠️ [DataItemFetcher] actualValue为空，设置resolvedValue为undefined:`, {
            paramKey: param.key,
            actualValue,
            actualValueType: typeof actualValue
          })
        }
      }
    }

    console.log(`🔥 [DataItemFetcher] 进入isEmpty检查前的状态:`, {
      paramKey: param.key,
      resolvedValue,
      resolvedValueType: typeof resolvedValue,
      defaultValue: param.defaultValue
    })

    // 检查值是否为"空"（需要使用默认值的情况）
    const isEmpty =
      resolvedValue === null ||
      resolvedValue === undefined ||
      resolvedValue === '' ||
      (typeof resolvedValue === 'string' && resolvedValue.trim() === '')

    console.log(`🔥 [DataItemFetcher] isEmpty检查结果:`, {
      paramKey: param.key,
      resolvedValue,
      isEmpty,
      isNull: resolvedValue === null,
      isUndefined: resolvedValue === undefined,
      isEmptyString: resolvedValue === '',
      isEmptyTrimmedString: typeof resolvedValue === 'string' && resolvedValue.trim() === ''
    })

    if (isEmpty) {
      console.log(`⚠️ [DataItemFetcher] 值为空，使用默认值:`, {
        paramKey: param.key,
        resolvedValue,
        defaultValue: param.defaultValue
      })

      // 如果有默认值，使用默认值
      if (param.defaultValue !== undefined && param.defaultValue !== null) {
        resolvedValue = param.defaultValue
      } else {
        return null // 返回null表示跳过此参数
      }
    }

    // 转换数据类型
    const convertedValue = convertValue(resolvedValue, param.dataType)

    console.log(`🔥 [DataItemFetcher] 参数值解析最终结果:`, {
      paramKey: param.key,
      originalValue: param.value,
      resolvedValue,
      convertedValue,
      convertedValueType: typeof convertedValue
    })

    return convertedValue
  }

  /**
   * 根据类型分支处理数据获取
   */
  async fetchData(item: DataItem): Promise<any> {
    try {
      switch (item.type) {
        case 'json':
          return await this.fetchJsonData(item.config)
        case 'http':
          return await this.fetchHttpData(item.config)
        case 'websocket':
          return await this.fetchWebSocketData(item.config)
        case 'script':
          return await this.fetchScriptData(item.config)
        default:
          return {}
      }
    } catch (error) {
      return {} // 统一错误处理：返回空对象
    }
  }

  /**
   * 获取JSON数据
   */
  private async fetchJsonData(config: JsonDataItemConfig): Promise<any> {
    try {
      const data = JSON.parse(config.jsonString)
      return data
    } catch (error) {
      return {}
    }
  }

  /**
   * 获取HTTP数据 - 使用项目封装的request库，支持脚本处理
   *
   * 重要修复：
   * 1. 使用项目统一的request库，而不是原生fetch
   * 2. 支持项目的认证、拦截器、错误处理机制
   * 3. 区分GET/HEAD和POST/PUT/PATCH/DELETE方法的参数处理
   * 4. GET/HEAD请求：参数作为query参数，不设置body
   * 5. 其他方法：可以包含body数据
   * 6. 支持新的HttpConfig格式和旧格式的兼容
   * 7. 集成convertValue进行正确的类型转换
   * 8. 🔥 新增：支持请求前脚本和响应后脚本处理
   *
   * @param config HTTP配置，支持HttpDataItemConfig格式
   * @returns Promise<any> HTTP响应数据，失败时返回空对象
   */
  private async fetchHttpData(config: HttpDataItemConfig): Promise<any> {
    // 🔥 步骤1：生成请求唯一标识符，用于去重
    const requestKey = await this.generateRequestKey(config)
    if (process.env.NODE_ENV === 'development') {
    }

    // 🔥 步骤2：检查是否有进行中的相同请求
    const existingRequest = this.requestCache.get(requestKey)
    if (existingRequest) {
      if (process.env.NODE_ENV === 'development') {
      }
      return await existingRequest
    }

    // 🔥 步骤3：创建并缓存请求Promise
    const requestPromise = this.executeHttpRequest(config, requestKey)
    this.requestCache.set(requestKey, requestPromise)

    // 🔥 步骤4：设置缓存清理定时器
    setTimeout(() => {
      this.requestCache.delete(requestKey)
    }, this.REQUEST_CACHE_TTL)

    return await requestPromise
  }

  /**
   * 🔥 实际执行HTTP请求的方法（从fetchHttpData中提取）
   */
  private async executeHttpRequest(config: HttpDataItemConfig, requestKey: string): Promise<any> {
    try {
      // 🔥 CRITICAL：验证参数绑定路径完整性
      this.validateParameterBindingPaths(config)

      // 第一步：处理请求前脚本
      if (config.preRequestScript) {
        try {
          const scriptResult = await defaultScriptEngine.execute(config.preRequestScript, { config })
          if (scriptResult.success && scriptResult.data) {
            Object.assign(config, scriptResult.data)
          }
        } catch (error) {
          console.error(`⚠️ [DataItemFetcher] 请求前脚本执行失败:`, error)
        }
      }

      // 构建请求参数
      const requestConfig: any = {
        timeout: config.timeout || 10000
      }

      // 添加headers
      if (config.headers && Object.keys(config.headers).length > 0) {
        requestConfig.headers = config.headers
        if (process.env.NODE_ENV === 'development') {
        }
      }

      // 处理参数
      let finalUrl = config.url
      const queryParams: Record<string, any> = {}

      // 统一处理路径参数
      // 优先使用新格式 pathParams，如果不存在则回退到旧格式 pathParameter
      if (config.pathParams && config.pathParams.length > 0) {
        if (process.env.NODE_ENV === 'development') {
        }
        for (const p of config.pathParams.filter(p => p.enabled)) { // 🔥 修复：移除p.key检查，因为key可能为空
          console.log(`🔥 [DataItemFetcher] 开始解析pathParams参数:`, {
            paramKey: p.key,
            paramValue: p.value,
            isDynamic: p.isDynamic,
            valueMode: p.valueMode,
            selectedTemplate: p.selectedTemplate,
            defaultValue: p.defaultValue,
            variableName: p.variableName
          })

          const resolvedValue = await this.resolveParameterValue(p)

          console.log(`🔥 [DataItemFetcher] pathParams解析结果:`, {
            paramKey: p.key,
            paramValue: p.value,
            resolvedValue,
            resolvedValueType: typeof resolvedValue,
            originalUrl: finalUrl,
            willUseValue: resolvedValue !== null
          })

          if (resolvedValue !== null) {
            // 🔥 修复：路径参数key为空时，自动匹配URL中的第一个占位符
            let placeholder = p.key ? `{${p.key}}` : null

            if (!placeholder || placeholder === '{}') {
              // 🔥 自动检测URL中的占位符
              const placeholderMatch = finalUrl.match(/\{([^}]+)\}/)
              if (placeholderMatch) {
                placeholder = placeholderMatch[0] // 完整的 {id} 格式
                console.log(`🔥 [DataItemFetcher] 自动检测到路径占位符: ${placeholder}`)
              }
            }

            console.log(`🔥 [DataItemFetcher] 准备替换URL占位符:`, {
              placeholder,
              resolvedValue,
              resolvedValueString: String(resolvedValue),
              currentUrl: finalUrl,
              包含占位符: finalUrl.includes(placeholder)
            })

            if (placeholder && finalUrl.includes(placeholder)) {
              const oldUrl = finalUrl
              finalUrl = finalUrl.replace(placeholder, String(resolvedValue))
              console.log(`✅ [DataItemFetcher] 路径参数替换成功:`, {
                placeholder,
                resolvedValue,
                旧URL: oldUrl,
                新URL: finalUrl
              })
            } else {
              console.error(`❌ [DataItemFetcher] 路径参数占位符未找到:`, {
                placeholder,
                resolvedValue,
                currentUrl: finalUrl,
                所有占位符: finalUrl.match(/\{[^}]+\}/g)
              })
            }
          } else {
            console.warn(`⚠️ [DataItemFetcher] pathParams参数解析为null，跳过:`, {
              paramKey: p.key,
              paramValue: p.value
            })
          }
        }
      } else if (config.pathParameter) {
        if (process.env.NODE_ENV === 'development') {
        }

        console.log(`🔥 [DataItemFetcher] 开始解析pathParameter参数:`, {
          paramKey: config.pathParameter.key,
          paramValue: config.pathParameter.value,
          isDynamic: config.pathParameter.isDynamic,
          valueMode: config.pathParameter.valueMode,
          selectedTemplate: config.pathParameter.selectedTemplate,
          defaultValue: config.pathParameter.defaultValue,
          variableName: config.pathParameter.variableName
        })

        const resolvedValue = await this.resolveParameterValue(config.pathParameter as HttpParameter)

        console.log(`🔥 [DataItemFetcher] pathParameter解析结果:`, {
          paramKey: config.pathParameter.key,
          paramValue: config.pathParameter.value,
          resolvedValue,
          resolvedValueType: typeof resolvedValue,
          originalUrl: finalUrl,
          willUseValue: resolvedValue !== null
        })

        if (resolvedValue !== null && resolvedValue && String(resolvedValue).trim() !== '') {
          const pathParam = config.pathParameter as HttpParameter

          // 🔥 修复：pathParameter的key为空时，自动匹配URL中的第一个占位符
          let placeholder = pathParam.key ? `{${pathParam.key}}` : null

          if (!placeholder || placeholder === '{}') {
            // 🔥 自动检测URL中的占位符
            const placeholderMatch = finalUrl.match(/\{([^}]+)\}/)
            if (placeholderMatch) {
              placeholder = placeholderMatch[0] // 完整的 {id} 格式
              console.log(`🔥 [DataItemFetcher] pathParameter自动检测到占位符: ${placeholder}`)
            }
          }

          console.log(`🔥 [DataItemFetcher] pathParameter准备替换URL占位符:`, {
            placeholder,
            resolvedValue,
            resolvedValueString: String(resolvedValue),
            currentUrl: finalUrl,
            包含占位符: finalUrl.includes(placeholder)
          })

          if (placeholder && finalUrl.includes(placeholder)) {
            const oldUrl = finalUrl
            finalUrl = finalUrl.replace(placeholder, String(resolvedValue))
            console.log(`✅ [DataItemFetcher] pathParameter替换成功:`, {
              placeholder,
              resolvedValue,
              旧URL: oldUrl,
              新URL: finalUrl
            })
          } else {
            console.error(`❌ [DataItemFetcher] pathParameter占位符未找到:`, {
              placeholder,
              resolvedValue,
              currentUrl: finalUrl,
              所有占位符: finalUrl.match(/\{[^}]+\}/g)
            })
          }
        } else {
          console.warn(`⚠️ [DataItemFetcher] pathParameter参数解析为空，跳过:`, {
            paramKey: config.pathParameter.key,
            paramValue: config.pathParameter.value,
            resolvedValue
          })
        }
      }

      // 处理查询参数
      if (config.params && config.params.length > 0) {
        if (process.env.NODE_ENV === 'development') {
        }
        for (const p of config.params.filter(p => p.enabled && p.key)) {
          const resolvedValue = await this.resolveParameterValue(p)
          console.log(`🔥 [DataItemFetcher] 查询参数解析结果:`, {
            paramKey: p.key,
            paramValue: p.value,
            paramValueMode: p.valueMode,
            paramDefaultValue: p.defaultValue,
            resolvedValue,
            willAddToQuery: resolvedValue !== null
          })
          if (resolvedValue !== null) {
            queryParams[p.key] = resolvedValue
          }
        }
      }

      // 向后兼容：统一参数系统
      else if (config.parameters && config.parameters.length > 0) {
        if (process.env.NODE_ENV === 'development') {
        }
        for (const p of config.parameters.filter(p => p.enabled && p.key)) {
          const resolvedValue = await this.resolveParameterValue(p)
          if (process.env.NODE_ENV === 'development') {
          }
          if (resolvedValue !== null) {
            switch (p.paramType) {
              case 'path':
                // 🔥 修复：路径参数的拼接逻辑，避免直接字符串拼接
                if (resolvedValue && String(resolvedValue).trim() !== '') {
                  const separator = finalUrl.endsWith('/') ? '' : '/'
                  finalUrl = finalUrl + separator + String(resolvedValue)
                  if (process.env.NODE_ENV === 'development') {
                  }
                }
                break
              case 'query':
                queryParams[p.key] = resolvedValue
                if (process.env.NODE_ENV === 'development') {
                }
                break
              case 'header':
                requestConfig.headers = requestConfig.headers || {}
                requestConfig.headers[p.key] = String(resolvedValue)
                if (process.env.NODE_ENV === 'development') {
                }
                break
            }
          }
        }
      }

      if (Object.keys(queryParams).length > 0) {
        requestConfig.params = queryParams
        if (process.env.NODE_ENV === 'development') {
        }
      }

      // 处理请求体
      let requestBody = undefined
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method) && config.body) {
        try {
          requestBody = typeof config.body === 'string' ? JSON.parse(config.body) : config.body
          if (process.env.NODE_ENV === 'development') {
          }
        } catch {
          requestBody = config.body
        }
      }

      if (process.env.NODE_ENV === 'development') {
      }

      // 🔥 关键调试：输出最终的请求信息
      console.log(`🔥 [DataItemFetcher] 最终HTTP请求信息:`, {
        finalUrl,
        method: config.method,
        queryParams,
        requestConfig,
        hasBody: !!requestBody,
        bodyContent: requestBody
      })

      // 发起HTTP请求
      let response
      switch (config.method.toUpperCase()) {
        case 'GET':
          if (process.env.NODE_ENV === 'development') {
          }
          response = await request.get(finalUrl, requestConfig)
          break
        case 'POST':
          if (process.env.NODE_ENV === 'development') {
          }
          response = await request.post(finalUrl, requestBody, requestConfig)
          break
        case 'PUT':
          if (process.env.NODE_ENV === 'development') {
          }
          response = await request.put(finalUrl, requestBody, requestConfig)
          break
        case 'PATCH':
          if (process.env.NODE_ENV === 'development') {
          }
          response = await request.patch(finalUrl, requestBody, requestConfig)
          break
        case 'DELETE':
          if (process.env.NODE_ENV === 'development') {
          }
          response = await request.delete(finalUrl, requestConfig)
          break
        default:
          throw new Error(`不支持的HTTP方法: ${config.method}`)
      }

      if (process.env.NODE_ENV === 'development') {
      }

      // 第三步：处理响应后脚本
      let finalResponse = response
      if (config.postResponseScript) {
        try {
          const scriptResult = await defaultScriptEngine.execute(config.postResponseScript, { response })
          if (scriptResult.success) {
            finalResponse = scriptResult.data !== undefined ? scriptResult.data : response
          }
        } catch (error) {
          console.error(`⚠️ [DataItemFetcher] 响应后脚本执行失败:`, error)
        }
      }

      return finalResponse
    } catch (error) {
      console.error(`❌ [DataItemFetcher] fetchHttpData 执行失败:`, {
        url: config.url,
        method: config.method,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      })
      return {}
    }
  }

  /**
   * 🔥 调试工具：验证参数绑定路径完整性
   * 帮助用户快速发现参数绑定路径损坏问题
   */
  private validateParameterBindingPaths(config: HttpDataItemConfig): void {
    const allParams: HttpParameter[] = []

    // 收集所有参数
    if (config.pathParams) allParams.push(...config.pathParams)
    if (config.pathParameter) allParams.push(config.pathParameter as HttpParameter)
    if (config.params) allParams.push(...config.params)
    if (config.parameters) allParams.push(...config.parameters)

    console.log(`🔥 [DEBUG] HTTP配置完整信息:`, {
      config,
      pathParamsCount: config.pathParams?.length || 0,
      pathParameterExists: !!config.pathParameter,
      paramsCount: config.params?.length || 0,
      parametersCount: config.parameters?.length || 0,
      totalParams: allParams.length
    })

    // 检查每个参数的绑定路径完整性
    allParams.forEach((param, index) => {
      console.log(`🔥 [DEBUG] 参数${index + 1}完整信息:`, {
        完整参数对象: param,
        key: param.key,
        value: param.value,
        enabled: param.enabled,
        selectedTemplate: param.selectedTemplate,
        valueMode: param.valueMode,
        variableName: param.variableName,
        defaultValue: param.defaultValue,
        dataType: param.dataType,
        paramType: param.paramType
      })

      if (param.selectedTemplate === 'component-property-binding' || param.valueMode === 'component') {
        let bindingPath = param.value

        // 🔥 关键修复：在验证阶段也应用智能修复逻辑
        if (!bindingPath || !bindingPath.includes('.')) {
          // 尝试从variableName重建绑定路径（与resolveParameterValue中的逻辑保持一致）
          if (param.variableName && param.variableName.includes('_')) {
            const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
            if (lastUnderscoreIndex > 0) {
              const componentId = param.variableName.substring(0, lastUnderscoreIndex)
              const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
              const reconstructedPath = `${componentId}.base.${propertyName}`

              console.log(`🔧 [validateParameterBindingPaths] 应用智能修复:`, {
                原始值: param.value,
                variableName: param.variableName,
                重建路径: reconstructedPath
              })

              bindingPath = reconstructedPath

              // 🔥 重要：不直接修改参数对象，避免污染原始配置
              // 只在当前执行上下文中使用修复后的路径
              console.log(`✅ [validateParameterBindingPaths] 已在当前上下文中使用修复后的路径: ${reconstructedPath}`)
              console.warn(`⚠️ [validateParameterBindingPaths] 注意：这只是临时修复，需要找到绑定路径损坏的根本原因！`)
            }
          }
        }

        const isValidPath = bindingPath && typeof bindingPath === 'string' && bindingPath.includes('.')

        console.log(`🔥 [BINDING_PATH_CHECK] 参数绑定路径验证:`, {
          paramKey: param.key || 'unknown',
          绑定路径: bindingPath,
          路径类型: typeof bindingPath,
          是否有效格式: isValidPath,
          预期格式: 'componentId.layer.propertyName',
          状态: isValidPath ? '✅ 正常' : '❌ 损坏',
          参数模式: param.selectedTemplate || param.valueMode,
          默认值: param.defaultValue
        })

        if (!isValidPath) {
          console.error(`❌ [CRITICAL] 发现损坏的参数绑定路径！`, {
            参数索引: index,
            参数key: param.key,
            绑定路径值: bindingPath,
            完整参数: param
          })
        }
      }
    })
  }

  /**
   * 🔥 生成HTTP请求的唯一标识符，用于去重
   * 基于URL、方法、参数等关键信息生成唯一key
   */
  private async generateRequestKey(config: HttpDataItemConfig): Promise<string> {
    // 收集所有影响请求的关键参数
    const keyComponents = [
      config.method || 'GET',
      config.url || '',
    ]

    // 添加路径参数
    if (config.pathParams && config.pathParams.length > 0) {
      const pathParams = []
      for (const p of config.pathParams.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        console.log(`🔥 [generateRequestKey] pathParams参数解析:`, {
          paramKey: p.key,
          paramValue: p.value,
          resolvedValue,
          参数模式: p.selectedTemplate || p.valueMode
        })
        pathParams.push(`${p.key}=${resolvedValue}`)
      }
      pathParams.sort() // 排序确保一致性
      keyComponents.push(`path:${pathParams.join('&')}`)
    }

    // 添加旧路径参数格式
    if (config.pathParameter) {
      const resolvedValue = await this.resolveParameterValue(config.pathParameter as HttpParameter)
      console.log(`🔥 [generateRequestKey] pathParameter参数解析:`, {
        paramKey: config.pathParameter.key,
        paramValue: config.pathParameter.value,
        resolvedValue,
        参数模式: (config.pathParameter as HttpParameter).selectedTemplate || (config.pathParameter as HttpParameter).valueMode
      })
      keyComponents.push(`pathParam:${resolvedValue}`)
    }

    // 添加查询参数
    if (config.params && config.params.length > 0) {
      const queryParams = []
      for (const p of config.params.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        queryParams.push(`${p.key}=${resolvedValue}`)
      }
      queryParams.sort() // 排序确保一致性
      keyComponents.push(`query:${queryParams.join('&')}`)
    }

    // 添加统一参数（向后兼容）
    if (config.parameters && config.parameters.length > 0) {
      const unifiedParams = []
      for (const p of config.parameters.filter(p => p.enabled && p.key)) {
        const resolvedValue = await this.resolveParameterValue(p)
        unifiedParams.push(`${p.key}=${resolvedValue}`)
      }
      unifiedParams.sort()
      keyComponents.push(`unified:${unifiedParams.join('&')}`)
    }

    // 添加请求体（对于POST/PUT等方法）
    if (config.body && typeof config.body === 'object') {
      keyComponents.push(`body:${JSON.stringify(config.body)}`)
    }

    // 生成最终的key（使用简单哈希避免过长）
    const fullKey = keyComponents.join('|')
    const finalKey = `http_${this.simpleHash(fullKey)}`

    console.log(`🔥 [generateRequestKey] 生成请求唯一标识:`, {
      url: config.url,
      method: config.method,
      keyComponents,
      fullKey,
      finalKey
    })

    return finalKey
  }

  /**
   * 🔥 简单哈希函数，避免requestKey过长
   */
  private simpleHash(str: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }

    return Math.abs(hash).toString(36) // 转为36进制字符串
  }

  /**
   * 获取WebSocket数据 (暂时实现为占位符)
   */
  private async fetchWebSocketData(_config: WebSocketDataItemConfig): Promise<any> {
    return {}
  }

  /**
   * 执行脚本获取数据 (使用 script-engine 安全执行)
   */
  private async fetchScriptData(config: ScriptDataItemConfig): Promise<any> {
    try {
      // 使用 script-engine 安全执行脚本
      const result = await defaultScriptEngine.execute(config.script, config.context || {})

      if (result.success) {
        return result.data || {}
      } else {
        return {}
      }
    } catch (error) {
      return {}
    }
  }
}
