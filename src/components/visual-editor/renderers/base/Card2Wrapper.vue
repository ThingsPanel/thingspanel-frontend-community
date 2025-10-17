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

    <!-- 🔥 第一级调试：Card2Wrapper 传递给组件的数据 -->
    <div v-if="props.componentType === 'digit-indicator'" class="card2-wrapper-debug">
      <div class="debug-title">🔥 Card2Wrapper 数据传递（第一级）:</div>
      <div class="debug-content">
        <div>传递给组件的 data: {{ JSON.stringify(componentDataFromWarehouse) }}</div>
        <div>时间戳: {{ new Date().toLocaleTimeString() }}</div>
      </div>
    </div>

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
// 🔥 导入循环保护管理器
import { loopProtectionManager } from '@/utils/LoopProtectionManager'
import type {
  InteractionConfig,
  InteractionEventType,
  InteractionResponse,
  ComponentInteractionCapability
} from '@/card2.1/core2/interaction'
import type { UnifiedCard2Configuration } from '@/card2.1/hooks/useCard2Props'
// 🔥 导入DataWarehouse以获取数据源执行结果（兼容性保留）
import { dataWarehouse } from '@/core/data-architecture/DataWarehouse'
// 🔥 导入配置管理器和数据桥接器
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 🔥 导入交互配置路由器
import { interactionConfigRouter } from '@/components/visual-editor/configuration/InteractionConfigRouter'

// 🚀 新增：导入Card2.1 Core响应式数据绑定系统
import { dataBindingManager } from '@/card2.1/core2/data-source'
import { reactiveDataManager } from '@/card2.1/core2/data-source'
import { componentRegistry } from '@/card2.1/core2/registry'
import { dataSourceMapper } from '@/card2.1/core2/data-source'
import type { ComponentDataBinding, DataBindingStatus } from '@/card2.1/core2/data-source'

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
    // 已移除：console语句
  }

  return found
})

// 注入编辑器上下文
const editorContext = inject('editorContext', null) as any

// 🔥 注入组件执行器注册表
const componentExecutorRegistry = inject('componentExecutorRegistry', null) as Map<string, () => Promise<void>> | null

// 🔥 预览模式检测
const { isPreviewMode } = usePreviewMode()

// 🚀 Card2.1 Core响应式数据绑定状态
const card2CoreDataBinding = ref<string | null>(null)
const card2CoreBindingStatus = ref<DataBindingStatus>({})
const card2CoreData = ref<Record<string, any>>({})
const useCard2CoreDataBinding = ref(false)

// 🚀 检查组件是否支持Card2.1 Core数据绑定
const checkCard2CoreSupport = () => {
  const isRegistered = componentRegistry.has(props.componentType)
  const dataSourceKeys = componentRegistry.getDataSourceKeys(props.componentType)
  const supportsDataBinding = isRegistered && dataSourceKeys.length > 0

  // 已移除：console语句

  useCard2CoreDataBinding.value = supportsDataBinding
  return supportsDataBinding
}

// 🚀 初始化Card2.1 Core数据绑定
const initializeCard2CoreBinding = async () => {
  if (!useCard2CoreDataBinding.value) {
    // 已移除：console语句
    return
  }

  try {
    // 已移除：console语句

    // 创建组件数据绑定配置
    const bindingConfig: ComponentDataBinding = {
      componentId: props.nodeId,
      dataSourceId: `${props.nodeId}-datasource`, // 临时数据源ID
      bindingConfig: {
        // 基于组件定义自动生成绑定配置
        ...generateBindingConfig()
      }
    }

    // 创建绑定
    const bindingId = dataBindingManager.createBinding(bindingConfig)
    card2CoreDataBinding.value = bindingId

    // 订阅数据更新
    dataBindingManager.subscribe(bindingId, (newData) => {
      card2CoreData.value = newData

      // 🔥 更新绑定状态
      const status = dataBindingManager.getBindingStatus(bindingId)
      if (status) {
        card2CoreBindingStatus.value = status
      }
    })

    // 已移除：console语句
  } catch (error) {
    // 已移除：console语句
  }
}

