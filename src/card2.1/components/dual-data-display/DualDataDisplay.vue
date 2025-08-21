<script setup lang="ts">
/**
 * 双数据源显示组件
 * 纯数据展示组件，通过props接收数据，不再内部执行数据获取
 */

import { ref, computed, watch } from 'vue'

// 组件props - 简化为纯数据接收
interface Props {
  componentId?: string
  dataSource1?: any // 第一个数据源的数据
  dataSource2?: any // 第二个数据源的数据
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  dataSource1: null,
  dataSource2: null
})

// 🔥 响应式数据状态 - 简化为纯展示逻辑
const lastUpdateTime = ref<Date | null>(null)
const executionCount = ref(0)

// 显示用的格式化数据
const formatData = (data: any): string => {
  if (!data) return 'null'
  if (typeof data === 'string') return data
  return JSON.stringify(data, null, 2)
}

// 🔥 监听props数据变化 - 纯数据展示逻辑
watch(
  [() => props.dataSource1, () => props.dataSource2],
  ([newDataSource1, newDataSource2]) => {
    console.log('👁️ [DualDataDisplay] 接收到数据更新:', {
      dataSource1: newDataSource1,
      dataSource2: newDataSource2
    })

    // 更新时间戳和计数
    if (newDataSource1 !== null || newDataSource2 !== null) {
      lastUpdateTime.value = new Date()
      executionCount.value++
      console.log('✅ [DualDataDisplay] 数据已更新，时间:', lastUpdateTime.value)
    }
  },
  { deep: true }
)

// 🔥 计算属性：显示状态
const displayStatus = computed(() => {
  const hasData1 = props.dataSource1 !== null && props.dataSource1 !== undefined
  const hasData2 = props.dataSource2 !== null && props.dataSource2 !== undefined

  if (hasData1 && hasData2) {
    return '双数据源已加载'
  } else if (hasData1 || hasData2) {
    return '部分数据源已加载'
  } else {
    return '等待数据源...'
  }
})
</script>

<template>
  <div class="dual-data-display">
    <div class="header">
      <h3>双数据源显示测试组件</h3>
      <div class="status">
        <span class="status-text">{{ displayStatus }}</span>
        <span class="execution-count">执行次数: {{ executionCount }}</span>
        <span v-if="lastUpdateTime" class="last-update">最后更新: {{ lastUpdateTime.toLocaleTimeString() }}</span>
      </div>
    </div>

    <div class="data-sections">
      <!-- 数据源1 -->
      <div class="data-section">
        <h4>数据源1</h4>
        <div class="data-content">
          <pre v-if="props.dataSource1">{{ formatData(props.dataSource1) }}</pre>
          <div v-else class="no-data">等待数据...</div>
        </div>
      </div>

      <!-- 数据源2 -->
      <div class="data-section">
        <h4>数据源2</h4>
        <div class="data-content">
          <pre v-if="props.dataSource2">{{ formatData(props.dataSource2) }}</pre>
          <div v-else class="no-data">等待数据...</div>
        </div>
      </div>
    </div>

    <!-- 组件信息 -->
    <div class="component-info">
      <small>组件ID: {{ props.componentId || '未设置' }}</small>
    </div>
  </div>
</template>

<style scoped>
.dual-data-display {
  padding: 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-family: monospace;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.header h3 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 14px;
  font-weight: bold;
}

.status {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-color-2);
}

.status .status-text {
  color: var(--primary-color);
  font-weight: 500;
}

.data-sections {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.data-section {
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.data-section h4 {
  margin: 0;
  padding: 8px 12px;
  background: var(--primary-color);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.data-content {
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.data-content pre {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
}

.no-data {
  color: var(--text-color-3);
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-size: 12px;
}

.component-info {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  color: var(--text-color-3);
  font-size: 10px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
