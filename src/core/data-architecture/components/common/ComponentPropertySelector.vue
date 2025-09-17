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
      <div style="font-size: 12px; color: #999; margin-top: 8px;">
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
 * 基于配置分离原则，使用黑名单机制暴露所有可绑定属性
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'
import { useEditorStore } from '@/store/modules/editor'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import type { WidgetConfiguration } from '@/components/visual-editor/configuration/types'

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
const PROPERTY_BLACKLIST = [
  'metadata',
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  '_internal',
  '__'
]

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
  (newValue) => {
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
 * 获取选中组件的所有可绑定属性（黑名单机制）
 */
const propertyOptions = computed(() => {
  if (!selectedComponentId.value) return []

  console.log(`🚨🚨🚨 [ComponentPropertySelector] 开始获取组件属性:`, {
    selectedComponentId: selectedComponentId.value,
    组件类型: getComponentName(selectedComponentId.value),
    全部已注册组件配置: Object.keys(configurationIntegrationBridge.getAllConfigurations())
  })

  const config = configurationIntegrationBridge.getConfiguration(selectedComponentId.value)

  console.log(`🚨🚨🚨 [ComponentPropertySelector] 配置获取结果:`, {
    selectedComponentId: selectedComponentId.value,
    hasConfig: !!config,
    config: config,
    configType: typeof config,
    configKeys: config ? Object.keys(config) : '无配置',
    isNull: config === null,
    isUndefined: config === undefined
  })

  if (!config) {
    console.error(`❌❌❌ [ComponentPropertySelector] 组件 ${selectedComponentId.value} 无配置，使用备用函数`)
    const fallbackOptions = getStandardPropertiesForEmptyConfig(selectedComponentId.value)
    console.log(`🚨🚨🚨 [ComponentPropertySelector] 备用函数返回:`, {
      optionsCount: fallbackOptions.length,
      options: fallbackOptions.map(opt => opt.label)
    })
    return fallbackOptions
  }

  const options: any[] = []

  console.log(`🔥 [ComponentPropertySelector] 开始解析组件配置:`, {
    componentId: selectedComponentId.value,
    hasConfig: !!config,
    hasBase: !!config?.base,
    hasComponent: !!config?.component,
    完整配置: config,
    base配置详情: config?.base,
    component配置详情: config?.component
  })

  // 🔥 基础层标准属性定义 - 基于BaseConfiguration接口
  const standardBaseProperties = [
    // 显示配置
    { path: 'showTitle', displayPath: '显示标题', type: 'boolean', description: '是否显示组件标题' },
    { path: 'title', displayPath: '标题', type: 'string', description: '组件标题文本' },
    { path: 'visible', displayPath: '可见性', type: 'boolean', description: '组件是否可见' },
    { path: 'opacity', displayPath: '透明度', type: 'number', description: '组件透明度 (0-1)' },

    // 样式配置
    { path: 'backgroundColor', displayPath: '背景颜色', type: 'string', description: '组件背景颜色' },
    { path: 'borderWidth', displayPath: '边框宽度', type: 'number', description: '边框宽度像素值' },
    { path: 'borderColor', displayPath: '边框颜色', type: 'string', description: '边框颜色' },
    { path: 'borderStyle', displayPath: '边框样式', type: 'string', description: '边框样式类型' },
    { path: 'borderRadius', displayPath: '圆角大小', type: 'number', description: '边框圆角像素值' },
    { path: 'boxShadow', displayPath: '阴影效果', type: 'string', description: '盒子阴影效果' },

    // 布局配置 (简化显示，实际是对象)
    { path: 'padding', displayPath: '内边距', type: 'object', description: '组件内边距配置' },
    { path: 'margin', displayPath: '外边距', type: 'object', description: '组件外边距配置' },

    // 设备关联配置 (核心必需)
    { path: 'deviceId', displayPath: '设备ID', type: 'string', description: '关联的设备ID，用于数据源自动配置', isMandatory: true },
    { path: 'metricsList', displayPath: '指标列表', type: 'array', description: '监控的设备指标列表', isMandatory: true }
  ]

  // 添加所有标准基础属性
  standardBaseProperties.forEach(prop => {
    const currentValue = config.base?.[prop.path]
    const option = {
      label: `[基础] ${prop.displayPath} (${prop.type})`,
      value: `${selectedComponentId.value}.base.${prop.path}`,
      propertyInfo: {
        componentId: selectedComponentId.value,
        componentName: getComponentName(selectedComponentId.value),
        layer: 'base',
        propertyName: prop.path,
        propertyLabel: prop.displayPath,
        type: prop.type,
        description: prop.description,
        currentValue: currentValue,
        isMandatory: prop.isMandatory || false
      }
    }
    options.push(option)
  })

  console.log(`🔥 [ComponentPropertySelector] 添加标准基础属性: ${standardBaseProperties.length}个`)

  // 解析 base 层额外配置（不在标准属性列表中的动态属性）
  if (config.base && Object.keys(config.base).length > 0) {
    console.log(`🔥 [ComponentPropertySelector] 解析base层额外配置:`, config.base)
    const baseProperties = extractPropertiesFromObject(config.base, 'base')
    const standardPaths = standardBaseProperties.map(p => p.path)

    baseProperties.forEach(prop => {
      // 跳过已经添加的标准属性
      if (standardPaths.includes(prop.path)) return

      options.push({
        label: `[基础·额外] ${prop.displayPath} (${prop.type})`,
        value: `${selectedComponentId.value}.base.${prop.path}`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'base',
          propertyName: prop.path,
          propertyLabel: prop.displayPath,
          type: prop.type,
          description: `基础配置动态属性: ${prop.displayPath}`,
          currentValue: prop.currentValue
        }
      })
    })
    console.log(`🔥 [ComponentPropertySelector] base层额外属性数量:`, baseProperties.length - standardPaths.length)
  } else {
    console.log(`🔥 [ComponentPropertySelector] base层无额外配置，使用标准属性`)
  }

  // 解析 component 层配置
  if (config.component && Object.keys(config.component).length > 0) {
    console.log(`🔥 [ComponentPropertySelector] 解析component层配置:`, config.component)

    // 🔥 Component层标准属性定义 - 基于ComponentConfiguration接口
    const standardComponentProperties = [
      { path: 'properties', displayPath: '组件属性', type: 'object', description: '组件特定的属性配置' },
      { path: 'styles', displayPath: '组件样式', type: 'object', description: '组件样式配置' },
      { path: 'behavior', displayPath: '组件行为', type: 'object', description: '组件行为配置' },
      { path: 'validation', displayPath: '验证规则', type: 'object', description: '组件验证规则配置' }
    ]

    // 添加标准component属性
    standardComponentProperties.forEach(prop => {
      const currentValue = config.component?.[prop.path]
      options.push({
        label: `[组件] ${prop.displayPath} (${prop.type})`,
        value: `${selectedComponentId.value}.component.${prop.path}`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'component',
          propertyName: prop.path,
          propertyLabel: prop.displayPath,
          type: prop.type,
          description: prop.description,
          currentValue: currentValue
        }
      })
    })

    // 解析额外的component层属性
    const componentProperties = extractPropertiesFromObject(config.component, 'component')
    const standardComponentPaths = standardComponentProperties.map(p => p.path)

    componentProperties.forEach(prop => {
      // 跳过已经添加的标准属性
      if (standardComponentPaths.includes(prop.path)) return

      options.push({
        label: `[组件·额外] ${prop.displayPath} (${prop.type})`,
        value: `${selectedComponentId.value}.component.${prop.path}`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'component',
          propertyName: prop.path,
          propertyLabel: prop.displayPath,
          type: prop.type,
          description: `组件配置动态属性: ${prop.displayPath}`,
          currentValue: prop.currentValue
        }
      })
    })
    console.log(`🔥 [ComponentPropertySelector] component层标准属性: ${standardComponentProperties.length}个，额外属性: ${componentProperties.length - standardComponentPaths.length}个`)
  } else {
    console.log(`🔥 [ComponentPropertySelector] component层配置为空，添加标准component属性占位`)

    // 即使component层为空，也显示标准属性供选择
    const standardComponentProperties = [
      { path: 'properties', displayPath: '组件属性', type: 'object', description: '组件特定的属性配置' },
      { path: 'styles', displayPath: '组件样式', type: 'object', description: '组件样式配置' },
      { path: 'behavior', displayPath: '组件行为', type: 'object', description: '组件行为配置' }
    ]

    standardComponentProperties.forEach(prop => {
      options.push({
        label: `[组件] ${prop.displayPath} (${prop.type})`,
        value: `${selectedComponentId.value}.component.${prop.path}`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'component',
          propertyName: prop.path,
          propertyLabel: prop.displayPath,
          type: prop.type,
          description: prop.description,
          currentValue: undefined
        }
      })
    })
  }

  console.log(`🔥 [ComponentPropertySelector] 属性解析完成:`, {
    componentId: selectedComponentId.value,
    totalProperties: options.length,
    standardBaseProperties: standardBaseProperties.length,
    baseExtraCount: config.base ? Object.keys(config.base).length : 0,
    componentCount: config.component ? Object.keys(config.component).length : 0,
    配置状态: {
      base层是否为空: !config.base || Object.keys(config.base).length === 0,
      component层是否为空: !config.component || Object.keys(config.component).length === 0
    },
    显示的属性类型: options.map(opt => ({
      类型: opt.label.match(/\[(.*?)\]/)?.[1] || '未知',
      属性名: opt.propertyInfo.propertyLabel,
      绑定路径: opt.value
    }))
  })

  return options
})

