<template>
  <div class="component-config-form">
    <!-- 🔥 调试信息面板 -->
    <div v-if="isDevelopment" style="background: #f0f0f0; padding: 8px; margin-bottom: 8px; font-size: 12px;">
      <div>isCard2Component: {{ isCard2Component }}</div>
      <div>widget?.type: {{ widget?.type }}</div>
      <div>widget?.metadata?.isCard2Component: {{ widget?.metadata?.isCard2Component }}</div>
      <div>hasCard2ConfigComponent: {{ !!card2ConfigComponent }}</div>
      <div>card2Definition: {{ !!widget?.metadata?.card2Definition }}</div>
      <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #ccc;">
        <strong>componentConfig:</strong> {{ JSON.stringify(componentConfig, null, 2) }}
      </div>
    </div>

    <!-- Card2.1组件配置 -->
    <div v-if="isCard2Component && card2ConfigComponent">
      <component
        :is="card2ConfigComponent"
        v-model="componentConfig"
        :widget="widget"
        :config="componentConfig"
        :readonly="readonly"
        @update:modelValue="handleConfigUpdate"
        @change="handleConfigUpdate"
      />
    </div>

    <!-- Card2组件但没有配置组件 -->
    <div v-else-if="isCard2Component && !card2ConfigComponent">
      <div
        style="
          border: 2px solid orange;
          padding: 16px;
          margin: 16px 0;
          background: #fff8e1;
          border-radius: 6px;
          text-align: center;
        "
      >
        <h3 style="color: #f57c00; margin: 0 0 8px 0">🔧 Card2组件配置</h3>
        <p style="margin: 0; font-size: 14px; color: #666">组件类型: {{ widget?.type || '未知' }}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #999">该Card2组件暂无配置表单</p>
      </div>
    </div>

    <!-- 传统组件配置 -->
    <div v-else-if="!isCard2Component">
      <div
        style="
          border: 2px solid #ccc;
          padding: 16px;
          margin: 16px 0;
          background: #f9f9f9;
          border-radius: 6px;
          text-align: center;
        "
      >
        <h3 style="color: #666; margin: 0 0 8px 0">📦 传统组件配置</h3>
        <p style="margin: 0; font-size: 14px; color: #888">组件类型: {{ widget?.type || '未知' }}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #999">传统组件配置功能待实现</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件特定配置表单 - 重写版本
 * 位置：src/components/visual-editor/renderers/base/ComponentConfigForm.vue
 * 负责处理各个组件的特定配置，支持Card2.1组件的独立配置
 */

import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useComponentTree as useCard2Integration } from '@/card2.1/hooks/useComponentTree'

interface Props {
  widget?: any
  readonly?: boolean
}

