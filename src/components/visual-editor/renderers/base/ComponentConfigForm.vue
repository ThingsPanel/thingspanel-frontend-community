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

    <!-- 无配置组件 -->
    <div v-else>
      <div
        style="
          border: 2px solid #orange;
          padding: 16px;
          margin: 16px 0;
          background: #fff7e6;
          border-radius: 6px;
          text-align: center;
        "
      >
        <h3 style="color: #d46b08; margin: 0 0 8px 0">⚠️ 无可用配置</h3>
        <p style="margin: 0; font-size: 14px; color: #ad6800">组件类型: {{ widget?.type || '未知' }}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #ad6800">该组件未提供配置界面</p>
      </div>
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
}

interface Emits {
  (e: 'validate', isValid: boolean): void
  (e: 'update', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Card2集成hook
const card2Integration = useCard2Integration({ autoInit: true })

// 调试开关 - 已删除调试信息

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
    const componentWidget = card2Integration.getComponentDefinition(props.widget.type)

    console.log('[ComponentConfigForm] 获取组件定义结果:', {
      componentType: props.widget.type,
      hasWidget: !!componentWidget,
      hasDefinition: !!componentWidget?.definition,
      hasConfigComponent: !!componentWidget?.definition?.configComponent,
      configComponent: componentWidget?.definition?.configComponent
    })

    if (componentWidget?.definition?.configComponent) {
      console.log('[ComponentConfigForm] 找到Card2配置组件:', {
        componentType: props.widget.type,
        configComponent: componentWidget.definition.configComponent
      })
      return componentWidget.definition.configComponent
    } else {
      console.warn('[ComponentConfigForm] Card2组件没有配置组件:', {
        componentType: props.widget.type,
        widget: componentWidget,
        definition: componentWidget?.definition
      })
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
  newWidget => {
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
