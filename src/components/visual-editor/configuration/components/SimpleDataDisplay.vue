<template>
  <div class="simple-data-display">
    <n-space vertical size="small">
      <n-text strong style="font-size: 12px; color: var(--text-color-2)">
        {{ $t('visualEditor.dataDisplayTest') }}
      </n-text>

      <!-- 当前数据源数据 -->
      <div class="data-section">
        <n-text depth="2" style="font-size: 11px">{{ $t('visualEditor.currentDataSourceData') }}:</n-text>
        <n-code
          :code="objectDataDisplay"
          language="json"
          :show-line-numbers="false"
          style="font-size: 11px; max-height: 100px; overflow-y: auto"
        />
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单数据展示测试组件
 * 用于在配置面板中测试双数据源：对象类型和数组类型
 */

import { computed } from 'vue'
import { NSpace, NText, NCode } from 'naive-ui'
import { $t } from '@/locales'

interface Props {
  objectData?: any // 对象类型数据源
  arrayData?: any // 数组类型数据源
}

const props = withDefaults(defineProps<Props>(), {
  objectData: null,
  arrayData: null
})

// 格式化对象数据显示
const objectDataDisplay = computed(() => {
  const data = props.objectData || props.arrayData
  if (!data || data === null || data === undefined) {
    return '暂无数据'
  }

  // 检查是否为空对象
  if (typeof data === 'object' && Object.keys(data).length === 0) {
    return '暂无数据'
  }
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return String(data)
  }
})

// 格式化数组数据显示
const arrayDataDisplay = computed(() => {
  // 如果传入的数据是数组类型或者有数据就显示，不区分类型
  const data = props.arrayData || props.objectData
  if (!data) return '暂无数据'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
})
</script>

<style scoped>
.simple-data-display {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
}

.data-section {
  margin-bottom: 8px;
}
</style>
