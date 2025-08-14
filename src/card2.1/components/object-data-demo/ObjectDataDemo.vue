<template>
  <div class="object-data-demo">
    <div class="demo-header">
      <n-icon><CubeOutline /></n-icon>
      <span>对象数据源示例</span>
      <n-tag size="small" :type="objectData ? 'success' : 'default'">
        {{ objectData ? '已配置' : '未配置' }}
      </n-tag>
    </div>

    <div class="demo-content">
      <div
        v-if="objectData && typeof objectData === 'object' && Object.keys(objectData).length > 0"
        class="data-display"
      >
        <div v-for="(value, key) in objectData" :key="key" class="data-item">
          <span class="key">{{ key }}:</span>
          <span class="value">{{ formatValue(value) }}</span>
        </div>
      </div>
      <div v-else class="no-data">
        <n-empty description="暂无数据" size="small">
          <template #extra>
            <n-text depth="3" style="font-size: 11px">💡 在右侧"数据源"配置中添加对象数据</n-text>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 对象数据源演示组件
 * 用于展示如何接收和显示对象类型的数据
 */

import { toRefs, watch } from 'vue'
import { NIcon, NTag, NEmpty } from 'naive-ui'
import { CubeOutline } from '@vicons/ionicons5'

interface Props {
  objectData?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  objectData: undefined
})

const { objectData } = toRefs(props)

// 监听 objectData 变化，用于调试
watch(
  objectData,
  newValue => {
    console.log('🔄 [ObjectDataDemo] objectData 数据更新:', newValue)
  },
  { deep: true }
)

const formatValue = (value: any) => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }
  return String(value)
}
</script>

<style scoped>
.object-data-demo {
  width: 100%;
  height: 100%;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.demo-content {
  flex: 1;
  overflow-y: auto;
}

.data-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.key {
  font-weight: 500;
  color: var(--primary-color);
  min-width: 80px;
}

.value {
  color: var(--text-color);
  flex: 1;
  word-break: break-all;
}

.no-data {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
