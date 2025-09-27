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
} from '@/card2.1/core/interaction-types'
import type { UnifiedCard2Configuration } from '@/card2.1/hooks/useCard2Props'
// 🔥 导入DataWarehouse以获取数据源执行结果（兼容性保留）
import { dataWarehouse } from '@/core/data-architecture/DataWarehouse'
// 🔥 导入配置管理器和数据桥接器
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 🔥 导入交互配置路由器
import { interactionConfigRouter } from '@/components/visual-editor/configuration/InteractionConfigRouter'

// 🚀 新增：导入Card2.1 Core响应式数据绑定系统
import { dataBindingManager } from '@/card2.1/core/data-source/data-binding-manager'
import { reactiveDataManager } from '@/card2.1/core/data-source/reactive-data-manager'
import { ComponentRegistry } from '@/card2.1/core/component-registry'
import { dataSourceMapper } from '@/card2.1/core/data-source-mapper'
import type { ComponentDataBinding, DataBindingStatus } from '@/card2.1/core/data-source/data-binding-manager'

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
    if (import.meta.env.DEV) console.warn(`⚠️ [Card2Wrapper] 组件 ${props.componentType} 未找到，等待系统初始化`)
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
  const isRegistered = ComponentRegistry.has(props.componentType)
  const dataSourceKeys = ComponentRegistry.getDataSourceKeys(props.componentType)
  const supportsDataBinding = isRegistered && dataSourceKeys.length > 0

  console.log(`🚀 [Card2Wrapper] Card2.1 Core支持检查 ${props.nodeId}:`, {
    componentType: props.componentType,
    isRegistered,
    dataSourceKeys,
    supportsDataBinding
  })

  useCard2CoreDataBinding.value = supportsDataBinding
  return supportsDataBinding
}

// 🚀 初始化Card2.1 Core数据绑定
const initializeCard2CoreBinding = async () => {
  if (!useCard2CoreDataBinding.value) {
    console.log(`🚀 [Card2Wrapper] 组件 ${props.componentType} 不支持Card2.1 Core数据绑定`)
    return
  }

  try {
    console.log(`🚀 [Card2Wrapper] 开始初始化Card2.1 Core数据绑定 ${props.nodeId}`)

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
      console.log(`🚀 [Card2Wrapper] Card2.1 Core数据更新 ${props.nodeId}:`, newData)
      card2CoreData.value = newData

      // 🔥 更新绑定状态
      const status = dataBindingManager.getBindingStatus(bindingId)
      if (status) {
        card2CoreBindingStatus.value = status
      }
    })

    console.log(`✅ [Card2Wrapper] Card2.1 Core数据绑定初始化完成 ${props.nodeId}`)
  } catch (error) {
    console.error(`❌ [Card2Wrapper] Card2.1 Core数据绑定初始化失败 ${props.nodeId}:`, error)
  }
}

// 🚀 生成绑定配置
const generateBindingConfig = () => {
  const dataSourceKeys = ComponentRegistry.getDataSourceKeys(props.componentType)
  const bindingConfig: Record<string, any> = {}

  dataSourceKeys.forEach(key => {
    bindingConfig[key] = {
      dataPath: key,
      fallbackValue: null
    }
  })

  console.log(`🚀 [Card2Wrapper] 生成绑定配置 ${props.componentType}:`, bindingConfig)
  return bindingConfig
}

