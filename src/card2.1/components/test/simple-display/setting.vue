<template>
  <div class="simple-display-setting">
    <AutoFormGenerator
      :setting-config="settingConfig"
      :model-value="localConfig"
      @update:model-value="handleConfigChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * simple-display 组件设置面板
 * 基于 settingConfig 自动生成设置界面
 */

import { reactive, watch, nextTick } from 'vue'
import { simpleDisplaySettingConfig, customConfig } from './settingConfig'
import type { SimpleDisplayConfig } from './settingConfig'
import AutoFormGenerator from '@/card2.1/core/AutoFormGenerator.vue'

// Props接口
interface Props {
  modelValue?: SimpleDisplayConfig
  config?: SimpleDisplayConfig
  widget?: any
  readonly?: boolean
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', config: SimpleDisplayConfig): void
  (e: 'update:config', config: SimpleDisplayConfig): void
  (e: 'change', value: SimpleDisplayConfig, oldValue: SimpleDisplayConfig): void
  (e: 'update', config: SimpleDisplayConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 设置配置
const settingConfig = simpleDisplaySettingConfig

// 获取默认配置
const getDefaultConfig = (): SimpleDisplayConfig => ({
  ...customConfig
})

// 本地配置状态
const localConfig = reactive<SimpleDisplayConfig>(props.modelValue || props.config || getDefaultConfig())

// 防循环更新标志
let isUpdatingFromProps = false

/**
 * 配置变更处理
 */
const handleConfigChange = (newConfig: SimpleDisplayConfig) => {
  if (isUpdatingFromProps) return

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
.simple-display-setting {
  padding: 16px;
}
</style>