// 🚀 生成绑定配置
const generateBindingConfig = () => {
  const dataSourceKeys = componentRegistry.getDataSourceKeys(props.componentType)
  const bindingConfig: Record<string, any> = {}

  dataSourceKeys.forEach(key => {
    bindingConfig[key] = {
      dataPath: key,
      fallbackValue: null
    }
  })

  // 已移除：console语句
  return bindingConfig
}

// 🚀 清理Card2.1 Core绑定
const cleanupCard2CoreBinding = () => {
  if (card2CoreDataBinding.value) {
    dataBindingManager.removeBinding(card2CoreDataBinding.value)
    card2CoreDataBinding.value = null
    card2CoreData.value = {}
    card2CoreBindingStatus.value = {}
    // 已移除：console语句
  }
}

// 🔥 关键修复：性能优化的数据源获取 - 解决200+组件的频繁计算问题
let lastDataHash = ''
let cachedWarehouseData = {}
let dataFetchDebounce: NodeJS.Timeout | null = null

// 🔥 强制清除缓存的方法
const clearDataCache = () => {
  lastDataHash = ''
  cachedWarehouseData = {}
  // 已移除：console语句
}

const componentDataFromWarehouse = computed(() => {
  // 已移除：console语句

  try {
    // 🚀 优先使用Card2.1 Core响应式数据绑定
    if (useCard2CoreDataBinding.value && Object.keys(card2CoreData.value).length > 0) {
      // 已移除：console语句
      return card2CoreData.value
    }

    // 🚨 **关键修复**：直接绕过DataWarehouse的响应式，手动获取最新数据
    // 已移除：console语句

    // 强制清除缓存，确保获取最新数据
    dataWarehouse.clearComponentMergedCache(props.nodeId)

    // 直接调用DataWarehouse获取数据，绕过响应式依赖问题
    const latestData = dataWarehouse.getComponentData(props.nodeId)

    // 已移除：console语句

    return latestData || {}
  } catch (error) {
    // 已移除：console语句
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
      if (node?.metadata?.unifiedConfig) {
        return node.metadata.unifiedConfig
      }
    }
  } catch (error) {
    // 已移除：console语句
  }
  return undefined
}

// 已移除：console语句