// 🚀 清理Card2.1 Core绑定
const cleanupCard2CoreBinding = () => {
  if (card2CoreDataBinding.value) {
    dataBindingManager.removeBinding(card2CoreDataBinding.value)
    card2CoreDataBinding.value = null
    card2CoreData.value = {}
    card2CoreBindingStatus.value = {}
    console.log(`🚀 [Card2Wrapper] 已清理Card2.1 Core数据绑定 ${props.nodeId}`)
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
  console.log('🔥 [Card2Wrapper] 已清除数据缓存:', props.nodeId)
}

const componentDataFromWarehouse = computed(() => {
  // 🚨 **最优先的调试**：确认计算属性执行开始
  console.log('🚨 [Card2Wrapper] ===== 计算属性开始执行 =====', {
    nodeId: props.nodeId,
    timestamp: new Date().toLocaleTimeString()
  })

  try {
    // 🚀 优先使用Card2.1 Core响应式数据绑定
    if (useCard2CoreDataBinding.value && Object.keys(card2CoreData.value).length > 0) {
      console.log('🚀 [Card2Wrapper] 使用Card2.1 Core数据:', {
        nodeId: props.nodeId,
        card2CoreData: card2CoreData.value,
        bindingStatus: card2CoreBindingStatus.value,
        timestamp: new Date().toISOString()
      })
      return card2CoreData.value
    }

    // 🚨 **关键修复**：直接绕过DataWarehouse的响应式，手动获取最新数据
    console.log('🚨 [Card2Wrapper] 直接从DataWarehouse获取最新数据')

    // 强制清除缓存，确保获取最新数据
    dataWarehouse.clearComponentMergedCache(props.nodeId)

    // 直接调用DataWarehouse获取数据，绕过响应式依赖问题
    const latestData = dataWarehouse.getComponentData(props.nodeId)

    console.log('🚨 [Card2Wrapper] 获取到的最新数据:', {
      nodeId: props.nodeId,
      latestData,
      dataType: typeof latestData,
      dataKeys: latestData && typeof latestData === 'object' ? Object.keys(latestData) : null,
      timestamp: new Date().toLocaleTimeString()
    })

    return latestData || {}
  } catch (error) {
    if (import.meta.env.DEV) console.error(`❌ [Card2Wrapper] 获取数据失败 ${props.nodeId}:`, error)
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
      if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 获取初始统一配置 ${props.nodeId}:`, {
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
    if (import.meta.env.DEV) console.warn(`[Card2Wrapper] 获取初始配置失败:`, error)
  }
  return undefined
}

if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 统一配置架构初始化完成 ${props.nodeId}:`, {
  componentType: props.componentType,
  hasUnifiedConfig: !!unifiedConfig.value,
  hasComponentConfig: !!componentConfig.value,
  isPreviewMode: isPreviewMode.value,
  interactionEnabled: isPreviewMode.value
})

// 配置变更回调
setConfigChangeCallback((config) => {
  if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 配置变更回调 ${props.nodeId}:`, config)
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
  if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 批量执行交互响应:`, responses)

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

  if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 响应分组结果:`, {
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
        if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 收集自组件修改: ${targetProperty} = ${updateValue}`)
      }
    })

    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 批量修改自己的属性:`, batchedSelfUpdates)

    // 🔥 恢复原始逻辑：自组件修改用 updateConfig，保持与配置表单同步
    updateConfig('component', batchedSelfUpdates)
    if (import.meta.env.DEV) console.log(`✅ [Card2Wrapper] 自组件批量修改完成`)
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
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 检测到层级前缀: ${layerPrefix}.${fieldName}`)
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
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 收集${targetLayer}层修改: ${targetComponentId}.${actualProperty} = ${updateValue}`)
      }
    })

    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 批量修改其他组件 ${targetComponentId}:`, layeredUpdates)

    try {
      // 🔥 分层批量更新：按配置层级分别更新
      for (const [layer, updates] of Object.entries(layeredUpdates)) {
        if (Object.keys(updates).length > 0) {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 更新${layer}层:`, updates)
          configurationManager.updateConfigurationForInteraction(
            targetComponentId,
            layer as keyof UnifiedCard2Configuration,
            updates,
            'cross-component-interaction'
          )
        }
      }
    if (import.meta.env.DEV) console.log(`✅ [Card2Wrapper] 跨组件分层批量修改完成: ${targetComponentId}`)
    } catch (error) {
    if (import.meta.env.DEV) console.error(`❌ [Card2Wrapper] 跨组件分层批量修改失败 ${targetComponentId}:`, error)
    }
  }

  // 处理非修改动作（跳转等）
  for (const response of groupedResponses.nonModify) {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 执行非修改响应:`, response)
    const delay = response.delay || 0
    setTimeout(() => {
      executeInteractionResponse(response)
    }, delay)
  }
}

