<template>
  <div 
    ref="containerRef"
    :data-component-id="props.nodeId"
    class="card2-wrapper"
    @click="handleWrapperClick"
    @contextmenu="handleContextMenu"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- 🔥 组件渲染 - 基于统一配置架构 -->
    <component
      v-if="currentComponentDef?.component"
      :is="currentComponentDef.component"
      ref="currentComponentRef"
      :config="displayData"
      :data="componentDataFromWarehouse"
      :component-id="props.nodeId"
      class="card2-component"
    />
    
    <!-- 组件加载失败提示 -->
    <n-alert v-else-if="!currentComponentDef?.component" type="error" size="small">
      组件 {{ props.componentType }} 未找到或加载失败
    </n-alert>
  </div>
</template>

<script setup lang="ts">
/**
 * 🔥 Card2Wrapper - 统一配置架构版本
 * 基于新的统一配置架构，实现完整的配置管理
 */

import { ref, onMounted, onUnmounted, computed, inject, nextTick, watch } from 'vue'
import { NAlert } from 'naive-ui'
import { useComponentTree as useCard2Integration } from '@/card2.1/hooks/useComponentTree'
import { useCard2Props } from '@/card2.1/hooks/useCard2Props'
import { usePreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
import type {
  InteractionConfig,
  InteractionEventType,
  InteractionResponse,
  ComponentInteractionCapability
} from '@/card2.1/core/interaction-types'
// 🔥 导入DataWarehouse以获取数据源执行结果
import { dataWarehouse } from '@/core/data-architecture/DataWarehouse'
// 🔥 导入配置管理器和数据桥接器
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 🔥 导入交互配置路由器
import { interactionConfigRouter } from '@/components/visual-editor/configuration/InteractionConfigRouter'

interface Props {
  componentType: string
  config?: any
  data?: any
  nodeId: string
  previewMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  previewMode: false
})

// 基础引用
const currentComponentRef = ref<any>(null)
const containerRef = ref<HTMLElement | null>(null)

// 获取组件定义
const { filteredComponents } = useCard2Integration()
const currentComponentDef = computed(() => {
  const found = filteredComponents.value?.find((comp: any) => comp.type === props.componentType)
  
  // 🔥 修复：如果没找到组件且组件列表为空，等待系统初始化
  if (!found && filteredComponents.value.length === 0 && props.componentType) {
    console.warn(`⚠️ [Card2Wrapper] 组件 ${props.componentType} 未找到，等待系统初始化`)
  }
  
  return found
})

// 注入编辑器上下文
const editorContext = inject('editorContext', null) as any

// 🔥 注入组件执行器注册表
const componentExecutorRegistry = inject('componentExecutorRegistry', null) as Map<string, () => Promise<void>> | null

// 🔥 预览模式检测
const { isPreviewMode } = usePreviewMode()

// 🔥 核心修复：从DataWarehouse获取数据源执行结果（响应式）
const componentDataFromWarehouse = computed(() => {
  try {
    // 🔥 响应式依赖：DataWarehouse内置的响应式通知机制
    const warehouseData = dataWarehouse.getComponentData(props.nodeId)

    console.log(`🔥 [Card2Wrapper] 从DataWarehouse获取数据 ${props.nodeId}:`, {
      hasData: !!warehouseData,
      dataType: typeof warehouseData,
      data: warehouseData,
      dataKeys: warehouseData ? Object.keys(warehouseData) : [],
      isEmpty: !warehouseData || Object.keys(warehouseData).length === 0,
      // 🔥 详细调试：检查DataWarehouse存储状态
      warehouseStats: dataWarehouse.getStorageStats()
    })

    // 🎯 用户要求的打印这几个字 - 阶段3：Card2Wrapper从DataWarehouse获取数据
    console.log(`🎯 用户要求的打印这几个字 - 阶段3：Card2Wrapper从DataWarehouse获取数据`, {
      componentId: props.nodeId,
      是否有数据: !!warehouseData,
      数据类型: typeof warehouseData,
      从DataWarehouse获取的原始数据: warehouseData,
      数据源数量: warehouseData ? Object.keys(warehouseData).length : 0,
      数据源列表: warehouseData ? Object.keys(warehouseData) : [],
      准备传给useCard2Props的数据: warehouseData || {}
    })

    return warehouseData || {}
  } catch (error) {
    console.error(`❌ [Card2Wrapper] 获取DataWarehouse数据失败 ${props.nodeId}:`, error)
    return {}
  }
})

// 🔥 核心：使用统一配置管理
const {
  config: componentConfig,
  displayData,
  unifiedConfig,
  updateConfig,
  updateUnifiedConfig,
  getFullConfiguration,
  setConfigChangeCallback,
  syncToEditor
} = useCard2Props({
  config: props.config || {},
  data: componentDataFromWarehouse, // 🔥 关键修复：传递响应式计算属性，而不是静态值
  componentId: props.nodeId,
  initialUnifiedConfig: getInitialUnifiedConfig()
})

