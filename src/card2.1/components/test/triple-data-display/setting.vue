<script setup lang="ts">
/**
 * triple-data-display 组件设置界面
 * 基于新的三文件结构标准
 */

import { computed, watch } from 'vue'
import AutoFormGenerator from '@/card2.1/core/AutoFormGenerator.vue'
import { tripleDataDisplaySettingConfig } from './settingConfig'
import type { TripleDataDisplayConfig, TripleDataDisplayCustomize } from './settingConfig'

// 组件props
interface Props {
  /** 组件配置 */
  config?: TripleDataDisplayConfig
  /** 预览模式 */
  previewMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: undefined,
  previewMode: false
})

// 组件事件定义
interface Emits {
  (e: 'update:config', config: TripleDataDisplayConfig): void
  (e: 'change', config: TripleDataDisplayConfig): void
}

const emit = defineEmits<Emits>()

/**
 * 当前自定义配置
 */
const currentCustomize = computed((): TripleDataDisplayCustomize => {
  return (
    props.config?.customize || {
      deviceId: '',
      metricList: [],
      title: '三数据展示',
      themeColor: '#2080f0',
      fontSize: 16,
      showBorder: true,
      dataSource1Label: '数据源A',
      dataSource2Label: '数据源B',
      dataSource3Label: '数据源C',
      numberFormat: 'raw',
      unit: '',
      layout: 'grid',
      showIcons: true,
      iconSize: 24
    }
  )
})

/**
 * 处理配置变更
 */
const handleConfigChange = (newCustomize: TripleDataDisplayCustomize) => {
  if (!props.config) return

  const newConfig: TripleDataDisplayConfig = {
    ...props.config,
    customize: {
      ...currentCustomize.value,
      ...newCustomize
    }
  }

  emit('update:config', newConfig)
  emit('change', newConfig)
}

/**
 * 监听props变化，防止循环更新
 */
let isInternalUpdate = false

watch(
  () => props.config,
  newConfig => {
    if (isInternalUpdate) {
      isInternalUpdate = false
      return
    }
    // 外部配置变化时的处理逻辑
  },
  { deep: true }
)

/**
 * 处理表单变更（防止循环更新）
 */
const handleFormChange = (newCustomize: TripleDataDisplayCustomize) => {
  isInternalUpdate = true
  handleConfigChange(newCustomize)
}
</script>

<template>
  <div class="triple-data-display-setting">
    <AutoFormGenerator
      :model-value="currentCustomize"
      :config="tripleDataDisplaySettingConfig"
      :preview-mode="previewMode"
      @update:model-value="handleFormChange"
    />
  </div>
</template>

<style scoped>
.triple-data-display-setting {
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
}
</style>