// 交互事件执行器（处理非属性修改动作）
const executeInteractionResponse = async (response: InteractionResponse) => {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 执行交互响应:`, response)

  try {
    switch (response.action) {
      case 'navigateToUrl':
      case 'jump':
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 处理跳转动作:`, response)
        // 支持多种URL数据格式
        let url = response.jumpConfig?.url || response.value || response.url
        let target = response.jumpConfig?.target || response.target || '_self'

        if (url) {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 执行跳转: ${url} (${target})`)
          if (target === '_self') {
            window.location.href = url
          } else {
            window.open(url, target)
          }
        } else {
    if (import.meta.env.DEV) console.warn(`🎯 [Card2Wrapper] 跳转URL未找到:`, response)
        }
        break

      case 'updateComponentData':
      case 'modifyProperty':
      case 'modify':
        // 🔥 修复说明：属性修改现在由 executeBatchedInteractionResponses 批量处理
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 属性修改已由批量处理函数处理，跳过单独执行`)
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
    if (import.meta.env.DEV) console.warn(`🎯 [Card2Wrapper] 未支持的交互动作:`, response.action)
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error(`🎯 [Card2Wrapper] 交互响应执行失败:`, error)
  }
}

// 通用交互事件处理器
const handleInteractionEvent = async (eventType: InteractionEventType, event?: Event) => {
  // 🔥 关键修复：编辑模式下禁用交互，避免与编辑操作冲突
  if (!isPreviewMode.value) {
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 编辑模式下交互被禁用 ${eventType} for ${props.nodeId}`)
    return // 编辑模式下不执行交互
  }

  if (!componentInteractionCapability.value?.supportedEvents.includes(eventType)) {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 组件不支持事件类型 ${eventType}`)
    return // 组件不支持此事件类型
  }

    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 预览模式下处理交互事件 ${eventType} for ${props.nodeId}`, {
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

    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 找到匹配配置:`, matchingConfigs)

  // 🔥 关键修复：将所有匹配配置的responses合并，避免多个配置相互覆盖
  const allResponses: InteractionResponse[] = []
  for (const config of matchingConfigs) {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 收集配置响应:`, config)
    allResponses.push(...config.responses)
  }

    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 合并所有响应进行批量处理:`, {
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
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 点击事件 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)

  // 执行交互响应（内部已有预览模式检查）
  await handleInteractionEvent('click', event)
  
  // 原有的预览模式逻辑保持兼容性
  if (!props.previewMode) return
}