// 配置变更回调
setConfigChangeCallback((config) => {
  // 已移除：console语句
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

// 🔥 字段层级映射函数：判断字段应该更新到哪个配置层
const isBaseLayerField = (field: string): boolean => {
  // base层字段：设备绑定、UI基础配置
  const baseFields = [
    'deviceId', 'metricsList', // 设备绑定字段
    'title', 'showTitle', 'visible', 'opacity', // UI基础字段
    'backgroundColor', 'borderWidth', 'borderColor', 'borderStyle', 'borderRadius',
    'padding', 'margin'
  ]
  return baseFields.includes(field)
}

const isDataSourceLayerField = (field: string): boolean => {
  // dataSource层字段：数据绑定配置
  const dataSourceFields = [
    'dataSourceConfig', 'fieldMappings', 'refreshInterval', 'autoRefresh'
  ]
  return dataSourceFields.includes(field)
}

const isInteractionLayerField = (field: string): boolean => {
  // interaction层字段：交互配置
  const interactionFields = [
    'interactions', 'clickActions', 'hoverActions', 'eventHandlers'
  ]
  return interactionFields.includes(field)
}

// 🔥 批量执行交互响应 - 解决多属性修改相互覆盖问题
const executeBatchedInteractionResponses = async (responses: InteractionResponse[]) => {
  // 已移除：console语句

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

  // 已移除：console语句

  // 🔥 关键修复1：批量处理自组件属性修改
  if (groupedResponses.self.modify.length > 0) {
    const batchedSelfUpdates = {}

    groupedResponses.self.modify.forEach(response => {
      if (response.modifyConfig) {
        const { targetProperty, updateValue } = response.modifyConfig
        batchedSelfUpdates[targetProperty] = updateValue
        // 已移除：console语句
      }
    })

    // 已移除：console语句

    // 🔥 恢复原始逻辑：自组件修改用 updateConfig，保持与配置表单同步
    updateConfig('component', batchedSelfUpdates)
    // 已移除：console语句
  }

  // 🔥 关键修复2：批量处理跨组件属性修改
  for (const [targetComponentId, targetResponses] of groupedResponses.cross.entries()) {
    // 🔥 分层收集配置更新 - 根据字段特性分配到不同配置层
    const layeredUpdates = {
      base: {},        // 设备绑定等基础配置
      component: {},   // 组件特有属性
      dataSource: {}, // 数据源配置
      interaction: {} // 交互配置
    }

    targetResponses.forEach(response => {
      if (response.modifyConfig) {
        const { targetProperty, updateValue } = response.modifyConfig

        // 🔥 处理带层级前缀的字段名（如 "base.deviceId"）
        let actualProperty = targetProperty
        let targetLayer = 'component' // 默认层级

        if (targetProperty.includes('.')) {
          const [layerPrefix, fieldName] = targetProperty.split('.')
          actualProperty = fieldName
          targetLayer = layerPrefix
    // 已移除：console语句
        } else {
          // 🔥 字段层级映射：根据字段名确定应该更新哪个配置层
          if (isBaseLayerField(targetProperty)) {
            targetLayer = 'base'
          } else if (isDataSourceLayerField(targetProperty)) {
            targetLayer = 'dataSource'
          } else if (isInteractionLayerField(targetProperty)) {
            targetLayer = 'interaction'
          }
        }

        // 根据目标层级收集更新
        layeredUpdates[targetLayer][actualProperty] = updateValue
    // 已移除：console语句
      }
    })

    // 已移除：console语句

    try {
      // 🔥 分层批量更新：按配置层级分别更新
      for (const [layer, updates] of Object.entries(layeredUpdates)) {
        if (Object.keys(updates).length > 0) {
    // 已移除：console语句
          configurationManager.updateConfigurationForInteraction(
            targetComponentId,
            layer as keyof UnifiedCard2Configuration,
            updates,
            'cross-component-interaction'
          )
        }
      }
    // 已移除：console语句
    } catch (error) {
    // 已移除：console语句
    }
  }

  // 处理非修改动作（跳转等）
  for (const response of groupedResponses.nonModify) {
    const delay = response.delay || 0
    setTimeout(() => {
      executeInteractionResponse(response)
    }, delay)
  }
}

// 交互事件执行器（处理非属性修改动作）
const executeInteractionResponse = async (response: InteractionResponse) => {
    // 已移除：console语句

  try {
    switch (response.action) {
      case 'navigateToUrl':
      case 'jump':
    // 已移除：console语句
        // 支持多种URL数据格式
        let url = response.jumpConfig?.url || response.value || response.url
        let target = response.jumpConfig?.target || response.target || '_self'

        if (url) {
    // 已移除：console语句
          if (target === '_self') {
            window.location.href = url
          } else {
            window.open(url, target)
          }
        } else {
    // 已移除：console语句
        }
        break

      case 'updateComponentData':
      case 'modifyProperty':
      case 'modify':
        // 🔥 修复说明：属性修改现在由 executeBatchedInteractionResponses 批量处理
    // 已移除：console语句
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
    // 已移除：console语句
    }
  } catch (error) {
    // 已移除：console语句
  }
}

// 通用交互事件处理器
const handleInteractionEvent = async (eventType: InteractionEventType, event?: Event) => {
  // 🔥 关键修复：编辑模式下禁用交互，避免与编辑操作冲突
  if (!isPreviewMode.value) {
    // 已移除：console语句
    return // 编辑模式下不执行交互
  }

  if (!componentInteractionCapability.value?.supportedEvents.includes(eventType)) {
    // 已移除：console语句
    return // 组件不支持此事件类型
  }

    // 已移除：console语句

  // 执行匹配的交互配置
  const matchingConfigs = interactionConfigs.value.filter(config =>
    config.event === eventType && config.enabled !== false
  )

    // 已移除：console语句

  // 🔥 关键修复：将所有匹配配置的responses合并，避免多个配置相互覆盖
  const allResponses: InteractionResponse[] = []
  for (const config of matchingConfigs) {
    // 已移除：console语句
    allResponses.push(...config.responses)
  }

    // 已移除：console语句

  // 一次性批量处理所有响应，避免配置间相互覆盖
  if (allResponses.length > 0) {
    await executeBatchedInteractionResponses(allResponses)
  }
}

// ================== 事件处理 ==================

const handleWrapperClick = async (event: MouseEvent) => {
    // 已移除：console语句

  // 执行交互响应（内部已有预览模式检查）
  await handleInteractionEvent('click', event)

  // 原有的预览模式逻辑保持兼容性
  if (!props.previewMode) return
}

const handleContextMenu = (event: MouseEvent) => {
    // 已移除：console语句
  event.preventDefault() // 阻止默认右键菜单
}

// 新增交互事件处理函数
const handleMouseEnter = async (event: MouseEvent) => {
    // 已移除：console语句
  await handleInteractionEvent('hover', event)
}

const handleMouseLeave = (event: MouseEvent) => {
    // 已移除：console语句
  // hover事件的离开可以触发一些重置操作
}

const handleFocus = async (event: FocusEvent) => {
    // 已移除：console语句
  await handleInteractionEvent('focus', event)
}

const handleBlur = async (event: FocusEvent) => {
    // 已移除：console语句
  await handleInteractionEvent('blur', event)
}

// 🔥 监听来自编辑器层的配置更新事件
const handleConfigUpdateEvent = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.nodeId) {
    // 已移除：console语句

    if (layer === 'interaction') {
    // 已移除：console语句

      // 🔥 统一配置中心：通过updateConfig更新交互配置
      if (config?.configs) {
        updateConfig('interaction', { configs: config.configs })
      }
    } else {
      // 非交互配置正常处理
      updateConfig(layer, config)
    }

    // 已移除：console语句
  }
}

