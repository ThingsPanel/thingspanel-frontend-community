<template>
  <div class="dual-data-demo">
    <div class="demo-header">
      <n-icon><LayersOutline /></n-icon>
      <span>双数据源示例</span>
      <div class="status-tags">
        <n-tag size="tiny" :type="objectData ? 'success' : 'default'">对象: {{ objectData ? '✓' : '×' }}</n-tag>
        <n-tag size="tiny" :type="arrayData ? 'success' : 'default'">数组: {{ arrayData?.length || 0 }}</n-tag>
      </div>
    </div>

    <div class="demo-content">
      <!-- 对象数据区域 -->
      <div class="data-section">
        <h4 class="section-title">
          <n-icon><CubeOutline /></n-icon>
          对象数据源
        </h4>
        <div class="object-data">
          <div
            v-if="objectData && typeof objectData === 'object' && Object.keys(objectData).length > 0"
            class="object-display"
          >
            <div v-for="(value, key) in objectData" :key="key" class="object-item">
              <span class="key">{{ key }}:</span>
              <span class="value">{{ formatValue(value) }}</span>
            </div>
          </div>
          <div v-else class="empty-hint">
            <n-text depth="3">暂无对象数据</n-text>
          </div>
        </div>
      </div>

      <!-- 数组数据区域 -->
      <div class="data-section">
        <h4 class="section-title">
          <n-icon><ListOutline /></n-icon>
          数组数据源
        </h4>
        <div class="array-data">
          <div v-if="arrayData && arrayData.length > 0" class="array-display">
            <div v-for="(item, index) in arrayData.slice(0, 3)" :key="index" class="array-item">
              <span class="index">#{{ index + 1 }}</span>
              <div class="item-info">
                <span v-if="typeof item === 'object'">
                  {{
                    Object.keys(item)
                      .map(k => `${k}:${item[k]}`)
                      .join(', ')
                  }}
                </span>
                <span v-else>{{ item }}</span>
              </div>
            </div>
            <div v-if="arrayData.length > 3" class="more-items">
              <n-text depth="3">... 还有 {{ arrayData.length - 3 }} 条数据</n-text>
            </div>
          </div>
          <div v-else class="empty-hint">
            <n-text depth="3">暂无数组数据</n-text>
          </div>
        </div>
      </div>

      <!-- 数据整合信息 -->
      <div class="integration-info">
        <div class="info-item">
          <span class="info-label">对象字段数:</span>
          <span class="info-value">{{ objectData ? Object.keys(objectData).length : 0 }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">数组长度:</span>
          <span class="info-value">{{ arrayData?.length || 0 }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">数据状态:</span>
          <n-tag size="tiny" :type="getDataStatus().type">
            {{ getDataStatus().text }}
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 双数据源演示组件
 * 演示如何同时处理对象和数组两种数据源
 */

import { computed, toRefs } from 'vue'
import { NIcon, NTag, NText } from 'naive-ui'
import { LayersOutline, CubeOutline, ListOutline } from '@vicons/ionicons5'

interface Props {
  objectData?: Record<string, any>
  arrayData?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  objectData: undefined,
  arrayData: undefined
})

const { objectData, arrayData } = toRefs(props)

const formatValue = (value: any) => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }
  return String(value)
}

const getDataStatus = () => {
  const hasObject = !!objectData.value
  const hasArray = !!(arrayData.value && arrayData.value.length > 0)

  if (hasObject && hasArray) {
    return { type: 'success' as const, text: '双源已配置' }
  } else if (hasObject || hasArray) {
    return { type: 'warning' as const, text: '部分配置' }
  } else {
    return { type: 'default' as const, text: '未配置' }
  }
}
</script>

<style scoped>
.dual-data-demo {
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

.status-tags {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.demo-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-section {
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 8px 0;
}

.object-display,
.array-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.object-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.key {
  color: var(--primary-color);
  font-weight: 500;
  min-width: 60px;
}

.value {
  color: var(--text-color);
  word-break: break-all;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px;
  background: var(--card-color);
  border-radius: 2px;
}

.index {
  color: var(--text-color-3);
  font-weight: 600;
  min-width: 25px;
}

.item-info {
  color: var(--text-color);
  flex: 1;
}

.more-items {
  padding: 4px;
  text-align: center;
  font-size: 11px;
}

.empty-hint {
  padding: 8px;
  text-align: center;
  font-size: 12px;
}

.integration-info {
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.info-label {
  color: var(--text-color-2);
}

.info-value {
  color: var(--text-color);
  font-weight: 500;
}
</style>
