<template>
  <div class="base-config-form">
    <n-form :model="formData" label-placement="left" label-width="80" size="small">
      <!-- 标题配置 -->
      <n-form-item :label="t('config.base.showTitle')">
        <n-switch v-model:value="formData.showTitle" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item v-if="formData.showTitle" :label="t('config.base.title')">
        <n-input
          v-model:value="formData.title"
          :placeholder="t('config.base.titlePlaceholder')"
          clearable
          @input="handleUpdate"
        />
      </n-form-item>

      <!-- 显示配置 -->
      <n-divider title-placement="left">{{ t('config.base.display.section') }}</n-divider>

      <n-form-item :label="t('config.base.visible')">
        <n-switch v-model:value="formData.visible" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item :label="t('config.base.opacity')">
        <n-slider
          v-model:value="formData.opacity"
          :min="0"
          :max="1"
          :step="0.01"
          :format-tooltip="value => `${Math.round(value * 100)}%`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 样式配置 -->
      <n-divider title-placement="left">{{ t('config.base.style.section') }}</n-divider>

      <n-form-item :label="t('config.base.backgroundColor')">
        <n-color-picker v-model:value="formData.backgroundColor" :show-alpha="true" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item :label="t('config.base.borderWidth')">
        <n-slider
          v-model:value="formData.borderWidth"
          :min="0"
          :max="10"
          :step="1"
          :format-tooltip="value => `${value}px`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <n-form-item v-if="formData.borderWidth > 0" :label="t('config.base.borderColor')">
        <n-color-picker v-model:value="formData.borderColor" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item v-if="formData.borderWidth > 0" :label="t('config.base.borderStyle')">
        <n-select v-model:value="formData.borderStyle" :options="borderStyleOptions" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item :label="t('config.base.borderRadius')">
        <n-slider
          v-model:value="formData.borderRadius"
          :min="0"
          :max="20"
          :step="1"
          :format-tooltip="value => `${value}px`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 间距配置 -->
      <n-divider title-placement="left">{{ t('config.base.layout.section') }}</n-divider>

      <n-form-item :label="t('config.base.padding')">
        <n-slider
          v-model:value="formData.paddingValue"
          :min="0"
          :max="50"
          :step="2"
          :format-tooltip="value => `${value}px`"
          @update:value="handlePaddingUpdate"
        />
      </n-form-item>

      <n-form-item :label="t('config.base.margin')">
        <n-slider
          v-model:value="formData.marginValue"
          :min="0"
          :max="50"
          :step="2"
          :format-tooltip="value => `${value}px`"
          @update:value="handleMarginUpdate"
        />
      </n-form-item>

      <!-- 快捷操作 -->
      <n-divider title-placement="left">{{ t('config.base.advanced.section') }}</n-divider>

      <n-space>
        <n-button size="small" @click="resetToDefaults">{{ t('config.base.resetDefault') }}</n-button>
        <n-button size="small" type="primary" @click="applyConfig">{{ t('config.base.apply') }}</n-button>
      </n-space>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * Base配置表单 - 简化版本
 * 模仿SimpleTestConfig的简洁UI风格
 */

