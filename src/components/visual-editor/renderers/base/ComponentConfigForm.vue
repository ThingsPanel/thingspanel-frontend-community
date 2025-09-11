<template>
  <div class="component-config-form">
    <!-- Card2.1组件配置 -->
    <div v-if="isCard2Component && card2ConfigComponent">
      <component
        :is="card2ConfigComponent"
        v-model="componentConfig"
        :widget="widget"
        :config="componentConfig"
        :readonly="readonly"
        @update:modelValue="handleCard2ConfigUpdate"
        @change="handleCard2ConfigUpdate"
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
  </div>
</template>

<script setup lang="ts">
/**
 * 组件特定配置表单
 * 位置：src/components/visual-editor/renderers/base/ComponentConfigForm.vue
 * 负责处理各个组件的特定配置，支持Card2.1组件的独立配置
 */

import { computed, ref, watch, nextTick } from 'vue'
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
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ComponentConfigForm] 跳过配置加载', {
      isCard2Component: isCard2Component.value,
      widgetType: props.widget?.type
    })
    }
    return null
  }

  try {
    // 通过Card2集成hook获取组件定义（从filteredComponents中查找）
    const componentDefinition = card2Integration.filteredComponents.value.find(
      comp => comp.type === props.widget.type
    )
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ComponentConfigForm] 组件定义获取结果', {
      widgetType: props.widget.type,
      hasComponentDefinition: !!componentDefinition,
      hasConfigComponent: !!componentDefinition?.configComponent,
      configComponentName: componentDefinition?.configComponent?.name || 'unknown',
      allAvailableComponents: card2Integration.filteredComponents.value.map(c => c.type),
      totalAvailableCount: card2Integration.filteredComponents.value.length
    })
    }

    // 优先使用组件自定义的配置组件
    if (componentDefinition?.configComponent) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [ComponentConfigForm] 使用自定义配置组件', {
        componentName: componentDefinition.configComponent.name || 'unknown'
      })
      }
      return componentDefinition.configComponent
    }

    // 如果组件有配置属性但没有自定义配置组件，使用通用配置表单
    const hasProperties =
      componentDefinition?.config?.properties &&
      Object.keys(componentDefinition.config.properties).length > 0

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [ComponentConfigForm] 检查配置属性', {
      hasProperties,
      propertiesCount: componentDefinition?.config?.properties ? 
        Object.keys(componentDefinition.config.properties).length : 0,
      configStructure: componentDefinition?.config
    })
    }

    if (hasProperties) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 [ComponentConfigForm] 使用通用配置表单 (FlexibleConfigForm)')
      }
      // 返回通用的Card2配置表单（使用FlexibleConfigForm）
      return () => import('@/card2.1/core/FlexibleConfigForm.vue')
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('❌ [ComponentConfigForm] 无配置组件可用')
    }
    return null
  } catch (error) {
    console.error('❌ [ComponentConfigForm] 获取配置组件出错', error)
    return null
  }
})

/**
 * 组件配置数据 - 响应式引用，支持双向绑定
 */
const componentConfig = ref<any>(props.widget?.properties || {})

// 防循环更新标志
let isUpdatingConfig = false

// 监听widget变化，同步配置数据
watch(
  () => props.widget?.properties,
  newProperties => {
    // 防止循环更新
    if (isUpdatingConfig) {
      return
    }

    if (newProperties) {
      // 使用 JSON 序列化比较，避免引用比较问题
      const newPropsJson = JSON.stringify(newProperties)
      const currentConfigJson = JSON.stringify(componentConfig.value)

      if (newPropsJson !== currentConfigJson) {
        // 设置防循环标志
        isUpdatingConfig = true

        try {
          componentConfig.value = { ...newProperties }
        } finally {
          // 使用 nextTick 确保所有响应式更新完成后再重置标志
          nextTick(() => {
            setTimeout(() => {
              isUpdatingConfig = false
            }, 10) // 短暂延迟确保更新完成
          })
        }
      }
    }
  },
  { deep: true, immediate: true }
)

/**
 * 处理Card2配置更新
 */
const handleCard2ConfigUpdate = (newConfig: any) => {
  // 防止循环更新
  if (isUpdatingConfig) {
    return
  }

  isUpdatingConfig = true

  try {
    // 更新本地配置状态
    componentConfig.value = { ...componentConfig.value, ...newConfig }

    if (props.widget?.properties) {
      Object.assign(props.widget.properties, newConfig)
    }

    // 发送配置更新事件
    emit('update', newConfig)
  } finally {
    // 延迟重置防循环标志
    nextTick(() => {
      setTimeout(() => {
        isUpdatingConfig = false
      }, 10)
    })
  }
}

/**
 * 监听widget变化
 */
watch(
  () => props.widget,
  newWidget => {},
  { deep: true, immediate: true }
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
