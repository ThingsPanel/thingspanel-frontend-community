<template>
  <div class="component-property-selector">
    <!-- 第一级：组件选择 -->
    <div class="selector-level">
      <n-form-item label="选择组件">
        <n-select
          v-model:value="selectedComponentId"
          :options="componentOptions"
          placeholder="请选择要绑定的组件"
          clearable
          filterable
          @update:value="onComponentChange"
        />
      </n-form-item>
    </div>

    <!-- 第二级：属性选择 -->
    <div v-if="selectedComponentId" class="selector-level">
      <n-form-item label="选择属性">
        <n-select
          v-model:value="selectedPropertyPath"
          :options="propertyOptions"
          placeholder="请选择要绑定的属性"
          clearable
          filterable
          @update:value="onPropertyChange"
        />
      </n-form-item>
    </div>

    <!-- 调试信息 -->
    <div v-if="isDevelopment" class="debug-info">
      <div style="font-size: 12px; color: #999; margin-top: 8px">
        <div>DEBUG - 组件数量: {{ componentOptions.length }}</div>
        <div>DEBUG - 属性数量: {{ propertyOptions.length }}</div>
        <div>DEBUG - 选中路径: {{ selectedPropertyPath }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件属性选择器（二级联动）
 * 🔒 基于白名单安全机制，只暴露经过验证的可绑定属性
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'
import { useEditorStore } from '@/store/modules/editor'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import type { WidgetConfiguration } from '@/components/visual-editor/configuration/types'
// 🔒 导入白名单属性暴露管理器（切换到 Core2 系统）
import { propertyExposureManager } from '@/card2.1/core2/property'
import type { PropertyAccessContext } from '@/card2.1/core2'

// Props 和 Emits
interface Props {
  modelValue?: string
  placeholder?: string
  currentComponentId?: string // 🔥 当前组件ID，用于显示"当前组件"标识
  autoDetectComponentId?: boolean // 🔥 新增：是否自动检测当前活跃组件ID
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', bindingPath: string, propertyInfo?: PropertyInfo): void
}

interface PropertyInfo {
  componentId: string
  componentName: string
  layer: 'base' | 'component'
  propertyName: string
  propertyLabel: string
  type: string
  description?: string
  currentValue?: any
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 黑名单配置 - 排除敏感和内部属性
const PROPERTY_BLACKLIST = ['metadata', 'password', 'token', 'secret', 'key', 'auth', 'credential', '_internal', '__']

// 内部状态
const selectedComponentId = ref<string>('')
const selectedPropertyPath = ref<string>('')

// Editor Store
const editorStore = useEditorStore()

// 开发模式检查
const isDevelopment = process.env.NODE_ENV === 'development'

// 监听外部 modelValue 变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && newValue !== selectedPropertyPath.value) {
      parseBindingPath(newValue)
    } else if (!newValue) {
      selectedComponentId.value = ''
      selectedPropertyPath.value = ''
    }
  },
  { immediate: true }
)

/**
 * 解析绑定路径，设置对应的组件和属性选择
 */
const parseBindingPath = (bindingPath: string) => {
  if (!bindingPath || !bindingPath.includes('.')) return

  const parts = bindingPath.split('.')
  if (parts.length >= 3) {
    const componentId = parts[0]
    selectedComponentId.value = componentId
    selectedPropertyPath.value = bindingPath
  }
}

/**
 * 获取画布上的所有组件选项
 */
const componentOptions = computed(() => {
  const components = editorStore.nodes || []

  return components.map(comp => {
    // 🔥 关键修复：智能确定当前组件
    // 1. 优先使用明确传入的 currentComponentId
    // 2. 如果开启自动检测，使用选中的节点ID或第一个节点
    let effectiveCurrentComponentId = props.currentComponentId

    if (!effectiveCurrentComponentId && props.autoDetectComponentId) {
      // 自动检测：优先使用选中的节点，否则使用第一个节点
      effectiveCurrentComponentId = editorStore.selectedNodeId || components[0]?.id
    }

    const isCurrentComponent = comp.id === effectiveCurrentComponentId
    const componentLabel = isCurrentComponent
      ? `${comp.type || 'unknown'} (当前组件)`
      : `${comp.type || 'unknown'} (${comp.id.slice(0, 8)}...)`

    return {
      label: componentLabel,
      value: comp.id,
      componentType: comp.type
    }
  })
})

/**
 * 🔒 获取组件的白名单属性（安全机制）
 */