/**
 * 获取初始统一配置
 * 从编辑器上下文或其他来源获取已有的配置
 */
function getInitialUnifiedConfig() {
  try {
    if (editorContext?.getNodeById) {
      const node = editorContext.getNodeById(props.nodeId)
      console.log(`🔥 [Card2Wrapper] 获取初始统一配置 ${props.nodeId}:`, {
        node: !!node,
        hasMetadata: !!node?.metadata,
        hasUnifiedConfig: !!node?.metadata?.unifiedConfig,
        hasInteractionConfig: !!node?.metadata?.unifiedConfig?.interaction,
        interactionConfigs: node?.metadata?.unifiedConfig?.interaction?.configs
      })
      if (node?.metadata?.unifiedConfig) {
        return node.metadata.unifiedConfig
      }
    }
  } catch (error) {
    console.warn(`[Card2Wrapper] 获取初始配置失败:`, error)
  }
  return undefined
}

console.log(`🔥 [Card2Wrapper] 统一配置架构初始化完成 ${props.nodeId}:`, {
  componentType: props.componentType,
  hasUnifiedConfig: !!unifiedConfig.value,
  hasComponentConfig: !!componentConfig.value,
  isPreviewMode: isPreviewMode.value,
  interactionEnabled: isPreviewMode.value
})

// 配置变更回调
setConfigChangeCallback((config) => {
  console.log(`🔥 [Card2Wrapper] 配置变更回调 ${props.nodeId}:`, config)
})

// ================== 交互系统集成 ==================

// 🔥 统一配置中心：交互配置基于 unifiedConfig
const interactionConfigs = computed<InteractionConfig[]>(() => {
  return unifiedConfig.value.interaction?.configs || []
})

// 🔥 统一配置中心：数据源配置基于 unifiedConfig
const dataSourceConfig = computed(() => {
  return unifiedConfig.value.dataSource || {}
})

// 获取组件的交互能力
const componentInteractionCapability = computed<ComponentInteractionCapability | undefined>(() => {
  return currentComponentDef.value?.interactionCapabilities
})

// 🔥 批量执行交互响应 - 解决多属性修改相互覆盖问题
const executeBatchedInteractionResponses = async (responses: InteractionResponse[]) => {
  console.log(`🎯 [Card2Wrapper] 批量执行交互响应:`, responses)

  // 按组件ID和动作类型分组响应
  const groupedResponses = {
    self: { modify: [] as InteractionResponse[], other: [] as InteractionResponse[] },
    cross: new Map<string, InteractionResponse[]>(),  // componentId -> responses
    nonModify: [] as InteractionResponse[]  // 跳转等非修改动作
  }

  // 分类所有响应
  for (const response of responses) {
    if (response.action === 'modify' || response.action === 'modifyProperty' || response.action === 'updateComponentData') {
      if (response.modifyConfig) {
        const { targetComponentId } = response.modifyConfig

        if (targetComponentId === props.nodeId) {
          // 修改自己
          groupedResponses.self.modify.push(response)
        } else {
          // 修改其他组件
          if (!groupedResponses.cross.has(targetComponentId)) {
            groupedResponses.cross.set(targetComponentId, [])
          }
          groupedResponses.cross.get(targetComponentId)!.push(response)
        }
      }
    } else {
      // 非修改动作（跳转等）
      groupedResponses.nonModify.push(response)
    }
  }

  console.log(`🎯 [Card2Wrapper] 响应分组结果:`, {
    自组件修改: groupedResponses.self.modify.length,
    跨组件修改: Array.from(groupedResponses.cross.entries()).map(([id, resps]) => ({ id, count: resps.length })),
    非修改动作: groupedResponses.nonModify.length
  })

  // 🔥 关键修复1：批量处理自组件属性修改
  if (groupedResponses.self.modify.length > 0) {
    const batchedSelfUpdates = {}

    groupedResponses.self.modify.forEach(response => {
      if (response.modifyConfig) {
        const { targetProperty, updateValue } = response.modifyConfig
        batchedSelfUpdates[targetProperty] = updateValue
        console.log(`🎯 [Card2Wrapper] 收集自组件修改: ${targetProperty} = ${updateValue}`)
      }
    })

    console.log(`🎯 [Card2Wrapper] 批量修改自己的属性:`, batchedSelfUpdates)

    // 🔥 恢复原始逻辑：自组件修改用 updateConfig，保持与配置表单同步
    updateConfig('component', batchedSelfUpdates)
    console.log(`✅ [Card2Wrapper] 自组件批量修改完成`)
  }

  // 🔥 关键修复2：批量处理跨组件属性修改
  for (const [targetComponentId, targetResponses] of groupedResponses.cross.entries()) {
    const batchedCrossUpdates = {}

    targetResponses.forEach(response => {
      if (response.modifyConfig) {
        const { targetProperty, updateValue } = response.modifyConfig
        batchedCrossUpdates[targetProperty] = updateValue
        console.log(`🎯 [Card2Wrapper] 收集跨组件修改: ${targetComponentId}.${targetProperty} = ${updateValue}`)
      }
    })

    console.log(`🎯 [Card2Wrapper] 批量修改其他组件 ${targetComponentId}:`, batchedCrossUpdates)

    try {
      // 批量更新目标组件的多个属性
      configurationManager.updateConfigurationForInteraction(
        targetComponentId,
        'component',
        batchedCrossUpdates,  // 🔥 关键：传递批量更新对象
        'cross-component-interaction'
      )
      console.log(`✅ [Card2Wrapper] 跨组件批量修改完成: ${targetComponentId}`)
    } catch (error) {
      console.error(`❌ [Card2Wrapper] 跨组件批量修改失败 ${targetComponentId}:`, error)
    }
  }

  // 处理非修改动作（跳转等）
  for (const response of groupedResponses.nonModify) {
    console.log(`🎯 [Card2Wrapper] 执行非修改响应:`, response)
    const delay = response.delay || 0
    setTimeout(() => {
      executeInteractionResponse(response)
    }, delay)
  }
}