/**
 * 🔥 为无配置的组件生成标准属性选项
 */
const getStandardPropertiesForEmptyConfig = (componentId: string) => {
  console.warn(`⚠️ [ComponentPropertySelector] 组件 ${componentId} 无配置，生成标准属性`)

  const options: any[] = []

  // 基础层标准属性
  const standardBaseProperties = [
    { path: 'showTitle', displayPath: '显示标题', type: 'boolean' },
    { path: 'title', displayPath: '标题', type: 'string' },
    { path: 'visible', displayPath: '可见性', type: 'boolean' },
    { path: 'opacity', displayPath: '透明度', type: 'number' },
    { path: 'backgroundColor', displayPath: '背景颜色', type: 'string' },
    { path: 'borderWidth', displayPath: '边框宽度', type: 'number' },
    { path: 'borderColor', displayPath: '边框颜色', type: 'string' },
    { path: 'borderStyle', displayPath: '边框样式', type: 'string' },
    { path: 'borderRadius', displayPath: '圆角大小', type: 'number' },
    { path: 'boxShadow', displayPath: '阴影效果', type: 'string' },
    { path: 'padding', displayPath: '内边距', type: 'object' },
    { path: 'margin', displayPath: '外边距', type: 'object' },
    { path: 'deviceId', displayPath: '设备ID', type: 'string' },
    { path: 'metricsList', displayPath: '指标列表', type: 'array' }
  ]

  standardBaseProperties.forEach(prop => {
    options.push({
      label: `[基础] ${prop.displayPath} (${prop.type})`,
      value: `${componentId}.base.${prop.path}`,
      propertyInfo: {
        componentId: componentId,
        componentName: getComponentName(componentId),
        layer: 'base',
        propertyName: prop.path,
        propertyLabel: prop.displayPath,
        type: prop.type,
        description: `标准基础属性: ${prop.displayPath}`,
        currentValue: undefined,
        isMandatory: prop.path === 'deviceId' || prop.path === 'metricsList'
      }
    })
  })

  // 组件层标准属性
  const standardComponentProperties = [
    { path: 'properties', displayPath: '组件属性', type: 'object' },
    { path: 'styles', displayPath: '组件样式', type: 'object' },
    { path: 'behavior', displayPath: '组件行为', type: 'object' }
  ]

  standardComponentProperties.forEach(prop => {
    options.push({
      label: `[组件] ${prop.displayPath} (${prop.type})`,
      value: `${componentId}.component.${prop.path}`,
      propertyInfo: {
        componentId: componentId,
        componentName: getComponentName(componentId),
        layer: 'component',
        propertyName: prop.path,
        propertyLabel: prop.displayPath,
        type: prop.type,
        description: `标准组件属性: ${prop.displayPath}`,
        currentValue: undefined
      }
    })
  })

  console.log(`🔥 [ComponentPropertySelector] 为无配置组件生成 ${options.length} 个标准属性`)
  return options
}

