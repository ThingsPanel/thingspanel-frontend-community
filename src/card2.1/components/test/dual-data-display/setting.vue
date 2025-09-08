<script setup lang="ts">
/**
 * dual-data-display 组件设置界面
 * 基于新的三文件结构标准
 */

import { computed, watch } from 'vue'
import AutoFormGenerator from '@/card2.1/core/AutoFormGenerator.vue'
import { dualDataDisplaySettingConfig, type DualDataDisplayConfig, type DualDataDisplayCustomize } from './settingConfig'

// 组件props
interface Props {
  /** 当前配置 */
  config?: DualDataDisplayConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: undefined
})

// 组件事件
interface Emits {
  (e: 'update:config', config: DualDataDisplayConfig): void
  (e: 'change', config: DualDataDisplayConfig): void
}

const emit = defineEmits<Emits>()

/**
 * 当前配置的计算属性
 */
const currentConfig = computed({
  get: (): DualDataDisplayConfig => {
    return props.config || {
      customize: {
        deviceId: '',
        metricsList: [],
        title: '双数据展示',
        themeColor: '#2080f0',
        fontSize: 16,
        showBorder: true,
        dataSource1Label: '数据源A',
        dataSource2Label: '数据源B',
        numberFormat: 'raw',
        unit: '',
        layout: 'horizontal'
      },
      root: {
        transform: {
          rotate: 0,
          scale: 1
        }
      }
    }
  },
  set: (value: DualDataDisplayConfig) => {
    emit('update:config', value)
    emit('change', value)
  }
})

/**
 * 处理配置变更
 */
const handleConfigChange = (newConfig: DualDataDisplayCustomize) => {
  const updatedConfig: DualDataDisplayConfig = {
    ...currentConfig.value,
    customize: newConfig
  }
  
  currentConfig.value = updatedConfig
}

/**
 * 监听props变化，防止循环更新
 */
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig && JSON.stringify(newConfig) !== JSON.stringify(currentConfig.value)) {
      // 只有当配置真正发生变化时才更新
      currentConfig.value = newConfig
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="dual-data-display-setting">
    <!-- 使用AutoFormGenerator生成设置界面 -->
    <AutoFormGenerator
      :config="dualDataDisplaySettingConfig"
      :model-value="currentConfig.customize"
      @update:model-value="handleConfigChange"
    />
  </div>
</template>

<style scoped>
.dual-data-display-setting {
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
}
</style>