// 🔥 响应配置请求事件
const handleConfigRequestEvent = (event: CustomEvent) => {
  const { componentId, layer } = event.detail
  if (componentId === props.nodeId) {
    // 已移除：console语句

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
    // 已移除：console语句

    // 已移除：console语句

  // 🔥 统一配置中心：直接通过updateConfig更新，计算属性会自动响应
  updateConfig('interaction', { configs })

    // 已移除：console语句
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

    // 已移除：console语句

    // 检查每个dataChange交互配置
    const dataChangeConfigs = interactionConfigs.value.filter(config =>
      config.event === 'dataChange' && config.enabled !== false
    )

    // 已移除：console语句

    // 🔥 关键修复：收集所有触发的dataChange响应，进行批量处理
    const triggeredResponses: InteractionResponse[] = []

    for (const config of dataChangeConfigs) {
      // 🔥 修复：dataChange事件的监听属性存储在config.watchedProperty，不是response中
      if (config.watchedProperty) {
        const propertyPath = config.watchedProperty
        const newValue = getNestedValue(newDisplayData, propertyPath)
        const oldValue = getNestedValue(oldDisplayData || {}, propertyPath)

    // 已移除：console语句

        // 如果属性值发生了变化
        if (newValue !== oldValue) {
          // 检查执行条件（使用config.condition而不是response.executionCondition）
          if (checkDataChangeCondition(config.condition, newValue)) {
    // 已移除：console语句

            // 🔥 关键修复：收集响应而不是立即执行
            triggeredResponses.push(...config.responses)
    // 已移除：console语句
          } else {
    // 已移除：console语句
          }
        }
      }
    }

    // 🔥 关键修复：批量执行所有触发的响应，避免相互覆盖
    if (triggeredResponses.length > 0) {
    // 已移除：console语句

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

    // 已移除：console语句

  switch (condition.type) {
    case 'comparison':
      const operator = condition.operator || 'equals'
      const targetValue = condition.value

    // 已移除：console语句

      return compareValues(currentValue, targetValue, operator)

    case 'range':
      return checkRangeCondition(currentValue, condition.value)

    case 'expression':
      return checkExpressionCondition(currentValue, condition.value)

    default:
    // 已移除：console语句
      return true
  }
}

// 通用的执行条件检查函数（用于其他事件类型）
const checkExecutionCondition = (response: any, currentValue: any): boolean => {
  const condition = response.executionCondition
  if (!condition) return true // 无条件直接执行

    // 已移除：console语句

  switch (condition.type) {
    case 'equals':
    case 'comparison':
      const operator = condition.operator || '=='
      const targetValue = condition.value

    // 已移除：console语句

      return compareValues(currentValue, targetValue, operator)

    case 'range':
      return checkRangeCondition(currentValue, condition.value)

    case 'expression':
      return checkExpressionCondition(currentValue, condition.value)

    default:
    // 已移除：console语句
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
    // 已移除：console语句
    return false
  }
}

// ================== 组件执行器 ==================

/**
 * 🔥 关键修复：防循环的组件数据源执行器
 * 这是注册到 componentExecutorRegistry 的核心函数
 */
let executionInProgress = false
let lastExecutionConfig = ''
let executionDebounce: NodeJS.Timeout | null = null
// 🔥 新增：执行序号追踪，确保只有最新的执行结果被应用
let currentExecutionSequence = 0
// 🔥 新增：配置版本追踪，防止使用过期配置
let lastConfigHash = ''

const executeComponentDataSource = async (): Promise<void> => {
  // 🔥 生成当前执行序号
  currentExecutionSequence++
  const currentSequence = currentExecutionSequence
  const executionId = `${props.nodeId}-seq${currentSequence}-${Date.now()}`

  // 已移除：console语句

  // 🔥 关键修复：立即获取最新配置快照，防止执行过程中配置变化
  const configSnapshot = await captureLatestConfigurationSnapshot(executionId)
  if (!configSnapshot) {
    // 已移除：console语句
    return
  }

  // 🔥 关键修复：检查配置版本，防止重复执行相同配置
  const currentConfigHash = calculateConfigurationHash(configSnapshot.dataSource)
  if (currentConfigHash === lastConfigHash && currentConfigHash !== '') {
    // 已移除：console语句
    return
  }
  lastConfigHash = currentConfigHash

  // 🔥 循环保护：检查是否应该允许这次执行
  const callId = loopProtectionManager.markCallStart(
    'Card2Wrapper.executeComponentDataSource',
    props.nodeId,
    'data-source-execution'
  )

  if (!callId) {
    // 已移除：console语句
    return
  }

  // 🔥 关键修复1：防止并发执行和递归调用
  if (executionInProgress) {
    loopProtectionManager.markCallEnd(callId, 'Card2Wrapper.executeComponentDataSource', props.nodeId)
    // 已移除：console语句
    return
  }

  // 🔥 关键修复2：防抖处理，避免频繁触发
  if (executionDebounce) {
    clearTimeout(executionDebounce)
  }

  return new Promise((resolve) => {
    executionDebounce = setTimeout(async () => {
      // 🔥 再次检查序号，确保这是最新的执行请求
      if (currentSequence !== currentExecutionSequence) {
        // 已移除：console语句
        resolve()
        return
      }

      if (executionInProgress) {
        resolve()
        return
      }

      executionInProgress = true
      try {
        // 🔥 关键修复：使用配置快照，而不是重新获取（可能已过期）
        const dataSourceConfig = configSnapshot.dataSource

        if (!dataSourceConfig) {
          // 已移除：console语句
          resolve()
          return
        }

        // 🔥 关键修复3：使用快照的配置哈希，避免重复执行检查
        // 已移除：console语句

        // 🎯 用户要求的打印这几个字 - 阶段0：Card2Wrapper组件执行器被调用
        if (process.env.NODE_ENV === 'development') {
    // 已移除：console语句
        }

        // 🔥 使用 VisualEditorBridge 执行数据源
        const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
        const visualEditorBridge = getVisualEditorBridge()

        // 🔥 关键修复：传递带有执行ID的完整配置快照
        const enhancedConfig = {
          ...configSnapshot,
          executionId,
          executionSequence: currentSequence,
          configHash: currentConfigHash
        }

        // 清除缓存确保获取最新数据
        simpleDataBridge.clearComponentCache(props.nodeId)

        // 执行数据源
        const result = await visualEditorBridge.updateComponentExecutor(
          props.nodeId,
          props.componentType,
          enhancedConfig
        )

        // 🔥 再次检查序号，确保这个结果仍然是最新的
        if (currentSequence !== currentExecutionSequence) {
          // 已移除：console语句
          resolve()
          return
        }

        if (process.env.NODE_ENV === 'development') {
    // 已移除：console语句
        }

        // 🔥 数据源执行完成后，清除缓存强制重新获取最新数据
        clearDataCache()

        // 🔥 强制清除 DataWarehouse 的合并缓存并触发响应式更新
        dataWarehouse.clearComponentMergedCache(props.nodeId)

        // 🔥 新增：延迟强制刷新，确保数据传播
        setTimeout(() => {
          forceDataRefresh()
        }, 100)

        resolve()
      } catch (error) {
    // 已移除：console语句
        resolve() // 即使失败也要resolve，避免阻塞
      } finally {
        executionInProgress = false
        executionDebounce = null
        // 🔥 循环保护：标记调用结束
        loopProtectionManager.markCallEnd(callId, 'Card2Wrapper.executeComponentDataSource', props.nodeId)
      }
    }, 300) // 300ms防抖延迟，适应大量组件场景
  })
}

// 🔥 新增：捕获最新配置快照的工具函数
const captureLatestConfigurationSnapshot = async (executionId: string): Promise<{ dataSource: any; base: any; timestamp: number } | null> => {
  try {
    const latestConfig = configurationManager.getConfiguration(props.nodeId)
    if (!latestConfig) {
      // 已移除：console语句
      return null
    }

    const snapshot = {
      dataSource: latestConfig.dataSource ? JSON.parse(JSON.stringify(latestConfig.dataSource)) : null,
      base: latestConfig.base ? JSON.parse(JSON.stringify(latestConfig.base)) : null,
      timestamp: Date.now()
    }

    // 已移除：console语句

    return snapshot
  } catch (error) {
    // 已移除：console语句
    return null
  }
}

// 🔥 新增：计算配置哈希值的工具函数
const calculateConfigurationHash = (config: any): string => {
  try {
    if (!config) return ''
    const configString = JSON.stringify(config)
    let hash = 0
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  } catch (error) {
    return Date.now().toString(36)
  }
}

// ================== 生命周期 ==================

/**
 * 🔥 初始化数据源配置 - 通过配置变更触发数据源执行
 * 这是进入编辑器时触发数据源执行的正确方式
 */
const initializeDataSourceConfiguration = async () => {
  try {
    // 已移除：console语句

    // 检查是否有数据源配置
    const currentConfig = configurationManager.getConfiguration(props.nodeId)
    const hasDataSourceConfig = currentConfig?.dataSource

    if (hasDataSourceConfig) {
    // 已移除：console语句

      // 🔥 关键：通过"触碰"配置来触发执行，而不是直接执行
      // 这样能确保所有监听器都被正确触发
      configurationManager.updateConfiguration(
        props.nodeId,
        'dataSource',
        currentConfig.dataSource,
        props.componentType
      )
    } else {
    // 已移除：console语句
    }
  } catch (error) {
    // 已移除：console语句
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

    // 已移除：console语句
      }
    }
  },
  { immediate: false }
)

