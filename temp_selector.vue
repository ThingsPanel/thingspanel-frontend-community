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
 * 🔒 基于白名单安全机制，只暴露经过验证的可绑定属性
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'
import { useEditorStore } from '@/store/modules/editor'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import type { WidgetConfiguration } from '@/components/visual-editor/configuration/types'
// 🔒 导入白名单属性暴露管理器
import { propertyExposureManager } from '@/card2.1/core/PropertyExposureManager'
import type { PropertyAccessContext } from '@/card2.1/core/types'

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
      console.log(`🔒 [ComponentPropertySelector] 组件 ${componentType} 没有配置属性白名单`)
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

      const accessResult = propertyExposureManager.getExposedProperty(
        componentType,
        componentId,
        propertyName,
        config?.component?.[propertyName], // 尝试获取当前值
        accessContext
      )

      if (accessResult.allowed) {
        options.push({
          label: `🔒 [安全] ${propConfig.description || exposedName} (${propConfig.type})`,
          value: `${componentId}.whitelist.${exposedName}`,
          propertyInfo: {
            componentId: componentId,
            componentName: getComponentName(componentId),
            layer: 'whitelist',
            propertyName: exposedName,
            propertyLabel: propConfig.description || exposedName,
            type: propConfig.type,
            description: propConfig.description,
            currentValue: accessResult.value,
            isWhitelisted: true,
            accessLevel: propConfig.level
          }
        })
      }
    }

    console.log(`🔒 [ComponentPropertySelector] 白名单属性获取完成:`, {
      componentType,
      whitelistCount: Object.keys(whitelistedProperties).length,
      accessibleCount: options.length,
      properties: options.map(opt => opt.propertyInfo.propertyName)
    })

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

  console.log(`🔒 [ComponentPropertySelector] 开始获取白名单属性:`, {
    selectedComponentId: selectedComponentId.value,
    组件类型: getComponentType(selectedComponentId.value)
  })

  try {
    // 🔒 优先使用白名单属性
    const whitelistOptions = await getWhitelistedProperties(selectedComponentId.value)

    if (whitelistOptions.length > 0) {
      console.log(`🔒 [ComponentPropertySelector] 使用白名单属性:`, whitelistOptions.length)
      propertyOptions.value = whitelistOptions
      return
    }

    // 🔒 如果没有白名单配置，显示警告并提供基础属性
    console.warn(`⚠️ [ComponentPropertySelector] 组件 ${selectedComponentId.value} 没有白名单配置，将只提供基础安全属性`)

    // 🔒 提供最基础的安全属性
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