// 交互事件执行器（处理非属性修改动作）
const executeInteractionResponse = async (response: InteractionResponse) => {
  console.log(`🎯 [Card2Wrapper] 执行交互响应:`, response)

  try {
    switch (response.action) {
      case 'navigateToUrl':
      case 'jump':
        console.log(`🎯 [Card2Wrapper] 处理跳转动作:`, response)
        // 支持多种URL数据格式
        let url = response.jumpConfig?.url || response.value || response.url
        let target = response.jumpConfig?.target || response.target || '_self'

        if (url) {
          console.log(`🎯 [Card2Wrapper] 执行跳转: ${url} (${target})`)
          if (target === '_self') {
            window.location.href = url
          } else {
            window.open(url, target)
          }
        } else {
          console.warn(`🎯 [Card2Wrapper] 跳转URL未找到:`, response)
        }
        break

      case 'updateComponentData':
      case 'modifyProperty':
      case 'modify':
        // 🔥 修复说明：属性修改现在由 executeBatchedInteractionResponses 批量处理
        console.log(`🎯 [Card2Wrapper] 属性修改已由批量处理函数处理，跳过单独执行`)
        break

      case 'changeVisibility':
        // 改变可见性
        if (containerRef.value) {
          containerRef.value.style.visibility = response.value === 'visible' ? 'visible' : 'hidden'
        }
        break

      case 'changeBackgroundColor':
        // 改变背景颜色
        if (containerRef.value) {
          containerRef.value.style.backgroundColor = response.value
        }
        break

      case 'triggerAnimation':
        // 触发动画
        if (containerRef.value && response.value) {
          containerRef.value.style.animation = `${response.value} ${response.duration || 300}ms ease`
          setTimeout(() => {
            if (containerRef.value) {
              containerRef.value.style.animation = ''
            }
          }, response.duration || 300)
        }
        break

      default:
        console.warn(`🎯 [Card2Wrapper] 未支持的交互动作:`, response.action)
    }
  } catch (error) {
    console.error(`🎯 [Card2Wrapper] 交互响应执行失败:`, error)
  }
}

// 通用交互事件处理器
const handleInteractionEvent = async (eventType: InteractionEventType, event?: Event) => {
  // 🔥 关键修复：编辑模式下禁用交互，避免与编辑操作冲突
  if (!isPreviewMode.value) {
    console.log(`🔥 [Card2Wrapper] 编辑模式下交互被禁用 ${eventType} for ${props.nodeId}`)
    return // 编辑模式下不执行交互
  }

  if (!componentInteractionCapability.value?.supportedEvents.includes(eventType)) {
    console.log(`🎯 [Card2Wrapper] 组件不支持事件类型 ${eventType}`)
    return // 组件不支持此事件类型
  }

  console.log(`🎯 [Card2Wrapper] 预览模式下处理交互事件 ${eventType} for ${props.nodeId}`, {
    totalConfigs: interactionConfigs.value.length,
    configs: interactionConfigs.value,
    // 🔥 新增调试信息
    configEvents: interactionConfigs.value.map(c => c.event),
    enabledConfigs: interactionConfigs.value.filter(c => c.enabled !== false),
    matchingConfigs: interactionConfigs.value.filter(config => config.event === eventType && config.enabled !== false)
  })

  // 执行匹配的交互配置
  const matchingConfigs = interactionConfigs.value.filter(config =>
    config.event === eventType && config.enabled !== false
  )

  console.log(`🎯 [Card2Wrapper] 找到匹配配置:`, matchingConfigs)

  // 🔥 关键修复：将所有匹配配置的responses合并，避免多个配置相互覆盖
  const allResponses: InteractionResponse[] = []
  for (const config of matchingConfigs) {
    console.log(`🎯 [Card2Wrapper] 收集配置响应:`, config)
    allResponses.push(...config.responses)
  }

  console.log(`🎯 [Card2Wrapper] 合并所有响应进行批量处理:`, {
    总配置数: matchingConfigs.length,
    总响应数: allResponses.length,
    响应列表: allResponses
  })

  // 一次性批量处理所有响应，避免配置间相互覆盖
  if (allResponses.length > 0) {
    await executeBatchedInteractionResponses(allResponses)
  }
}

