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

    <!-- 开发模式调试tip -->
    <div v-if="isDevelopment" class="debug-tip">
      <n-tooltip>
        <template #trigger>
          <span class="debug-icon">🐛</span>
        </template>
        <div>
          <div>类型: {{ widget?.type }}</div>
          <div>Card2.1: {{ isCard2Component ? '是' : '否' }}</div>
          <div>有配置: {{ !!card2ConfigComponent ? '是' : '否' }}</div>
          <div style="margin-top: 8px;">
            <n-button size="tiny" @click="logToConsole">控制台输出</n-button>
          </div>
        </div>
      </n-tooltip>
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
import {
  NTooltip,
  NButton,
  useMessage
} from 'naive-ui'
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
 * 🔥 统一配置中心：从配置管理器获取组件配置
 */
const getComponentConfig = (): any => {
  if (!props.widget) return {}

  if (props.widget?.metadata?.isCard2Component) {
    // 🔥 Card2组件：获取配置管理器中的配置
    const nodeId = props.widget.id

    // 🔥 异步获取配置，避免模块导入问题
    import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      .then(({ configurationIntegrationBridge }) => {
        const fullConfig = configurationIntegrationBridge.getConfiguration(nodeId)
        if (fullConfig?.component) {
          componentConfig.value = fullConfig.component
        }
      })
      .catch(error => {
        console.warn(`⚠️ [ComponentConfigForm] 获取配置失败:`, error)
      })

    // 🔥 返回默认配置作为初始值
    const card2Definition = props.widget?.metadata?.card2Definition
    const defaultConfig = card2Definition?.defaultConfig?.customize || {}
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

// 🔥 新增：用户编辑状态标记
const isUserEditing = ref(false)

/**
 * 🔥 统一配置中心：配置更新处理 - 修复配置合并和重复更新问题
 */
const handleConfigUpdate = (newConfig: any) => {

  // 🔥 标记用户正在编辑，防止外部更新覆盖
  isUserEditing.value = true

  // 🔥 修复：完整合并配置，避免覆盖其他字段
  const mergedConfig = {
    ...componentConfig.value,
    ...newConfig
  }

  // 更新本地配置
  componentConfig.value = mergedConfig

  // 🔥 统一配置中心：直接通过配置管理器保存完整配置
  if (props.widget?.metadata?.isCard2Component && props.widget?.id) {
    const nodeId = props.widget.id

    // 🔥 修复：使用动态import，避免require报错
    import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      .then(({ configurationIntegrationBridge }) => {
        configurationIntegrationBridge.updateConfiguration(
          nodeId,
          'component',
          mergedConfig, // 🔥 保存完整配置，不是部分配置
          props.widget.type
        )
      })
      .catch(error => {
        console.error(`❌ [ComponentConfigForm] 保存配置失败:`, error)
      })
  } else {
    // 传统组件：直接更新properties
    if (props.widget?.properties) {
      Object.assign(props.widget.properties, mergedConfig)
    }
  }

  // 通知编辑器
  emit('update', mergedConfig)

  // 🔥 延迟重置编辑状态，给配置保存足够时间
  setTimeout(() => {
    isUserEditing.value = false
  }, 500)
}

/**
 * 🔥 监听Card2配置变更事件，实时同步配置面板显示
 */
const handleCard2ConfigUpdate = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.widget?.id && layer === 'component') {
    // 🔥 修复：只有当不是用户正在编辑时才更新
    if (!isUserEditing.value) {
      // 🔥 关键修复：完全替换配置，而不是合并，确保配置面板完全同步
      componentConfig.value = { ...config }  // 完全使用新配置
    } else {
    }
  }
}

// 🔥 监听配置更新事件（移除定时同步，避免覆盖用户输入）
onMounted(() => {
  window.addEventListener('card2-config-update', handleCard2ConfigUpdate as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('card2-config-update', handleCard2ConfigUpdate as EventListener)
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
    }
  },
  { immediate: true }
)

// ============ 调试方法 ============

/**
 * 输出调试信息到控制台
 */
const logToConsole = () => {
  console.group('🔍 [ComponentConfigForm] 调试信息')
  console.groupEnd()
}
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
  position: relative;
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

/* 调试tip样式 */
.debug-tip {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.debug-icon {
  font-size: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.debug-icon:hover {
  opacity: 1;
}
</style>