const getWhitelistedProperties = async (componentId: string) => {
  if (!componentId) return []

  try {
    // 🔒 获取组件类型
    const componentType = getComponentType(componentId)
    if (!componentType) {
      console.warn(`⚠️ [ComponentPropertySelector] 无法确定组件 ${componentId} 的类型`)
      return []
    }

    // 🔒 从白名单管理器获取安全属性
    const whitelistedProperties = propertyExposureManager.getWhitelistedProperties(
      componentType,
      'public', // 只获取公开级别的属性
      { source: 'property-selector' }
    )

    if (Object.keys(whitelistedProperties).length === 0) {
      return []
    }

    // 🔒 获取组件的当前配置值
    const config = configurationIntegrationBridge.getConfiguration(componentId)
    const options: any[] = []

    // 🔒 遍历白名单属性，生成安全的选项列表
    for (const [propertyName, propConfig] of Object.entries(whitelistedProperties)) {
      const exposedName = propConfig.alias || propertyName

      // 🔒 验证属性访问权限
      const accessContext: PropertyAccessContext = {
        accessType: 'read',
        timestamp: Date.now(),
        source: 'property-selector'
      }

      // 🔒 从多个层级获取当前值，确保白名单属性与配置系统正确关联
      let currentValue = undefined

      // 🔥 修复：全局基础属性优先从 base 层获取
      const isGlobalBaseProperty = propertyName === 'deviceId' || propertyName === 'metricsList'

      if (isGlobalBaseProperty) {
        // 全局基础属性：优先从 base 层获取
        if (config?.base?.[propertyName] !== undefined) {
          currentValue = config.base[propertyName]
        }
        // 兼容性：如果 base 层没有，从其他层获取
        else if (config?.component?.[propertyName] !== undefined) {
          currentValue = config.component[propertyName]
        } else if (config?.customize?.[propertyName] !== undefined) {
          currentValue = config.customize[propertyName]
        } else if (config?.[propertyName] !== undefined) {
          currentValue = config[propertyName]
        }
      } else {
        // 普通组件属性：按原有顺序获取
        // 1. 首先从组件层级获取
        if (config?.component?.[propertyName] !== undefined) {
          currentValue = config.component[propertyName]
        }
        // 2. 从customize层级获取（对于告警状态组件等）
        else if (config?.customize?.[propertyName] !== undefined) {
          currentValue = config.customize[propertyName]
        }
        // 3. 从根层级获取
        else if (config?.[propertyName] !== undefined) {
          currentValue = config[propertyName]
        }
      }

      const accessResult = propertyExposureManager.getExposedProperty(
        componentType,
        componentId,
        propertyName,
        currentValue, // 使用正确获取的当前值
        accessContext
      )

      if (accessResult.allowed) {
        // 🔥 修复：区分全局基础属性和组件特定属性
        const isGlobalBaseProperty = exposedName === 'deviceId' || exposedName === 'metricsList'
        const propertyLayer = isGlobalBaseProperty ? 'base' : 'component'
        const propertyPath = `${componentId}.${propertyLayer}.${exposedName}`

        options.push({
          label: `🔒 [安全] ${propConfig.description || exposedName} (${propConfig.type})${isGlobalBaseProperty ? ' - 全局基础属性' : ''}`,
          value: propertyPath,
          propertyInfo: {
            componentId: componentId,
            componentName: getComponentName(componentId),
            layer: propertyLayer,
            propertyName: exposedName,
            propertyLabel: propConfig.description || exposedName,
            type: propConfig.type,
            description: propConfig.description,
            currentValue: accessResult.value,
            isWhitelisted: true,
            accessLevel: propConfig.level,
            isGlobalBaseProperty
          }
        })
      }
    }

    return options
  } catch (error) {
    console.error(`❌ [ComponentPropertySelector] 白名单属性获取失败:`, error)
    return []
  }
}

/**
 * 🔍 获取组件类型
 */
const getComponentType = (componentId: string): string | null => {
  const components = editorStore.nodes || []
  const component = components.find(comp => comp.id === componentId)
  return component?.type || null
}

/**
 * 🔒 属性选项列表（使用ref支持异步更新）
 */
const propertyOptions = ref<any[]>([])

/**
 * 🔒 异步更新属性选项的函数
 */