/**
 * 从配置对象中递归提取所有属性（黑名单过滤）
 */
interface PropertyItem {
  path: string
  displayPath: string
  type: string
  currentValue: any
}

const extractPropertiesFromObject = (obj: any, layer: string, prefix = ''): PropertyItem[] => {
  const properties: PropertyItem[] = []

  if (!obj || typeof obj !== 'object') return properties

  Object.keys(obj).forEach(key => {
    // 黑名单检查
    if (isBlacklisted(key)) {
      console.log(`🔥 [ComponentPropertySelector] 跳过黑名单属性: ${key}`)
      return
    }

    const currentPath = prefix ? `${prefix}.${key}` : key
    const displayPath = currentPath
    const value = obj[key]
    const valueType = getValueType(value)

    // 添加当前属性
    properties.push({
      path: currentPath,
      displayPath: displayPath,
      type: valueType,
      currentValue: value
    })

    // 如果是对象且不是数组，递归解析子属性
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const subProperties = extractPropertiesFromObject(value, layer, currentPath)
      properties.push(...subProperties)
    }
  })

  return properties
}

/**
 * 检查属性名是否在黑名单中
 */
const isBlacklisted = (propertyName: string): boolean => {
  const lowerName = propertyName.toLowerCase()
  return PROPERTY_BLACKLIST.some(blacklisted =>
    lowerName.includes(blacklisted.toLowerCase())
  )
}