const handleContextMenu = (event: MouseEvent) => {
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 右键菜单 ${props.nodeId}`)
  event.preventDefault() // 阻止默认右键菜单
}

// 新增交互事件处理函数
const handleMouseEnter = async (event: MouseEvent) => {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 鼠标进入 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  await handleInteractionEvent('hover', event)
}

const handleMouseLeave = (event: MouseEvent) => {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 鼠标离开 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  // hover事件的离开可以触发一些重置操作
}

const handleFocus = async (event: FocusEvent) => {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 获得焦点 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  await handleInteractionEvent('focus', event)
}

const handleBlur = async (event: FocusEvent) => {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 失去焦点 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  await handleInteractionEvent('blur', event)
}

// 🔥 监听来自编辑器层的配置更新事件
const handleConfigUpdateEvent = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.nodeId) {
    if (import.meta.env.DEV) console.log(`🔍 [TRACE-8] Card2Wrapper.handleConfigUpdateEvent 被调用:`, {
      componentId,
      layer,
      config,
      callStack: new Error().stack?.split('\n').slice(1, 5)
    })

    if (layer === 'interaction') {
    if (import.meta.env.DEV) console.log(`🔍 [TRACE-9] 这是 interaction 配置更新事件:`, {
        componentId,
        configsCount: config?.configs?.length || 0,
        willCallUpdateConfig: true,
        oldInteractionConfigs: interactionConfigs.value
      })

      // 🔥 统一配置中心：通过updateConfig更新交互配置
      if (config?.configs) {
        updateConfig('interaction', { configs: config.configs })
    if (import.meta.env.DEV) console.log(`✅ [Card2Wrapper] 交互配置已通过统一配置中心更新:`, {
          newConfigs: config.configs,
          configsCount: config.configs.length
        })
      }
    } else {
      // 非交互配置正常处理
      updateConfig(layer, config)
    }

    if (import.meta.env.DEV) console.log(`🔍 [TRACE-10] Card2Wrapper.handleConfigUpdateEvent 处理完成:`, {
      componentId,
      layer
    })
  }
}

// 🔥 响应配置请求事件
const handleConfigRequestEvent = (event: CustomEvent) => {
  const { componentId, layer } = event.detail
  if (componentId === props.nodeId) {
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 接收到配置请求事件 ${componentId}:`, { layer })
    
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
    if (import.meta.env.DEV) console.log(`🔍 [TRACE-11] Card2Wrapper.updateInteractionConfigs 被调用:`, {
    nodeId: props.nodeId,
    configCount: configs.length,
    configs: configs,
    callStack: new Error().stack?.split('\n').slice(1, 5)
  })

    if (import.meta.env.DEV) console.log(`🔍 [TRACE-12] 通过统一配置中心更新交互配置:`, {
    nodeId: props.nodeId,
    configsLength: configs.length,
    willTriggerPersistence: true
  })

  // 🔥 统一配置中心：直接通过updateConfig更新，计算属性会自动响应
  updateConfig('interaction', { configs })

    if (import.meta.env.DEV) console.log(`🔍 [TRACE-13] updateConfig('interaction', { configs }) 调用完成`)
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
    
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] DisplayData变化检测 ${props.nodeId}:`, {
      newData: newDisplayData,
      oldData: oldDisplayData,
      interactionConfigsCount: interactionConfigs.value.length
    })
    
    // 检查每个dataChange交互配置
    const dataChangeConfigs = interactionConfigs.value.filter(config =>
      config.event === 'dataChange' && config.enabled !== false
    )

    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] DataChange配置:`, dataChangeConfigs)

    // 🔥 关键修复：收集所有触发的dataChange响应，进行批量处理
    const triggeredResponses: InteractionResponse[] = []

    for (const config of dataChangeConfigs) {
      // 🔥 修复：dataChange事件的监听属性存储在config.watchedProperty，不是response中
      if (config.watchedProperty) {
        const propertyPath = config.watchedProperty
        const newValue = getNestedValue(newDisplayData, propertyPath)
        const oldValue = getNestedValue(oldDisplayData || {}, propertyPath)

    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 检查属性变化:`, {
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
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 属性变化触发交互:`, {
              property: propertyPath,
              value: newValue,
              condition: config.condition,
              responsesCount: config.responses.length
            })

            // 🔥 关键修复：收集响应而不是立即执行
            triggeredResponses.push(...config.responses)
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 收集dataChange响应 ${config.responses.length} 个`)
          } else {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 条件不满足，不执行交互:`, {
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
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 批量执行dataChange触发的 ${triggeredResponses.length} 个响应`)

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
  
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 检查dataChange执行条件:`, {
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
      
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] DataChange比较条件:`, {
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
    if (import.meta.env.DEV) console.warn(`🎯 [Card2Wrapper] 未知的dataChange条件类型:`, condition.type)
      return true
  }
}

// 通用的执行条件检查函数（用于其他事件类型）
const checkExecutionCondition = (response: any, currentValue: any): boolean => {
  const condition = response.executionCondition
  if (!condition) return true // 无条件直接执行
  
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 检查通用执行条件:`, {
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
      
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 通用比较条件:`, {
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
    if (import.meta.env.DEV) console.warn(`🎯 [Card2Wrapper] 未知的通用条件类型:`, condition.type)
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
    if (import.meta.env.DEV) console.error(`🎯 [Card2Wrapper] 表达式执行失败:`, expression, error)
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

  console.log(`🎯 用户要求的打印这几个字 - 执行序号 ${currentSequence}：Card2Wrapper组件执行器开始执行 ${props.nodeId}`)

  // 🔥 关键修复：立即获取最新配置快照，防止执行过程中配置变化
  const configSnapshot = await captureLatestConfigurationSnapshot(executionId)
  if (!configSnapshot) {
    console.log(`🔥 [Card2Wrapper] [${executionId}] 无法获取配置快照，跳过执行`)
    return
  }

  // 🔥 关键修复：检查配置版本，防止重复执行相同配置
  const currentConfigHash = calculateConfigurationHash(configSnapshot.dataSource)
  if (currentConfigHash === lastConfigHash && currentConfigHash !== '') {
    console.log(`🔥 [Card2Wrapper] [${executionId}] 配置未变化，跳过重复执行:`, {
      configHash: currentConfigHash,
      说明: '配置内容相同，避免无效重复执行'
    })
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
    if (import.meta.env.DEV) console.warn(`🚫 [Card2Wrapper] 数据源执行被循环保护阻止: ${props.nodeId}`)
    return
  }

  // 🔥 关键修复1：防止并发执行和递归调用
  if (executionInProgress) {
    loopProtectionManager.markCallEnd(callId, 'Card2Wrapper.executeComponentDataSource', props.nodeId)
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 跳过并发执行 ${props.nodeId}`)
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
        console.log(`🔥 [Card2Wrapper] 执行序号已过期，跳过执行 ${props.nodeId}:`, {
          当前序号: currentSequence,
          最新序号: currentExecutionSequence,
          说明: '有更新的执行请求，取消此次执行'
        })
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
          console.log(`🔥 [Card2Wrapper] [${executionId}] 配置快照中无数据源配置，跳过执行`)
          resolve()
          return
        }

        // 🔥 关键修复3：使用快照的配置哈希，避免重复执行检查
        console.log(`🔥 [Card2Wrapper] [${executionId}] 使用配置快照执行数据源:`, {
          configHash: currentConfigHash,
          executionSequence: currentSequence,
          snapshotTimestamp: configSnapshot.timestamp
        })

        // 🎯 用户要求的打印这几个字 - 阶段0：Card2Wrapper组件执行器被调用
        if (process.env.NODE_ENV === 'development') {
    if (import.meta.env.DEV) console.log(`🎯 用户要求的打印这几个字 - 阶段0：Card2Wrapper组件执行器被调用`, {
            componentId: props.nodeId,
            componentType: props.componentType,
            触发方式: '通过componentExecutorRegistry注册的执行器',
            防重复执行: true,
            执行序号: currentSequence
          })
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
          console.log(`🔥 [Card2Wrapper] 执行完成但序号已过期，丢弃结果 ${props.nodeId}:`, {
            执行序号: currentSequence,
            最新序号: currentExecutionSequence,
            executionId,
            说明: '执行期间有新的请求，丢弃此次结果'
          })
          resolve()
          return
        }

        if (process.env.NODE_ENV === 'development') {
    if (import.meta.env.DEV) console.log(`🎯 用户要求的打印这几个字 - 阶段1：数据源执行完成，等待DataWarehouse响应式更新`, {
            componentId: props.nodeId,
            执行结果: result.success,
            数据内容: result.data,
            executionId,
            执行序号: currentSequence
          })
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
    if (import.meta.env.DEV) console.error(`❌ [Card2Wrapper] 数据源执行失败 ${props.nodeId}:`, error)
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
      console.log(`🔥 [Card2Wrapper] [${executionId}] 无法获取组件配置`)
      return null
    }

    const snapshot = {
      dataSource: latestConfig.dataSource ? JSON.parse(JSON.stringify(latestConfig.dataSource)) : null,
      base: latestConfig.base ? JSON.parse(JSON.stringify(latestConfig.base)) : null,
      timestamp: Date.now()
    }

    console.log(`🔥 [Card2Wrapper] [${executionId}] 配置快照已捕获:`, {
      hasDataSource: !!snapshot.dataSource,
      hasBase: !!snapshot.base,
      timestamp: snapshot.timestamp
    })

    return snapshot
  } catch (error) {
    console.error(`❌ [Card2Wrapper] [${executionId}] 配置快照捕获失败:`, error)
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
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 初始化数据源配置 ${props.nodeId}`)

    // 检查是否有数据源配置
    const currentConfig = configurationManager.getConfiguration(props.nodeId)
    const hasDataSourceConfig = currentConfig?.dataSource

    if (hasDataSourceConfig) {
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 组件 ${props.nodeId} 有数据源配置，触发配置变更执行`)

      // 🔥 关键：通过"触碰"配置来触发执行，而不是直接执行
      // 这样能确保所有监听器都被正确触发
      configurationManager.updateConfiguration(
        props.nodeId,
        'dataSource',
        currentConfig.dataSource,
        props.componentType
      )
    } else {
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 组件 ${props.nodeId} 无数据源配置，跳过初始化`)
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error(`❌ [Card2Wrapper] 初始化数据源配置失败 ${props.nodeId}:`, error)
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

    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 组件定义变化，已更新节点metadata ${props.nodeId}:`, {
          componentType: props.componentType,
          hasInteractionCapabilities: !!newDef?.interactionCapabilities,
          watchablePropertiesCount: Object.keys(newDef?.interactionCapabilities?.watchableProperties || {}).length
        })
      }
    }
  },
  { immediate: false }
)

