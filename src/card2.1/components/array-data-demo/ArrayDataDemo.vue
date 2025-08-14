<template>
  <div class="array-data-demo">
    <div class="demo-header">
      <n-icon><ListOutline /></n-icon>
      <span>数组数据源示例</span>
      <n-tag size="small" :type="arrayData ? 'success' : 'default'">
        {{ arrayData ? `${arrayData.length} 条数据` : '未配置' }}
      </n-tag>
    </div>

    <div class="demo-content">
      <div v-if="arrayData && arrayData.length > 0" class="data-list">
        <div v-for="(item, index) in arrayData" :key="index" class="list-item">
          <div class="item-index">#{{ index + 1 }}</div>
          <div class="item-content">
            <div v-if="typeof item === 'object'">
              <div v-for="(value, key) in item" :key="key" class="item-field">
                <span class="field-name">{{ key }}:</span>
                <span class="field-value">{{ formatValue(value) }}</span>
              </div>
            </div>
            <div v-else class="simple-value">
              {{ formatValue(item) }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        <n-empty description="暂无数据" size="small">
          <template #extra>
            <n-text depth="3" style="font-size: 11px">💡 在右侧"数据源"配置中添加数组数据</n-text>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数组数据源演示组件
 * 用于展示如何接收和显示数组类型的数据
 */

import { toRefs } from 'vue'
import { NIcon, NTag, NEmpty } from 'naive-ui'
import { ListOutline } from '@vicons/ionicons5'

interface Props {
  arrayData?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  arrayData: undefined
})

const { arrayData } = toRefs(props)

const formatValue = (value: any) => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }
  return String(value)
}
</script>

<style scoped>
.array-data-demo {
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

.data-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.item-index {
  font-size: 12px;
  color: var(--text-color-3);
  font-weight: 600;
  min-width: 30px;
}

.item-content {
  flex: 1;
}

.item-field {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.item-field:last-child {
  margin-bottom: 0;
}

.field-name {
  font-size: 12px;
  color: var(--primary-color);
  font-weight: 500;
  min-width: 60px;
}

.field-value {
  font-size: 12px;
  color: var(--text-color);
  word-break: break-all;
}

.simple-value {
  font-size: 14px;
  color: var(--text-color);
}

.no-data {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
