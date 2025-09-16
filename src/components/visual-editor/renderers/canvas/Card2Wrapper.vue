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

// 🔥 核心修复：从DataWarehouse获取数据源执行结果  
const componentDataFromWarehouse = computed(() => {
  try {
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

// 交互配置状态
const interactionConfigs = ref<InteractionConfig[]>([])

// 获取组件的交互能力
const componentInteractionCapability = computed<ComponentInteractionCapability | undefined>(() => {
  return currentComponentDef.value?.interactionCapabilities
})

// 交互事件执行器
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
        if (response.modifyConfig) {
          const { targetComponentId, targetProperty, updateValue, updateMode = 'replace' } = response.modifyConfig
          // 更新目标组件属性
          if (targetComponentId === props.nodeId) {
            // 自己更新自己
            updateConfig('component', { [targetProperty]: updateValue })
          } else if (editorContext?.updateNode) {
            // 更新其他组件
            editorContext.updateNode(targetComponentId, {
              properties: { [targetProperty]: updateValue }
            })
          }
        }
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
const handleInteractionEvent = (eventType: InteractionEventType, event?: Event) => {
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
    configs: interactionConfigs.value
  })
  
  // 执行匹配的交互配置
  const matchingConfigs = interactionConfigs.value.filter(config => 
    config.event === eventType && config.enabled !== false
  )
  
  console.log(`🎯 [Card2Wrapper] 找到匹配配置:`, matchingConfigs)
  
  for (const config of matchingConfigs) {
    console.log(`🎯 [Card2Wrapper] 执行配置:`, config)
    // 延迟执行响应
    for (const response of config.responses) {
      console.log(`🎯 [Card2Wrapper] 执行响应:`, response)
      const delay = response.delay || 0
      setTimeout(() => {
        executeInteractionResponse(response)
      }, delay)
    }
  }
}

// ================== 事件处理 ==================

const handleWrapperClick = (event: MouseEvent) => {
  console.log(`🔥 [Card2Wrapper] 点击事件 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  
  // 执行交互响应（内部已有预览模式检查）
  handleInteractionEvent('click', event)
  
  // 原有的预览模式逻辑保持兼容性
  if (!props.previewMode) return
}

const handleContextMenu = (event: MouseEvent) => {
  console.log(`🔥 [Card2Wrapper] 右键菜单 ${props.nodeId}`)
  event.preventDefault() // 阻止默认右键菜单
}

// 新增交互事件处理函数
const handleMouseEnter = (event: MouseEvent) => {
  console.log(`🎯 [Card2Wrapper] 鼠标进入 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  handleInteractionEvent('hover', event)
}

const handleMouseLeave = (event: MouseEvent) => {
  console.log(`🎯 [Card2Wrapper] 鼠标离开 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  // hover事件的离开可以触发一些重置操作
}

const handleFocus = (event: FocusEvent) => {
  console.log(`🎯 [Card2Wrapper] 获得焦点 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  handleInteractionEvent('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  console.log(`🎯 [Card2Wrapper] 失去焦点 ${props.nodeId} (预览模式: ${isPreviewMode.value})`)
  handleInteractionEvent('blur', event)
}

// 🔥 监听来自编辑器层的配置更新事件
const handleConfigUpdateEvent = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.nodeId) {
    console.log(`🔥 [Card2Wrapper] 接收到配置更新事件 ${componentId}:`, { layer, config })
    updateConfig(layer, config)
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
  console.log(`🎯 [Card2Wrapper] 更新交互配置 ${props.nodeId}:`, configs)
  interactionConfigs.value = configs
  
  // 保存到统一配置的interaction层
  updateConfig('interaction', { configs })
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
            
            // 执行所有响应动作
            for (const response of config.responses) {
              console.log(`🎯 [Card2Wrapper] 执行dataChange响应:`, response)
              // 延迟执行避免与同步更新冲突
              setTimeout(() => {
                executeInteractionResponse(response)
              }, response.delay || 100)
            }
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

onMounted(async () => {
  console.log(`🎯 用户要求的打印这几个字 - 阶段I0：Card2Wrapper组件${props.nodeId}开始挂载`)
  console.log(`🔥 [Card2Wrapper] 组件挂载完成 ${props.nodeId}`)

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

  // 初始化交互配置
  const savedConfigs = unifiedConfig.value.interaction?.configs as InteractionConfig[]
  if (savedConfigs) {
    interactionConfigs.value = savedConfigs
    console.log(`🎯 [Card2Wrapper] 加载已保存的交互配置:`, savedConfigs)
  }

  // 监听配置更新和请求事件
  window.addEventListener('card2-config-update', handleConfigUpdateEvent as EventListener)
  window.addEventListener('card2-config-request', handleConfigRequestEvent as EventListener)
})

// 清理事件监听
onUnmounted(() => {
  // 🔥 清理组件执行器注册
  if (componentExecutorRegistry) {
    componentExecutorRegistry.delete(props.nodeId)
    console.log(`🔥 [Card2Wrapper] 组件执行器已注销 ${props.nodeId}`)
  }

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
  getInteractionCapability
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