// 🔥 监听 componentDataFromWarehouse 变化
watch(
  () => componentDataFromWarehouse.value,
  (newData, oldData) => {
    // 已移除：console语句
  },
  { deep: true, immediate: true }
)

// 🔥 新增：强制数据更新机制 - 当数据源执行完成后手动触发
const forceDataRefresh = () => {
  // 强制清除DataWarehouse缓存
  dataWarehouse.clearComponentMergedCache(props.nodeId)

  // 手动触发计算属性重新计算
  nextTick(() => {
    const freshData = componentDataFromWarehouse.value
    // 已移除：console语句
  })
}

onMounted(async () => {
    // 已移除：console语句

  // 🚀 首先初始化Card2.1 Core响应式数据绑定系统
  checkCard2CoreSupport()
  if (useCard2CoreDataBinding.value) {
    await initializeCard2CoreBinding()
  }

  // 🔥 强制清除缓存，确保获取最新数据
  clearDataCache()

  // 🚨 **关键修复**：强制初始化计算属性，建立Vue响应式依赖
  try {
    // 强制访问计算属性，确保Vue响应式系统能追踪到依赖关系
    const initialData = componentDataFromWarehouse.value

  } catch (initError) {
    // 已移除：console语句
  }

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

    // 已移除：console语句
    }
  }

  // 🔥 关键修复：注册组件执行器到执行器注册表
  if (componentExecutorRegistry) {
    componentExecutorRegistry.set(props.nodeId, executeComponentDataSource)

    // 🔥 关键修复：执行器注册后，检查并重新触发已有配置的执行
    nextTick(async () => {
      try {
        // 检查是否已有配置（说明fetchBoard已经执行过）
        const existingConfig = configurationManager.getConfiguration(props.nodeId)
        if (existingConfig && existingConfig.dataSource) {
          // 直接调用执行器，重新执行数据源
          await executeComponentDataSource()
        } else {
          // 没有配置，执行初始化
          await initializeDataSourceConfiguration()
        }
      } catch (error) {
         // 已移除：console语句
      }
    })
  }
  // 🔥 注释：数据源初始化已在执行器注册后进行，这里不需要重复调用
  // 🔥 统一配置中心：交互配置初始化由计算属性自动处理
  const savedConfigs = unifiedConfig.value.interaction?.configs as InteractionConfig[]
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
          return currentComponentRef.value.watchProperty(propertyName, callback)
        } else {
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

    interactionConfigRouter.registerComponentInstance(props.nodeId, componentExpose)
  })
})

// 清理事件监听
onUnmounted(() => {
  // 🚀 清理Card2.1 Core数据绑定
  cleanupCard2CoreBinding()

  // 🔥 清理组件执行器注册
  if (componentExecutorRegistry) {
    componentExecutorRegistry.delete(props.nodeId)
    // 已移除：console语句
  }

  // 🔥 清理交互配置路由器中的组件注册
  interactionConfigRouter.unregisterComponent(props.nodeId)
    // 已移除：console语句

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
      return currentComponentRef.value.watchProperty(propertyName, callback)
    } else {
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

/* 🔥 Card2Wrapper 调试样式 */
.card2-wrapper-debug {
  background: #e8f4ff;
  border: 2px solid #1890ff;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 12px;
}

.card2-wrapper-debug .debug-title {
  color: #1890ff;
  font-weight: bold;
  margin-bottom: 4px;
}

.card2-wrapper-debug .debug-content {
  background: #fff;
  padding: 4px;
  border-radius: 2px;
  font-family: monospace;
  word-break: break-all;
}

.card2-component {
  width: 100%;
  height: 100%;
}
</style>