// ================== 事件处理 ==================

const handleWrapperClick = async (event: MouseEvent) => {
  console.log(`🔥 [Card2Wrapper] 点击事件 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)

  // 执行交互响应（内部已有预览模式检查）
  await handleInteractionEvent('click', event)
  
  // 原有的预览模式逻辑保持兼容性
  if (!props.previewMode) return
}

const handleContextMenu = (event: MouseEvent) => {
  console.log(`🔥 [Card2Wrapper] 右键菜单 ${props.nodeId}`)
  event.preventDefault() // 阻止默认右键菜单
}

// 新增交互事件处理函数
const handleMouseEnter = async (event: MouseEvent) => {
  console.log(`🎯 [Card2Wrapper] 鼠标进入 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  await handleInteractionEvent('hover', event)
}

const handleMouseLeave = (event: MouseEvent) => {
  console.log(`🎯 [Card2Wrapper] 鼠标离开 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  // hover事件的离开可以触发一些重置操作
}

const handleFocus = async (event: FocusEvent) => {
  console.log(`🎯 [Card2Wrapper] 获得焦点 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  await handleInteractionEvent('focus', event)
}

const handleBlur = async (event: FocusEvent) => {
  console.log(`🎯 [Card2Wrapper] 失去焦点 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  await handleInteractionEvent('blur', event)
}

// 🔥 监听来自编辑器层的配置更新事件
const handleConfigUpdateEvent = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.nodeId) {
    console.log(`🔍 [TRACE-8] Card2Wrapper.handleConfigUpdateEvent 被调用:`, {
      componentId,
      layer,
      config,
      callStack: new Error().stack?.split('\n').slice(1, 5)
    })

    if (layer === 'interaction') {
      console.log(`🔍 [TRACE-9] 这是 interaction 配置更新事件:`, {
        componentId,
        configsCount: config?.configs?.length || 0,
        willCallUpdateConfig: true,
        oldInteractionConfigs: interactionConfigs.value
      })

      // 🔥 统一配置中心：通过updateConfig更新交互配置
      if (config?.configs) {
        updateConfig('interaction', { configs: config.configs })
        console.log(`✅ [Card2Wrapper] 交互配置已通过统一配置中心更新:`, {
          newConfigs: config.configs,
          configsCount: config.configs.length
        })
      }
    } else {
      // 非交互配置正常处理
      updateConfig(layer, config)
    }

    console.log(`🔍 [TRACE-10] Card2Wrapper.handleConfigUpdateEvent 处理完成:`, {
      componentId,
      layer
    })
  }
}

// 🔥 响应配置请求事件
const handleConfigRequestEvent = (event: CustomEvent) => {
  const { componentId, layer } = event.detail
  if (componentId === props.nodeId) {
    console.log(`🔥 [Card2Wrapper] 接收到配置请求事件 ${componentId}:`, { layer })
    
    const fullConfig = getFullConfiguration()
    const requestedConfig = layer ? fullConfig[layer] : fullConfig
    
    // 发送配置响应事件
    window.dispatchEvent(new CustomEvent('card2-config-response', {
      detail: {
        componentId,
        layer,
        config: requestedConfig
      }
    }))
  }
}

// ================== 交互配置管理 ==================

// 更新交互配置
const updateInteractionConfigs = (configs: InteractionConfig[]) => {
  console.log(`🔍 [TRACE-11] Card2Wrapper.updateInteractionConfigs 被调用:`, {
    nodeId: props.nodeId,
    configCount: configs.length,
    configs: configs,
    callStack: new Error().stack?.split('\n').slice(1, 5)
  })

  console.log(`🔍 [TRACE-12] 通过统一配置中心更新交互配置:`, {
    nodeId: props.nodeId,
    configsLength: configs.length,
    willTriggerPersistence: true
  })

  // 🔥 统一配置中心：直接通过updateConfig更新，计算属性会自动响应
  updateConfig('interaction', { configs })

  console.log(`🔍 [TRACE-13] updateConfig('interaction', { configs }) 调用完成`)
}

// 获取交互配置
const getInteractionConfigs = (): InteractionConfig[] => {
  return interactionConfigs.value
}

// 获取组件交互能力
const getInteractionCapability = (): ComponentInteractionCapability | undefined => {
  return componentInteractionCapability.value
}

// ================== 属性变化监听系统 ==================

// 存储上一次的属性值，用于检测变化
const previousValues = ref<Record<string, any>>({})

// 监听displayData变化，检测属性改变事件
watch(
  () => displayData.value,
  (newDisplayData, oldDisplayData) => {
    if (!isPreviewMode.value) {
      // 编辑模式下不处理属性变化事件
      return
    }
    
    console.log(`🎯 [Card2Wrapper] DisplayData变化检测 ${props.nodeId}:`, {
      newData: newDisplayData,
      oldData: oldDisplayData,
      interactionConfigsCount: interactionConfigs.value.length
    })
    
    // 检查每个dataChange交互配置
    const dataChangeConfigs = interactionConfigs.value.filter(config =>
      config.event === 'dataChange' && config.enabled !== false
    )

    console.log(`🎯 [Card2Wrapper] DataChange配置:`, dataChangeConfigs)

    // 🔥 关键修复：收集所有触发的dataChange响应，进行批量处理
    const triggeredResponses: InteractionResponse[] = []

    for (const config of dataChangeConfigs) {
      // 🔥 修复：dataChange事件的监听属性存储在config.watchedProperty，不是response中
      if (config.watchedProperty) {
        const propertyPath = config.watchedProperty
        const newValue = getNestedValue(newDisplayData, propertyPath)
        const oldValue = getNestedValue(oldDisplayData || {}, propertyPath)

        console.log(`🎯 [Card2Wrapper] 检查属性变化:`, {
          property: propertyPath,
          newValue,
          oldValue,
          hasChanged: newValue !== oldValue,
          condition: config.condition
        })

        // 如果属性值发生了变化
        if (newValue !== oldValue) {
          // 检查执行条件（使用config.condition而不是response.executionCondition）
          if (checkDataChangeCondition(config.condition, newValue)) {
            console.log(`🎯 [Card2Wrapper] 属性变化触发交互:`, {
              property: propertyPath,
              value: newValue,
              condition: config.condition,
              responsesCount: config.responses.length
            })

            // 🔥 关键修复：收集响应而不是立即执行
            triggeredResponses.push(...config.responses)
            console.log(`🎯 [Card2Wrapper] 收集dataChange响应 ${config.responses.length} 个`)
          } else {
            console.log(`🎯 [Card2Wrapper] 条件不满足，不执行交互:`, {
              property: propertyPath,
              value: newValue,
              condition: config.condition
            })
          }
        }
      }
    }

    // 🔥 关键修复：批量执行所有触发的响应，避免相互覆盖
    if (triggeredResponses.length > 0) {
      console.log(`🎯 [Card2Wrapper] 批量执行dataChange触发的 ${triggeredResponses.length} 个响应`)

      // 延迟执行避免与同步更新冲突
      setTimeout(async () => {
        await executeBatchedInteractionResponses(triggeredResponses)
      }, 100)
    }
  },
  { deep: true }
)

// 获取嵌套对象属性值的辅助函数
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined
  
  // 支持点号分隔的路径，如 'base.deviceId' 或简单属性如 'title'
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

// 🔥 专门用于dataChange事件的条件检查函数
const checkDataChangeCondition = (condition: any, currentValue: any): boolean => {
  if (!condition) return true // 无条件直接执行
  
  console.log(`🎯 [Card2Wrapper] 检查dataChange执行条件:`, {
    condition,
    currentValue,
    conditionType: condition.type,
    conditionOperator: condition.operator,
    conditionValue: condition.value
  })
  
  switch (condition.type) {
    case 'comparison':
      const operator = condition.operator || 'equals'
      const targetValue = condition.value
      
      console.log(`🎯 [Card2Wrapper] DataChange比较条件:`, {
        operator,
        currentValue,
        targetValue,
        result: compareValues(currentValue, targetValue, operator)
      })
      
      return compareValues(currentValue, targetValue, operator)
      
    case 'range':
      return checkRangeCondition(currentValue, condition.value)
      
    case 'expression':
      return checkExpressionCondition(currentValue, condition.value)
      
    default:
      console.warn(`🎯 [Card2Wrapper] 未知的dataChange条件类型:`, condition.type)
      return true
  }
}

// 通用的执行条件检查函数（用于其他事件类型）
const checkExecutionCondition = (response: any, currentValue: any): boolean => {
  const condition = response.executionCondition
  if (!condition) return true // 无条件直接执行
  
  console.log(`🎯 [Card2Wrapper] 检查通用执行条件:`, {
    condition,
    currentValue,
    conditionType: condition.type,
    conditionValue: condition.value
  })
  
  switch (condition.type) {
    case 'equals':
    case 'comparison':
      const operator = condition.operator || '=='
      const targetValue = condition.value
      
      console.log(`🎯 [Card2Wrapper] 通用比较条件:`, {
        operator,
        currentValue,
        targetValue,
        result: compareValues(currentValue, targetValue, operator)
      })
      
      return compareValues(currentValue, targetValue, operator)
      
    case 'range':
      return checkRangeCondition(currentValue, condition.value)
      
    case 'expression':
      return checkExpressionCondition(currentValue, condition.value)
      
    default:
      console.warn(`🎯 [Card2Wrapper] 未知的通用条件类型:`, condition.type)
      return true
  }
}

// 值比较函数
const compareValues = (currentValue: any, targetValue: any, operator: string): boolean => {
  switch (operator) {
    case '==':
    case 'equals':
      return String(currentValue) === String(targetValue)
    case '!=':
    case 'notEquals':
      return String(currentValue) !== String(targetValue)
    case '>':
      return Number(currentValue) > Number(targetValue)
    case '>=':
      return Number(currentValue) >= Number(targetValue)
    case '<':
      return Number(currentValue) < Number(targetValue)
    case '<=':
      return Number(currentValue) <= Number(targetValue)
    default:
      return String(currentValue) === String(targetValue)
  }
}

// 范围检查函数
const checkRangeCondition = (currentValue: any, rangeValue: string): boolean => {
  // 简单实现，支持 "10-20" 格式
  const range = rangeValue.split('-').map(v => Number(v.trim()))
  if (range.length === 2) {
    const numValue = Number(currentValue)
    return numValue >= range[0] && numValue <= range[1]
  }
  return false
}

// 表达式检查函数
const checkExpressionCondition = (currentValue: any, expression: string): boolean => {
  try {
    // 简单的表达式检查，将${value}替换为实际值
    const expr = expression.replace(/\${value}/g, String(currentValue))
    // 这里应该使用安全的表达式求值器，暂时简化处理
    return eval(expr)
  } catch (error) {
    console.error(`🎯 [Card2Wrapper] 表达式执行失败:`, expression, error)
    return false
  }
}

// ================== 组件执行器 ==================

/**
 * 🔥 组件数据源执行器函数
 * 这是注册到 componentExecutorRegistry 的核心函数
 */
const executeComponentDataSource = async (): Promise<void> => {
  try {
    // 🎯 用户要求的打印这几个字 - 阶段0：Card2Wrapper组件执行器被调用
    console.log(`🎯 用户要求的打印这几个字 - 阶段0：Card2Wrapper组件执行器被调用`, {
      componentId: props.nodeId,
      componentType: props.componentType,
      触发方式: '通过componentExecutorRegistry注册的执行器'
    })

    // 获取当前组件的数据源配置
    const latestConfig = configurationManager.getConfiguration(props.nodeId)
    const dataSourceConfig = latestConfig?.dataSource

    if (!dataSourceConfig) {
      console.log(`🔥 [Card2Wrapper] 组件 ${props.nodeId} 没有数据源配置，跳过执行`)
      return
    }

    console.log(`🔥 [Card2Wrapper] 开始执行数据源:`, {
      componentId: props.nodeId,
      componentType: props.componentType,
      dataSourceConfig
    })

    // 🔥 使用 VisualEditorBridge 执行数据源
    const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
    const visualEditorBridge = getVisualEditorBridge()

    // 清除缓存确保获取最新数据
    simpleDataBridge.clearComponentCache(props.nodeId)

    // 执行数据源
    const result = await visualEditorBridge.updateComponentExecutor(
      props.nodeId,
      props.componentType,
      dataSourceConfig
    )

    console.log(`✅ [Card2Wrapper] 数据源执行完成 ${props.nodeId}:`, result)

    // 🔥 响应式更新：DataWarehouse已自动触发响应式通知，无需手动刷新
    console.log(`🎯 用户要求的打印这几个字 - 阶段1：数据源执行完成，等待DataWarehouse响应式更新`, {
      componentId: props.nodeId,
      执行结果: result.success,
      数据内容: result.data
    })

  } catch (error) {
    console.error(`❌ [Card2Wrapper] 数据源执行失败 ${props.nodeId}:`, error)
    throw error
  }
}

// ================== 生命周期 ==================

/**
 * 🔥 初始化数据源配置 - 通过配置变更触发数据源执行
 * 这是进入编辑器时触发数据源执行的正确方式
 */
const initializeDataSourceConfiguration = async () => {
  try {
    console.log(`🔥 [Card2Wrapper] 初始化数据源配置 ${props.nodeId}`)

    // 检查是否有数据源配置
    const currentConfig = configurationManager.getConfiguration(props.nodeId)
    const hasDataSourceConfig = currentConfig?.dataSource &&
      currentConfig.dataSource.dataSources &&
      currentConfig.dataSource.dataSources.length > 0

    if (hasDataSourceConfig) {
      console.log(`🔥 [Card2Wrapper] 组件 ${props.nodeId} 有数据源配置，触发配置变更执行`)

      // 🔥 关键：通过"触碰"配置来触发执行，而不是直接执行
      // 这样能确保所有监听器都被正确触发
      configurationManager.updateConfiguration(
        props.nodeId,
        'dataSource',
        currentConfig.dataSource,
        props.componentType
      )
    } else {
      console.log(`🔥 [Card2Wrapper] 组件 ${props.nodeId} 无数据源配置，跳过初始化`)
    }
  } catch (error) {
    console.error(`❌ [Card2Wrapper] 初始化数据源配置失败 ${props.nodeId}:`, error)
  }
}

// 🔥 监听组件定义变化，确保metadata始终同步
watch(
  () => currentComponentDef.value,
  (newDef, oldDef) => {
    if (newDef && newDef !== oldDef && editorContext?.updateNode) {
      const currentNode = editorContext.getNodeById(props.nodeId)
      if (currentNode) {
        const updatedMetadata = {
          ...currentNode.metadata,
          card2Definition: newDef,
          lastDefinitionUpdate: Date.now()
        }

        editorContext.updateNode(props.nodeId, {
          metadata: updatedMetadata
        })

        console.log(`🔥 [Card2Wrapper] 组件定义变化，已更新节点metadata ${props.nodeId}:`, {
          componentType: props.componentType,
          hasInteractionCapabilities: !!newDef?.interactionCapabilities,
          watchablePropertiesCount: Object.keys(newDef?.interactionCapabilities?.watchableProperties || {}).length
        })
      }
    }
  },
  { immediate: false }
)

onMounted(async () => {
  console.log(`🎯 用户要求的打印这几个字 - 阶段I0：Card2Wrapper组件${props.nodeId}开始挂载`)
  console.log(`🔥 [Card2Wrapper] 组件挂载完成 ${props.nodeId}`)

  // 🔥 新增：确保组件定义被注入到节点的metadata中
  if (currentComponentDef.value && editorContext?.updateNode) {
    const currentNode = editorContext.getNodeById(props.nodeId)
    if (currentNode) {
      const updatedMetadata = {
        ...currentNode.metadata,
        card2Definition: currentComponentDef.value,
        lastDefinitionUpdate: Date.now()
      }

      editorContext.updateNode(props.nodeId, {
        metadata: updatedMetadata
      })

      console.log(`🔥 [Card2Wrapper] 组件定义已注入到节点metadata ${props.nodeId}:`, {
        componentType: props.componentType,
        hasCard2Definition: !!currentComponentDef.value,
        hasInteractionCapabilities: !!currentComponentDef.value?.interactionCapabilities,
        watchableProperties: currentComponentDef.value?.interactionCapabilities?.watchableProperties
      })
    }
  }

  // 🔥 关键修复：注册组件执行器到执行器注册表
  if (componentExecutorRegistry) {
    componentExecutorRegistry.set(props.nodeId, executeComponentDataSource)
    console.log(`🔥 [Card2Wrapper] 组件执行器已注册 ${props.nodeId}`)
    console.log(`🎯 用户要求的打印这几个字 - 阶段I1：Card2Wrapper执行器注册完成，组件${props.nodeId}，注册表大小: ${componentExecutorRegistry.size}`)

    // 🔥 关键修复：执行器注册后，检查并重新触发已有配置的执行
    nextTick(async () => {
      try {
        // 检查是否已有配置（说明fetchBoard已经执行过）
        const existingConfig = configurationManager.getConfiguration(props.nodeId)
        if (existingConfig && existingConfig.dataSource) {
          console.log(`🎯 用户要求的打印这几个字 - 阶段I2a：Card2Wrapper发现已有数据源配置，重新触发执行`, {
            组件: props.nodeId,
            有数据源配置: !!existingConfig.dataSource,
            数据源详情: existingConfig.dataSource
          })

          // 直接调用执行器，重新执行数据源
          console.log(`🎯 用户要求的打印这几个字 - 阶段I2a.5：准备调用executeComponentDataSource，组件${props.nodeId}`)
          await executeComponentDataSource()
          console.log(`🎯 用户要求的打印这几个字 - 阶段I2b：Card2Wrapper重新执行数据源完成，组件${props.nodeId}`)
        } else {
          // 没有配置，执行初始化
          await initializeDataSourceConfiguration()
          console.log(`🎯 用户要求的打印这几个字 - 阶段I2c：Card2Wrapper主动触发数据源配置初始化完成，组件${props.nodeId}`)
        }
      } catch (error) {
        console.error(`❌ [Card2Wrapper] 组件挂载后数据源处理失败 ${props.nodeId}:`, error)
      }
    })
  } else {
    console.warn(`⚠️ [Card2Wrapper] 组件执行器注册表不可用 ${props.nodeId}`)
  }

  // 🔥 注释：数据源初始化已在执行器注册后进行，这里不需要重复调用

  // 🔥 统一配置中心：交互配置初始化由计算属性自动处理
  const savedConfigs = unifiedConfig.value.interaction?.configs as InteractionConfig[]
  if (savedConfigs && savedConfigs.length > 0) {
    console.log(`🎯 [Card2Wrapper] 从统一配置加载交互配置:`, {
      configsCount: savedConfigs.length,
      configs: savedConfigs
    })
  } else {
    console.log(`🎯 [Card2Wrapper] 统一配置中无交互配置，等待用户配置`)
  }

  // 监听配置更新和请求事件
  window.addEventListener('card2-config-update', handleConfigUpdateEvent as EventListener)
  window.addEventListener('card2-config-request', handleConfigRequestEvent as EventListener)

  // 🔥 注册组件实例到交互配置路由器
  nextTick(() => {
    const componentExpose = {
      getFullConfiguration,
      updateConfig,
      updateUnifiedConfig,
      getDisplayData: () => displayData.value,
      getUnifiedConfig: () => unifiedConfig.value,
      updateInteractionConfigs,
      getInteractionConfigs,
      getInteractionCapability,
      watchProperty: (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
        if (currentComponentRef.value?.watchProperty) {
          console.log(`🔥 [Card2Wrapper] 代理属性监听到组件实例: ${propertyName}`)
          return currentComponentRef.value.watchProperty(propertyName, callback)
        } else {
          console.warn(`🔥 [Card2Wrapper] 组件实例不支持watchProperty，使用fallback监听`)
          return watch(
            () => unifiedConfig.value.component?.[propertyName],
            (newValue, oldValue) => {
              if (newValue !== oldValue) {
                callback(newValue, oldValue)
              }
            },
            { immediate: false }
          )
        }
      }
    }

    console.log(`🔥 [Card2Wrapper] 向路由器注册组件实例: ${props.nodeId}`)
    interactionConfigRouter.registerComponentInstance(props.nodeId, componentExpose)
  })
})

// 清理事件监听
onUnmounted(() => {
  // 🔥 清理组件执行器注册
  if (componentExecutorRegistry) {
    componentExecutorRegistry.delete(props.nodeId)
    console.log(`🔥 [Card2Wrapper] 组件执行器已注销 ${props.nodeId}`)
  }

  // 🔥 清理交互配置路由器中的组件注册
  interactionConfigRouter.unregisterComponent(props.nodeId)
  console.log(`🔥 [Card2Wrapper] 交互配置路由器组件已注销 ${props.nodeId}`)

  window.removeEventListener('card2-config-update', handleConfigUpdateEvent as EventListener)
  window.removeEventListener('card2-config-request', handleConfigRequestEvent as EventListener)
})

// 🔥 向外暴露配置管理接口，供NodeWrapper调用
defineExpose({
  getFullConfiguration,
  updateConfig,
  updateUnifiedConfig,
  getDisplayData: () => displayData.value,
  getUnifiedConfig: () => unifiedConfig.value,
  // 🎯 交互系统相关接口
  updateInteractionConfigs,
  getInteractionConfigs,
  getInteractionCapability,
  // 🔥 新增：属性监听接口，供交互引擎使用
  watchProperty: (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
    // 检查当前组件实例是否有watchProperty方法
    if (currentComponentRef.value?.watchProperty) {
      console.log(`🔥 [Card2Wrapper] 代理属性监听到组件实例: ${propertyName}`)
      return currentComponentRef.value.watchProperty(propertyName, callback)
    } else {
      console.warn(`🔥 [Card2Wrapper] 组件实例不支持watchProperty，使用fallback监听`)
      // Fallback：监听 unifiedConfig 变化
      return watch(
        () => unifiedConfig.value.component?.[propertyName],
        (newValue, oldValue) => {
          if (newValue !== oldValue) {
            callback(newValue, oldValue)
          }
        },
        { deep: true }
      )
    }
  }
})
</script>

<style scoped>
.card2-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.card2-component {
  width: 100%;
  height: 100%;
}
</style>