// 🔥 监听 componentDataFromWarehouse 变化
watch(
  () => componentDataFromWarehouse.value,
  (newData, oldData) => {
    if (props.componentType === 'digit-indicator') {
      console.log('🔥 [Card2Wrapper] componentDataFromWarehouse 变化:', {
        nodeId: props.nodeId,
        componentType: props.componentType,
        newData,
        oldData,
        newDataKeys: newData && typeof newData === 'object' ? Object.keys(newData) : '不是对象',
        oldDataKeys: oldData && typeof oldData === 'object' ? Object.keys(oldData) : '不是对象',
        timestamp: new Date().toISOString(),
        hasValidNewData: newData && typeof newData === 'object' && Object.keys(newData).length > 0
      })
    }
  },
  { deep: true, immediate: true }
)

// 🔥 新增：强制数据更新机制 - 当数据源执行完成后手动触发
const forceDataRefresh = () => {
  console.log('🔥 [Card2Wrapper] 强制数据刷新:', props.nodeId)
  // 强制清除DataWarehouse缓存
  dataWarehouse.clearComponentMergedCache(props.nodeId)

  // 手动触发计算属性重新计算
  nextTick(() => {
    const freshData = componentDataFromWarehouse.value
    console.log('🔥 [Card2Wrapper] 强制刷新后的数据:', freshData)
  })
}