const updatePropertyOptions = async () => {
  if (!selectedComponentId.value) {
    propertyOptions.value = []
    return
  }

  try {
    // 🔒 获取白名单属性
    const whitelistOptions = await getWhitelistedProperties(selectedComponentId.value)

    // 🔒 获取组件配置，用于提取设备ID和指标
    const config = configurationIntegrationBridge.getConfiguration(selectedComponentId.value)

    // 🚨 强制添加用户要求的必须暴露属性：设备ID和设备指标
    // 🔥 修复：无论 config 中是否存在，都强制添加，因为这是全局基础属性
    const mandatoryOptions: any[] = []

    // 检查白名单中是否已经有 deviceId
    const hasDeviceIdInWhitelist = whitelistOptions.some(opt => opt.propertyInfo?.propertyName === 'deviceId')

    // 检查白名单中是否已经有 metricsList
    const hasMetricsListInWhitelist = whitelistOptions.some(opt => opt.propertyInfo?.propertyName === 'metricsList')

    // 🔥 修复：只要白名单中不存在，就强制添加，不检查 config 中是否有值
    if (!hasDeviceIdInWhitelist) {
      const currentDeviceId = config?.base?.deviceId || config?.deviceId || ''
      mandatoryOptions.push({
        label: `🚨 [必需] 设备ID (string) - 全局基础属性`,
        value: `${selectedComponentId.value}.base.deviceId`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'base',
          propertyName: 'deviceId',
          propertyLabel: '设备ID',
          type: 'string',
          description: '关联的设备唯一标识（全局基础属性）',
          currentValue: currentDeviceId,
          isWhitelisted: false,
          isMandatory: true,
          userRequired: true
        }
      })
    }

    if (!hasMetricsListInWhitelist) {
      const currentMetricsList = config?.base?.metricsList || config?.metricsList || []
      mandatoryOptions.push({
        label: `🚨 [必需] 设备指标列表 (array) - 全局基础属性`,
        value: `${selectedComponentId.value}.base.metricsList`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'base',
          propertyName: 'metricsList',
          propertyLabel: '设备指标列表',
          type: 'array',
          description: '监控的设备指标列表（全局基础属性）',
          currentValue: currentMetricsList,
          isWhitelisted: false,
          isMandatory: true,
          userRequired: true
        }
      })
    }

    // 🔒 合并所有选项：白名单属性 + 必需属性（已去重）
    const allOptions = [...whitelistOptions, ...mandatoryOptions]

    if (allOptions.length > 0) {
      propertyOptions.value = allOptions
      return
    }

    // 🔒 如果没有任何配置，提供基础安全属性
    console.warn(`⚠️ [ComponentPropertySelector] 组件 ${selectedComponentId.value} 没有配置，只提供基础安全属性`)

    const basicSafeOptions = [
      {
        label: `🔒 [安全] 组件ID (string)`,
        value: `${selectedComponentId.value}.system.componentId`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'system',
          propertyName: 'componentId',
          propertyLabel: '组件ID',
          type: 'string',
          description: '组件的唯一标识符',
          currentValue: selectedComponentId.value,
          isWhitelisted: false,
          isSafeDefault: true
        }
      }
    ]

    propertyOptions.value = basicSafeOptions
  } catch (error) {
    console.error(`❌ [ComponentPropertySelector] 属性获取失败:`, error)
    propertyOptions.value = []
  }
}

// 🔒 监听组件ID变化，自动更新属性选项
watch(
  () => selectedComponentId.value,
  () => {
    updatePropertyOptions()
  },
  { immediate: true }
)

// 🔒 新的白名单安全机制实现完成

/**
 * 获取组件名称
 */
const getComponentName = (componentId: string): string => {
  const components = editorStore.nodes || []
  const component = components.find(comp => comp.id === componentId)
  return component?.name || component?.type || 'Unknown'
}

// 事件处理
const onComponentChange = (componentId: string | null) => {
  selectedComponentId.value = componentId || ''
  selectedPropertyPath.value = ''

  if (componentId) {
    // 组件选择变化时，属性选项会通过 watch 自动更新
    nextTick(() => {
      emit('change', '', null)
    })
  } else {
    emit('change', '', null)
  }
}

const onPropertyChange = (propertyPath: string | null) => {
  // 🔥 关键修复：严格验证绑定路径格式，防止错误值传递
  if (propertyPath) {
    // 验证绑定路径格式：必须是 componentId.layer.propertyName 格式
    const isValidBindingPath =
      typeof propertyPath === 'string' &&
      propertyPath.includes('.') &&
      propertyPath.split('.').length >= 3 &&
      propertyPath.length > 10 && // 绑定路径通常较长
      !/^\d+$/.test(propertyPath) && // 不能是纯数字
      !propertyPath.includes('undefined') && // 不能包含undefined
      !propertyPath.includes('null') // 不能包含null

    if (!isValidBindingPath) {
      console.error(`❌ [ComponentPropertySelector] 检测到无效的绑定路径格式:`, {
        输入值: propertyPath,
        值类型: typeof propertyPath,
        预期格式: 'componentId.layer.propertyName',
        实际长度: typeof propertyPath === 'string' ? propertyPath.length : '非字符串'
      })
      // 拒绝设置无效的绑定路径，保持当前选择不变
      return
    }
  }

  selectedPropertyPath.value = propertyPath || ''

  if (propertyPath) {
    // 从选项中找到对应的属性信息
    const selectedOption = propertyOptions.value.find(opt => opt.value === propertyPath)
    const propertyInfo = selectedOption?.propertyInfo || null

    emit('change', propertyPath, propertyInfo)
  } else {
    emit('change', '', null)
  }
}
</script>

<style scoped>
.component-property-selector {
  width: 100%;
}

.selector-level {
  margin-bottom: 16px;
}

.selector-level:last-child {
  margin-bottom: 0;
}

.selector-level .n-form-item {
  margin-bottom: 0;
}

.selector-level .n-select {
  width: 100%;
}

.debug-info {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}
</style>