/**
 * 获取值的类型描述
 */
const getValueType = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value
}

/**
 * 获取组件显示名称
 */
const getComponentName = (componentId: string): string => {
  const component = editorStore.nodes?.find(n => n.id === componentId)
  return component?.type || 'unknown'
}

/**
 * 组件选择变化处理
 */
const onComponentChange = (componentId: string | null) => {
  selectedComponentId.value = componentId || ''
  selectedPropertyPath.value = ''

  // 清空外部值
  emit('update:modelValue', '')
  emit('change', '', undefined)
}

/**
 * 属性选择变化处理
 */
const onPropertyChange = (propertyPath: string | null) => {
  selectedPropertyPath.value = propertyPath || ''

  if (propertyPath) {
    // 获取属性信息
    const option = propertyOptions.value.find(opt => opt.value === propertyPath)
    const propertyInfo = option?.propertyInfo

    console.log(`🚨🚨🚨 [ComponentPropertySelector] 属性选择变化详细调试:`, {
      原始propertyPath: propertyPath,
      propertyPath类型: typeof propertyPath,
      propertyPath长度: propertyPath ? propertyPath.length : 0,
      找到的option: option,
      propertyInfo: propertyInfo,
      所有可用选项: propertyOptions.value.map(opt => ({
        label: opt.label,
        value: opt.value,
        valueType: typeof opt.value
      }))
    })

    console.log(`🚨🚨🚨 [ComponentPropertySelector] 即将emit的值:`, {
      propertyPath,
      propertyPathType: typeof propertyPath,
      propertyPathLength: propertyPath.length,
      propertyInfo,
      当前选项值类型检查: propertyOptions.value.map(opt => ({
        label: opt.label.slice(0, 30),
        value: opt.value,
        valueType: typeof opt.value,
        valueLength: typeof opt.value === 'string' ? opt.value.length : '非字符串'
      }))
    })

    emit('update:modelValue', propertyPath)
    emit('change', propertyPath, propertyInfo)
  } else {
    emit('update:modelValue', '')
    emit('change', '', undefined)
  }
}
</script>

<style scoped>
.component-property-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selector-level {
  width: 100%;
}

.debug-info {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}
</style>