onMounted(async () => {
    if (import.meta.env.DEV) console.log(`🎯 用户要求的打印这几个字 - 阶段I0：Card2Wrapper组件${props.nodeId}开始挂载`)
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 组件挂载完成 ${props.nodeId}`)

  // 🚀 首先初始化Card2.1 Core响应式数据绑定系统
  checkCard2CoreSupport()
  if (useCard2CoreDataBinding.value) {
    await initializeCard2CoreBinding()
  }

  // 🔥 强制清除缓存，确保获取最新数据
  clearDataCache()

  // 🚨 **关键修复**：强制初始化计算属性，建立Vue响应式依赖
  console.log('🚨 [Card2Wrapper] 强制初始化计算属性，建立响应式依赖:', props.nodeId)
  try {
    // 强制访问计算属性，确保Vue响应式系统能追踪到依赖关系
    const initialData = componentDataFromWarehouse.value
    console.log('🚨 [Card2Wrapper] 初始化计算属性成功，获取数据:', {
      nodeId: props.nodeId,
      hasData: !!initialData,
      dataKeys: initialData && typeof initialData === 'object' ? Object.keys(initialData) : null,
      initialData,
      建立时间: new Date().toLocaleTimeString()
    })
  } catch (initError) {
    console.error('❌ [Card2Wrapper] 初始化计算属性失败:', initError)
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

    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 组件定义已注入到节点metadata ${props.nodeId}:`, {
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
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 组件执行器已注册 ${props.nodeId}`)
    if (import.meta.env.DEV) console.log(`🎯 用户要求的打印这几个字 - 阶段I1：Card2Wrapper执行器注册完成，组件${props.nodeId}，注册表大小: ${componentExecutorRegistry.size}`)

    // 🔥 关键修复：执行器注册后，检查并重新触发已有配置的执行
    nextTick(async () => {
      try {
        // 检查是否已有配置（说明fetchBoard已经执行过）
        const existingConfig = configurationManager.getConfiguration(props.nodeId)
        if (existingConfig && existingConfig.dataSource) {
    if (import.meta.env.DEV) console.log(`🎯 用户要求的打印这几个字 - 阶段I2a：Card2Wrapper发现已有数据源配置，重新触发执行`, {
            组件: props.nodeId,
            有数据源配置: !!existingConfig.dataSource,
            数据源详情: existingConfig.dataSource
          })

          // 直接调用执行器，重新执行数据源
    if (import.meta.env.DEV) console.log(`🎯 用户要求的打印这几个字 - 阶段I2a.5：准备调用executeComponentDataSource，组件${props.nodeId}`)
          await executeComponentDataSource()
    if (import.meta.env.DEV) console.log(`🎯 用户要求的打印这几个字 - 阶段I2b：Card2Wrapper重新执行数据源完成，组件${props.nodeId}`)
        } else {
          // 没有配置，执行初始化
          await initializeDataSourceConfiguration()
    if (import.meta.env.DEV) console.log(`🎯 用户要求的打印这几个字 - 阶段I2c：Card2Wrapper主动触发数据源配置初始化完成，组件${props.nodeId}`)
        }
      } catch (error) {
    if (import.meta.env.DEV) console.error(`❌ [Card2Wrapper] 组件挂载后数据源处理失败 ${props.nodeId}:`, error)
      }
    })
  } else {
    if (import.meta.env.DEV) console.warn(`⚠️ [Card2Wrapper] 组件执行器注册表不可用 ${props.nodeId}`)
  }

  // 🔥 注释：数据源初始化已在执行器注册后进行，这里不需要重复调用

  // 🔥 统一配置中心：交互配置初始化由计算属性自动处理
  const savedConfigs = unifiedConfig.value.interaction?.configs as InteractionConfig[]
  if (savedConfigs && savedConfigs.length > 0) {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 从统一配置加载交互配置:`, {
      configsCount: savedConfigs.length,
      configs: savedConfigs
    })
  } else {
    if (import.meta.env.DEV) console.log(`🎯 [Card2Wrapper] 统一配置中无交互配置，等待用户配置`)
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
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 代理属性监听到组件实例: ${propertyName}`)
          return currentComponentRef.value.watchProperty(propertyName, callback)
        } else {
    if (import.meta.env.DEV) console.warn(`🔥 [Card2Wrapper] 组件实例不支持watchProperty，使用fallback监听`)
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

    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 向路由器注册组件实例: ${props.nodeId}`)
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
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 组件执行器已注销 ${props.nodeId}`)
  }

  // 🔥 清理交互配置路由器中的组件注册
  interactionConfigRouter.unregisterComponent(props.nodeId)
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 交互配置路由器组件已注销 ${props.nodeId}`)

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
    if (import.meta.env.DEV) console.log(`🔥 [Card2Wrapper] 代理属性监听到组件实例: ${propertyName}`)
      return currentComponentRef.value.watchProperty(propertyName, callback)
    } else {
    if (import.meta.env.DEV) console.warn(`🔥 [Card2Wrapper] 组件实例不支持watchProperty，使用fallback监听`)
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