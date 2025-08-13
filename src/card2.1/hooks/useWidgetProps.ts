/**
 * useWidgetProps Hook
 * 配置驱动的动态数据源重构方案的核心Hook
 * 连接"配置"和"组件渲染"的唯一桥梁
 */

import { ref, onUnmounted, watch, reactive } from 'vue'
import type { Ref } from 'vue'
import type { ComponentDefinition, WidgetConfiguration } from '../core/types'
import { dataSourceCenter } from '../core/data-sources'
import type { DataSourceSubscription } from '../core/data-source-center'

// Hook 的返回值结构
export interface UseWidgetPropsReturn {
  /** 传递给组件的最终props */
  props: Ref<Record<string, any>>
  /** 是否正在加载数据 */
  isLoading: Ref<boolean>
  /** 加载或订阅过程中发生的错误 */
  error: Ref<Error | null>
  /** 手动刷新数据 */
  refresh: () => Promise<void>
}

/**
 * useWidgetProps Hook
 * @param definition 组件定义（响应式）
 * @param configuration 组件配置（响应式）
 * @returns Hook返回值
 */
export function useWidgetProps(
  definition: Ref<ComponentDefinition>,
  configuration: Ref<WidgetConfiguration>
): UseWidgetPropsReturn {
  // 状态初始化
  const props = ref<Record<string, any>>({})
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  // 用于存储所有数据源的取消订阅函数
  const subscriptions: DataSourceSubscription[] = []

  /**
   * 数据处理函数
   * 负责所有的数据解析和订阅逻辑
   */
  const resolveProps = async (): Promise<void> => {
    try {
      // 清空旧状态
      isLoading.value = true
      error.value = null

      // 取消所有旧的订阅
      subscriptions.forEach(subscription => {
        try {
          subscription.unsubscribe()
        } catch (err) {
          console.warn('⚠️ [useWidgetProps] 取消订阅时出错:', err)
        }
      })
      subscriptions.length = 0 // 清空数组

      const newProps: Record<string, any> = {}

      // 1. 处理静态参数（同步）
      const staticParams = definition.value.staticParams || []
      for (const param of staticParams) {
        const configValue = configuration.value.staticParams[param.key]
        newProps[param.key] = configValue !== undefined ? configValue : param.defaultValue
      }

      console.log(`📊 [useWidgetProps] 处理静态参数完成:`, newProps)

      // 2. 处理动态数据源（异步）
      const dataSources = definition.value.dataSources || []
      const dataSourcePromises: Promise<void>[] = []

      for (const dataSourceDef of dataSources) {
        const bindingConfig = configuration.value.dataSourceBindings[dataSourceDef.key]

        if (bindingConfig && bindingConfig.dataSourceId) {
          const promise = new Promise<void>((resolve, reject) => {
            const dataSource = dataSourceCenter.getDataSource(bindingConfig.dataSourceId)

            if (!dataSource) {
              console.warn(`⚠️ [useWidgetProps] 数据源不存在: ${bindingConfig.dataSourceId}`)
              // 使用默认值而不是报错
              for (const [sourceField, mapping] of Object.entries(dataSourceDef.fieldMappings)) {
                const targetField = bindingConfig.fieldMappings[sourceField] || mapping.targetField
                newProps[targetField] = mapping.defaultValue
              }
              resolve()
              return
            }

            // 订阅数据源
            const subscription = dataSource.subscribe(data => {
              try {
                // 执行字段映射转换
                for (const [sourceField, mapping] of Object.entries(dataSourceDef.fieldMappings)) {
                  const targetField = bindingConfig.fieldMappings[sourceField] || mapping.targetField
                  let value = data[sourceField]

                  // 应用数据转换
                  if (mapping.transform && value !== undefined) {
                    try {
                      // 简单的函数字符串执行（生产环境中应该使用更安全的方式）
                      const transformFunc = new Function('value', `return ${mapping.transform}`)
                      value = transformFunc(value)
                    } catch (transformError) {
                      console.warn(`⚠️ [useWidgetProps] 数据转换失败:`, transformError)
                      value = mapping.defaultValue
                    }
                  }

                  // 如果值为undefined，使用默认值
                  if (value === undefined) {
                    value = mapping.defaultValue
                  }

                  newProps[targetField] = value
                }

                // 更新props（触发响应式更新）
                props.value = { ...newProps }
                console.log(`📊 [useWidgetProps] 数据源更新:`, bindingConfig.dataSourceId, newProps)
              } catch (mappingError) {
                console.error(`❌ [useWidgetProps] 字段映射失败:`, mappingError)
                error.value = mappingError as Error
              }
            })

            if (subscription) {
              subscriptions.push(subscription)
              console.log(`📺 [useWidgetProps] 订阅数据源成功: ${bindingConfig.dataSourceId}`)
              resolve()
            } else {
              reject(new Error(`数据源订阅失败: ${bindingConfig.dataSourceId}`))
            }
          })

          dataSourcePromises.push(promise)
        } else {
          // 没有绑定配置，使用默认值
          for (const [sourceField, mapping] of Object.entries(dataSourceDef.fieldMappings)) {
            newProps[mapping.targetField] = mapping.defaultValue
          }
        }
      }

      // 等待所有数据源订阅完成
      await Promise.all(dataSourcePromises)

      // 初始设置props
      props.value = newProps

      // 加载完成
      isLoading.value = false

      console.log(`✅ [useWidgetProps] 数据解析完成，${dataSources.length} 个数据源，${staticParams.length} 个静态参数`)
    } catch (err) {
      console.error(`❌ [useWidgetProps] 数据解析失败:`, err)
      error.value = err as Error
      isLoading.value = false
    }
  }

  /**
   * 手动刷新数据
   */
  const refresh = async (): Promise<void> => {
    await resolveProps()
  }

  // 监听配置变化 - 使用 immediate: true 确保组件挂载时立即执行
  watch(
    [definition, configuration],
    () => {
      console.log(`🔄 [useWidgetProps] 配置变化，重新解析数据`)
      resolveProps()
    },
    {
      deep: true,
      immediate: true // 🔑 关键修复：确保在组件挂载时立即执行，解决刷新后数据丢失问题
    }
  )

  // 清理副作用
  onUnmounted(() => {
    console.log(`🧹 [useWidgetProps] 组件卸载，清理 ${subscriptions.length} 个订阅`)
    subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe()
      } catch (err) {
        console.warn('⚠️ [useWidgetProps] 清理订阅时出错:', err)
      }
    })
    subscriptions.length = 0
  })

  return {
    props,
    isLoading,
    error,
    refresh
  }
}