import { reactive, watch, computed, onMounted, onUnmounted, shallowReactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { configurationManager } from '../../configuration'
import type { BaseConfiguration } from '../../configuration/types'

// 接收props
interface Props {
  nodeId?: string
  readonly?: boolean
}

const props = defineProps<Props>()

// 定义emits
interface Emits {
  (e: 'apply', config: BaseConfiguration): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

// 组合式函数
const { t } = useI18n()
const message = useMessage()

// 防止循环更新的标记
let isUpdating = false

/**
 * 表单数据结构 - 简化版本，使用单一数值控制间距
 */
const formData = shallowReactive({
  showTitle: false,
  title: '',
  opacity: 1,
  visible: true,
  backgroundColor: undefined as string | undefined,
  borderWidth: 0,
  borderColor: '#d9d9d9',
  borderStyle: 'solid',
  borderRadius: 6,
  paddingValue: 0, // 统一的内边距值
  marginValue: 0, // 统一的外边距值
  // 实际的padding和margin对象（内部使用）
  padding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
})

/**
 * 边框样式选项
 */
const borderStyleOptions = [
  { label: t('config.base.borderStyles.solid'), value: 'solid' },
  { label: t('config.base.borderStyles.dashed'), value: 'dashed' },
  { label: t('config.base.borderStyles.dotted'), value: 'dotted' },
  { label: t('config.base.borderStyles.double'), value: 'double' }
]

// 当前选中的节点ID
const selectedNodeId = computed(() => {
  return props.nodeId || null
})

/**
 * 防抖更新定时器
 */
let updateTimer: number | null = null

/**
 * 处理内边距更新
 */
const handlePaddingUpdate = () => {
  const value = formData.paddingValue
  formData.padding = {
    top: value,
    right: value,
    bottom: value,
    left: value
  }
  handleUpdate()
}

/**
 * 处理外边距更新
 */
const handleMarginUpdate = () => {
  const value = formData.marginValue
  formData.margin = {
    top: value,
    right: value,
    bottom: value,
    left: value
  }
  handleUpdate()
}

/**
 * 处理配置更新 - 防抖处理
 */
const handleUpdate = () => {
  const nodeId = selectedNodeId.value
  if (!nodeId || isUpdating) {
    return
  }

  // 防抖处理
  if (updateTimer) {
    clearTimeout(updateTimer)
  }

  updateTimer = window.setTimeout(() => {
    try {
      // 构建base配置对象
      const baseConfig: BaseConfiguration = {
        showTitle: formData.showTitle,
        title: formData.title,
        opacity: formData.opacity,
        visible: formData.visible,
        backgroundColor: formData.backgroundColor,
        borderWidth: formData.borderWidth > 0 ? formData.borderWidth : undefined,
        borderColor: formData.borderWidth > 0 ? formData.borderColor : undefined,
        borderStyle: formData.borderWidth > 0 ? formData.borderStyle : undefined,
        borderRadius: formData.borderRadius > 0 ? formData.borderRadius : undefined,
        padding: { ...formData.padding },
        margin: { ...formData.margin }
      }

      // 通过configurationManager更新base配置
      configurationManager.updateConfiguration(nodeId, 'base', baseConfig)
    } catch (error) {
      message.error(t('common.updateFailed'))
    }
  }, 300)
}

/**
 * 从configurationManager加载配置数据到表单
 */
const loadConfigurationFromManager = async () => {
  const nodeId = selectedNodeId.value
  if (!nodeId) {
    resetToDefaults()
    return
  }

  // 防止循环更新
  isUpdating = true

  try {
    const config = configurationManager.getConfiguration(nodeId)
    const baseConfig = config?.base

    if (baseConfig) {
      // 同步配置到表单
      formData.showTitle = baseConfig.showTitle ?? false
      formData.title = baseConfig.title || ''
      formData.opacity = baseConfig.opacity ?? 1
      formData.visible = baseConfig.visible ?? true
      formData.backgroundColor = baseConfig.backgroundColor
      formData.borderWidth = baseConfig.borderWidth ?? 0
      formData.borderColor = baseConfig.borderColor || '#d9d9d9'
      formData.borderStyle = baseConfig.borderStyle || 'solid'
      formData.borderRadius = baseConfig.borderRadius ?? 6

      // 处理padding - 取最大值作为统一值
      if (baseConfig.padding) {
        const padding = baseConfig.padding
        formData.paddingValue = Math.max(padding.top || 0, padding.right || 0, padding.bottom || 0, padding.left || 0)
        formData.padding = { ...padding }
      } else {
        formData.paddingValue = 0
        formData.padding = { top: 0, right: 0, bottom: 0, left: 0 }
      }

      // 处理margin - 取最大值作为统一值
      if (baseConfig.margin) {
        const margin = baseConfig.margin
        formData.marginValue = Math.max(margin.top || 0, margin.right || 0, margin.bottom || 0, margin.left || 0)
        formData.margin = { ...margin }
      } else {
        formData.marginValue = 0
        formData.margin = { top: 0, right: 0, bottom: 0, left: 0 }
      }
    } else {
      resetToDefaults()
    }
  } catch (error) {
    resetToDefaults()
  } finally {
    // 延迟重置标记
    setTimeout(() => {
      isUpdating = false
    }, 50)
  }
}

/**
 * 重置为默认值
 */
const resetToDefaults = () => {
  formData.showTitle = false
  formData.title = ''
  formData.opacity = 1
  formData.visible = true
  formData.backgroundColor = undefined
  formData.borderWidth = 0
  formData.borderColor = '#d9d9d9'
  formData.borderStyle = 'solid'
  formData.borderRadius = 6
  formData.paddingValue = 0
  formData.marginValue = 0
  formData.padding = { top: 0, right: 0, bottom: 0, left: 0 }
  formData.margin = { top: 0, right: 0, bottom: 0, left: 0 }
}

// 配置变化监听器
let removeConfigListener: (() => void) | null = null

/**
 * 监听选中节点变化，重新加载配置
 */
watch(
  selectedNodeId,
  (newNodeId, oldNodeId) => {
    // 移除旧的监听器
    if (removeConfigListener) {
      removeConfigListener()
      removeConfigListener = null
    }

    // 加载新节点的配置
    loadConfigurationFromManager()

    // 如果有新节点，添加配置变化监听器
    if (newNodeId) {
      try {
        removeConfigListener = configurationManager.onConfigurationChange(newNodeId, newConfig => {
          // 重新加载配置（防止外部修改配置时表单不同步）
          loadConfigurationFromManager()
        })
      } catch (error) {}
    }
  },
  { immediate: true }
)

// 组件挂载时初始化
onMounted(() => {
  loadConfigurationFromManager()
})

/**
 * 应用配置
 */
const applyConfig = () => {
  handleUpdate()
  message.success(t('config.base.applySuccess'))
  emit('apply', {
    showTitle: formData.showTitle,
    title: formData.title,
    opacity: formData.opacity,
    visible: formData.visible,
    backgroundColor: formData.backgroundColor,
    borderWidth: formData.borderWidth > 0 ? formData.borderWidth : undefined,
    borderColor: formData.borderWidth > 0 ? formData.borderColor : undefined,
    borderStyle: formData.borderWidth > 0 ? formData.borderStyle : undefined,
    borderRadius: formData.borderRadius > 0 ? formData.borderRadius : undefined,
    padding: { ...formData.padding },
    margin: { ...formData.margin }
  })
}

// 组件卸载时清理
onUnmounted(() => {
  if (removeConfigListener) {
    try {
      removeConfigListener()
    } catch (error) {}
  }

  if (updateTimer) {
    clearTimeout(updateTimer)
  }
})
</script>

<style scoped>
.base-config-form {
  padding: 12px;
  height: 100%;
  overflow-y: auto;
}

/* 表单项样式优化 */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
}

/* 输入控件样式 */
:deep(.n-input),
:deep(.n-input-number),
:deep(.n-select) {
  width: 100%;
}

/* 滑块样式 */
:deep(.n-slider) {
  margin: 8px 0;
}

/* 分割线样式 */
:deep(.n-divider) {
  margin: 16px 0 12px 0;
}

:deep(.n-divider__title) {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

/* 颜色选择器 */
:deep(.n-color-picker) {
  width: 100%;
}

/* 滚动条样式 */
.base-config-form::-webkit-scrollbar {
  width: 4px;
}

.base-config-form::-webkit-scrollbar-track {
  background: transparent;
}

.base-config-form::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.base-config-form::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}
</style>
