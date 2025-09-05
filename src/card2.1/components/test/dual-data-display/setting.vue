<template>
  <div class="dual-data-display-setting">
    <AutoFormGenerator
      :setting-config="settingConfig"
      :model-value="localConfig"
      @update:model-value="handleConfigChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * dual-data-display 组件设置面板
 * 基于 settingConfig 自动生成设置界面
 */

import { reactive, watch, nextTick } from 'vue'
import { dualDataDisplaySettingConfig } from './settingConfig'
import type { DualDataDisplayConfig } from './settingConfig'
import AutoFormGenerator from '@/card2.1/core/AutoFormGenerator.vue'

// Props接口
interface Props {
  modelValue?: DualDataDisplayConfig
  config?: DualDataDisplayConfig
  widget?: any
  readonly?: boolean
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', config: DualDataDisplayConfig): void
  (e: 'update:config', config: DualDataDisplayConfig): void
  (e: 'change', value: DualDataDisplayConfig, oldValue: DualDataDisplayConfig): void
  (e: 'update', config: DualDataDisplayConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 设置配置
const settingConfig = dualDataDisplaySettingConfig

// 获取默认配置
const getDefaultConfig = (): DualDataDisplayConfig => ({
  ...settingConfig.customConfig
})

// 本地配置状态
const localConfig = reactive<DualDataDisplayConfig>(props.modelValue || props.config || getDefaultConfig())

// 防循环更新标志
let isUpdatingFromProps = false

/**
 * 配置变更处理
 */
const handleConfigChange = (newConfig: DualDataDisplayConfig) => {
  if (isUpdatingFromProps) return

  // 更新本地配置
  Object.assign(localConfig, newConfig)

  // 发送更新事件
  emit('update:modelValue', { ...localConfig })
  emit('update:config', { ...localConfig })
  emit('change', { ...localConfig }, { ...localConfig })
  emit('update', { ...localConfig })
}

/**
 * 监听props配置变化
 */
watch(
  [() => props.modelValue, () => props.config],
  ([newModelValue, newConfig]) => {
    if (isUpdatingFromProps) return

    const sourceConfig = newModelValue || newConfig
    if (sourceConfig) {
      isUpdatingFromProps = true
      try {
        // 合并配置，保持完整的结构
        const mergedConfig = {
          ...getDefaultConfig(),
          ...sourceConfig,
          customize: {
            ...getDefaultConfig().customize,
            ...sourceConfig.customize
          }
        }

        Object.assign(localConfig, mergedConfig)
      } finally {
        nextTick(() => {
          setTimeout(() => {
            isUpdatingFromProps = false
          }, 10)
        })
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.dual-data-display-setting {
  padding: 16px;
}

/* 为AutoFormGenerator提供样式支持 */
:deep(.auto-form-generator) {
  width: 100%;
}

:deep(.n-form-item) {
  margin-bottom: 16px;
}

:deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-color-2);
}

:deep(.form-group) {
  margin-bottom: 20px;
}

:deep(.form-group-title) {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}
</style>
