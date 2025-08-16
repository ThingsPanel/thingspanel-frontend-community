<template>
  <div class="component-config-form">
    <!-- Card2.1组件配置 -->
    <div v-if="isCard2Component && card2ConfigComponent">
      <component 
        :is="card2ConfigComponent"
        :widget="widget"
        :config="componentConfig"
        :readonly="readonly"
        @update="handleCard2ConfigUpdate"
      />
    </div>

    <!-- 传统组件配置 -->
    <div v-else-if="!isCard2Component">
      <div style="border: 2px solid #ccc; padding: 16px; margin: 16px 0; background: #f9f9f9; border-radius: 6px; text-align: center;">
        <h3 style="color: #666; margin: 0 0 8px 0;">📦 传统组件配置</h3>
        <p style="margin: 0; font-size: 14px; color: #888;">
          组件类型: {{ widget?.type || '未知' }}
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">
          传统组件配置功能待实现
        </p>
      </div>
    </div>

    <!-- 无配置组件 -->
    <div v-else>
      <div style="border: 2px solid #orange; padding: 16px; margin: 16px 0; background: #fff7e6; border-radius: 6px; text-align: center;">
        <h3 style="color: #d46b08; margin: 0 0 8px 0;">⚠️ 无可用配置</h3>
        <p style="margin: 0; font-size: 14px; color: #ad6800;">
          组件类型: {{ widget?.type || '未知' }}
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #ad6800;">
          该组件未提供配置界面
        </p>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="showDebug" style="border: 1px solid #ddd; padding: 8px; margin: 8px 0; background: #f5f5f5; font-size: 12px;">
      <details>
        <summary style="cursor: pointer; color: #666;">🐛 调试信息</summary>
        <div style="margin-top: 8px;">
          <p><strong>isCard2Component:</strong> {{ isCard2Component }}</p>
          <p><strong>hasCard2ConfigComponent:</strong> {{ !!card2ConfigComponent }}</p>
          <p><strong>widget.type:</strong> {{ widget?.type }}</p>
          <p><strong>widget.metadata?.isCard2Component:</strong> {{ widget?.metadata?.isCard2Component }}</p>
          <p><strong>componentConfig keys:</strong> {{ componentConfig ? Object.keys(componentConfig) : 'null' }}</p>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件特定配置表单
 * 位置：src/components/visual-editor/renderers/base/ComponentConfigForm.vue
 * 负责处理各个组件的特定配置，支持Card2.1组件的独立配置
 */

import { computed, watch } from 'vue'
import { useVisualEditorIntegration as useCard2Integration } from '@/card2.1/hooks/useVisualEditorIntegration'

interface Props {
  widget?: any
  readonly?: boolean
  showAdvanced?: boolean
}

interface Emits {
  (e: 'validate', isValid: boolean): void
  (e: 'toggle-advanced'): void
  (e: 'update', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Card2集成hook
const card2Integration = useCard2Integration({ autoInit: true })

// 调试开关
const showDebug = false // 设为true显示调试信息

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
    // 通过Card2集成hook获取组件定义
    const componentDefinition = card2Integration.getComponentDefinition(props.widget.type)
    
    if (componentDefinition?.configComponent) {
      console.log('[ComponentConfigForm] 找到Card2配置组件:', {
        componentType: props.widget.type,
        hasConfigComponent: !!componentDefinition.configComponent
      })
      return componentDefinition.configComponent
    } else {
      console.warn('[ComponentConfigForm] Card2组件没有配置组件:', props.widget.type)
      return null
    }
  } catch (error) {
    console.error('[ComponentConfigForm] 获取Card2配置组件失败:', error)
    return null
  }
})

/**
 * 组件配置数据
 */
const componentConfig = computed(() => {
  if (!props.widget) return null
  
  // 从widget.properties中获取配置
  return props.widget.properties || {}
})

/**
 * 处理Card2配置更新
 */
const handleCard2ConfigUpdate = (newConfig: any) => {
  console.log('[ComponentConfigForm] Card2配置更新:', {
    componentType: props.widget?.type,
    newConfig
  })
  
  // 发送配置更新事件
  emit('update', newConfig)
}

/**
 * 监听widget变化
 */
watch(
  () => props.widget,
  (newWidget) => {
    console.log('[ComponentConfigForm] Widget变化:', {
      type: newWidget?.type,
      isCard2: newWidget?.metadata?.isCard2Component,
      hasProperties: !!newWidget?.properties
    })
  },
  { deep: true, immediate: true }
)

console.log('[ComponentConfigForm] 🎯 组件配置表单加载完成')
</script>

<style scoped>
.component-config-form {
  padding: 0;
}

/* 确保动态组件能正常显示 */
:deep(.simple-test-config) {
  border: none;
  padding: 0;
}
</style>