interface Emits {
  (e: 'validate', isValid: boolean): void
  (e: 'update', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Card2集成hook
const card2Integration = useCard2Integration({ autoInit: true })

// 开发环境判断
const isDevelopment = computed(() => import.meta.env.DEV)

/**
 * 判断是否为Card2.1组件
 */
const isCard2Component = computed(() => {
  return props.widget?.metadata?.isCard2Component === true
})

/**
 * 获取Card2组件的配置组件
 */
const card2ConfigComponent = computed(() => {
  if (!isCard2Component.value || !props.widget?.type) {
    return null
  }

  try {
    // 🔥 优先从widget.metadata.card2Definition获取配置组件
    const card2Definition = props.widget?.metadata?.card2Definition
    if (card2Definition?.configComponent) {
      return card2Definition.configComponent
    }

    // 通过Card2集成hook获取组件定义（从filteredComponents中查找）
    const componentDefinition = card2Integration.filteredComponents.value.find(
      comp => comp.type === props.widget.type
    )

    // 优先使用组件自定义的配置组件
    if (componentDefinition?.configComponent) {
      return componentDefinition.configComponent
    }

    // 如果组件有配置属性但没有自定义配置组件，使用通用配置表单
    const hasProperties =
      componentDefinition?.config?.properties &&
      Object.keys(componentDefinition.config.properties).length > 0

    if (hasProperties) {
      // 返回通用的Card2配置表单（使用FlexibleConfigForm）
      return () => import('@/card2.1/core/FlexibleConfigForm.vue')
    }

    return null
  } catch (error) {
    console.error('❌ [ComponentConfigForm] 获取配置组件出错', error)
    return null
  }
})

/**
 * 🔥 修复：从Card2Wrapper实时配置获取数据，而非仅使用默认值
 */
const getComponentConfig = (): any => {
  if (!props.widget) return {}
  
  if (props.widget?.metadata?.isCard2Component) {
    // 🔥 Card2组件：优先从Card2Wrapper获取实时配置
    const nodeId = props.widget.id
    const cardElement = document.querySelector(`[data-component-id="${nodeId}"]`)
    
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      try {
        const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()
        if (fullConfig?.component) {
          console.log(`🔥 [ComponentConfigForm] 从Card2Wrapper获取实时配置 ${nodeId}:`, fullConfig.component)
          return fullConfig.component
        }
      } catch (error) {
        console.warn(`🔥 [ComponentConfigForm] 获取实时配置失败，使用默认配置:`, error)
      }
    }
    
    // 🔥 备用：如果无法从Card2Wrapper获取，使用默认配置
    const card2Definition = props.widget?.metadata?.card2Definition
    const defaultConfig = card2Definition?.defaultConfig?.customize || {}
    console.log(`🔥 [ComponentConfigForm] 使用默认配置 ${nodeId}:`, defaultConfig)
    return defaultConfig
  } else {
    // 传统组件：从properties获取
    return props.widget?.properties || {}
  }
}

/**
 * 组件配置数据
 */
const componentConfig = ref<any>(getComponentConfig())

/**
 * 🔥 简单的配置更新处理 - 直接更新Card2Wrapper
 */
const handleConfigUpdate = (newConfig: any) => {
  console.log(`🔥 [ComponentConfigForm] 配置更新:`, newConfig)
  
  // 更新本地配置
  componentConfig.value = { ...componentConfig.value, ...newConfig }
  
  // 🔥 直接更新Card2Wrapper的配置
  if (props.widget?.metadata?.isCard2Component) {
    const nodeId = props.widget.id
    const cardElement = document.querySelector(`[data-component-id="${nodeId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.updateConfig) {
      console.log(`🔥 [ComponentConfigForm] 直接更新Card2Wrapper:`, nodeId)
      ;(cardElement as any).__vueParentComponent.exposed.updateConfig('component', newConfig)
    }
  } else {
    // 传统组件：直接更新properties
    if (props.widget?.properties) {
      Object.assign(props.widget.properties, newConfig)
    }
  }
  
  // 通知编辑器
  emit('update', newConfig)
}

/**
 * 🔥 监听Card2配置变更事件，实时同步配置面板显示
 */
const handleCard2ConfigUpdate = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.widget?.id && layer === 'component') {
    console.log(`🔥 [ComponentConfigForm] 接收到Card2配置变更事件:`, componentId, config)
    componentConfig.value = { ...componentConfig.value, ...config }
  }
}

/**
 * 🔥 定时同步Card2Wrapper的最新配置（备用机制）
 */
const syncFromCard2Wrapper = () => {
  if (!props.widget?.metadata?.isCard2Component || !props.widget?.id) return
  
  try {
    const nodeId = props.widget.id
    const cardElement = document.querySelector(`[data-component-id="${nodeId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()
      if (fullConfig?.component) {
        // 检查是否有变化
        if (JSON.stringify(componentConfig.value) !== JSON.stringify(fullConfig.component)) {
          console.log(`🔥 [ComponentConfigForm] 定时同步Card2配置:`, fullConfig.component)
          componentConfig.value = fullConfig.component
        }
      }
    }
  } catch (error) {
    console.warn(`🔥 [ComponentConfigForm] 同步Card2配置失败:`, error)
  }
}

let syncTimer: number | null = null

// 🔥 监听配置更新事件和定时同步
onMounted(() => {
  window.addEventListener('card2-config-update', handleCard2ConfigUpdate as EventListener)
  console.log(`🔥 [ComponentConfigForm] 开始监听Card2配置更新`)
  
  // 启动定时同步（每200ms检查一次）
  syncTimer = setInterval(syncFromCard2Wrapper, 200)
})

onUnmounted(() => {
  window.removeEventListener('card2-config-update', handleCard2ConfigUpdate as EventListener)
  
  // 清理定时器
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
})

/**
 * 监听widget变化，重新获取配置
 */
watch(
  () => props.widget?.id,
  (newId) => {
    if (newId) {
      const newConfig = getComponentConfig()
      componentConfig.value = newConfig
      console.log(`🔥 [ComponentConfigForm] Widget变化，重新加载配置:`, newConfig)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.component-config-form {
  /* 占满整个配置面板 */
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
}

/* Card2组件配置区域 */
.component-config-form > div {
  flex: 1;
  height: 100%;
  overflow-y: auto;
}

/* 确保动态组件能正常显示并占满空间 */
:deep(.simple-test-config) {
  border: none;
  padding: 0;
  height: 100%;
}

/* 确保传统组件提示居中显示 */
.component-config-form > div[style*='border: 2px solid'] {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>