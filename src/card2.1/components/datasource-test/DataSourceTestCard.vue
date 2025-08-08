<template>
  <div class="datasource-test-card">
    <!-- 标题栏 -->
    <div class="card-header">
      <div class="title-section">
        <n-icon size="20" color="var(--primary-color)">
          <ServerOutline />
        </n-icon>
        <span class="title">{{ title }}</span>
      </div>
      <div class="status-section">
        <n-tag :type="getStatusType()" size="small">
          {{ getStatusText() }}
        </n-tag>
      </div>
    </div>

    <!-- 数据展示区域 -->
    <div class="card-content">
      <!-- 数据统计 -->
      <div class="data-stats">
        <div class="stat-item">
          <span class="stat-label">接收数据</span>
          <span class="stat-value">{{ dataCount }}条</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">数据类型</span>
          <span class="stat-value">{{ dataType }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最后更新</span>
          <span class="stat-value">{{ lastUpdateTime }}</span>
        </div>
      </div>

      <!-- 数据展示 -->
      <div class="data-display-section">
        <div class="section-header">
          <span class="section-title">实时数据</span>
          <n-button size="tiny" circle @click="refreshData">
            <template #icon>
              <n-icon><Refresh /></n-icon>
            </template>
          </n-button>
        </div>

        <div v-if="hasData" class="data-content">
          <!-- 3个key数据展示 -->
          <div class="three-key-data">
            <div class="key-card">
              <div class="key-header">Key 1</div>
              <div class="key-value">{{ formatValue(receivedData.key1) }}</div>
            </div>
            <div class="key-card">
              <div class="key-header">Key 2</div>
              <div class="key-value">{{ formatValue(receivedData.key2) }}</div>
            </div>
            <div class="key-card">
              <div class="key-header">Key 3</div>
              <div class="key-value">{{ formatValue(receivedData.key3) }}</div>
            </div>
          </div>

          <!-- JSON 调试视图 -->
          <div v-if="showDebugInfo" class="json-debug">
            <n-code :code="displayData" language="json" show-line-numbers />
          </div>
        </div>

        <div v-else class="no-data">
          <n-empty description="暂无数据" size="small">
            <template #icon>
              <n-icon><ServerOutline /></n-icon>
            </template>
            <template #extra>
              <div class="status-info">
                <p class="hint-text">数据源配置状态检查：</p>
                <ul class="status-list">
                  <li>✓ 组件已正确挂载和初始化</li>
                  <li>{{ props.data ? '✓ 接收到props.data' : '✗ 未接收到props.data' }}</li>
                  <li>{{ receivedData.value ? '✓ receivedData已处理' : '✗ receivedData为空' }}</li>
                  <li class="help-text">👆 请在右侧数据源面板配置复杂JSON数据和路径映射</li>
                </ul>
              </div>
            </template>
          </n-empty>
        </div>
      </div>

      <!-- 数据详情面板 -->
      <div v-if="showDebugInfo && hasData" class="debug-section">
        <n-card size="small" title="调试信息" class="debug-card">
          <div class="debug-info">
            <p>
              <strong>数据大小:</strong>
              {{ getDataSize() }}
            </p>
            <p>
              <strong>数据类型:</strong>
              {{ typeof receivedData }}
            </p>
            <p>
              <strong>是否数组:</strong>
              {{ Array.isArray(receivedData) ? '是' : '否' }}
            </p>
            <p>
              <strong>接收时间:</strong>
              {{ receiveTime }}
            </p>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Card 2.1 数据源测试组件
 * 正确的架构设计：作为数据消费者，接收来自 Visual Editor 数据源系统的数据
 * 期望接收包含3个key的对象：{ key1, key2, key3 }
 */

import { ref, computed, watch, onMounted } from 'vue'
import { NButton, NTag, NIcon, NEmpty, NCode, useMessage } from 'naive-ui'
import { ServerOutline, Refresh } from '@vicons/ionicons5'

// 接收的数据类型定义 - 期望3个key的对象
interface ReceivedData {
  key1?: any
  key2?: any
  key3?: any
}

// 组件属性接口
interface Props {
  /** 组件标题 */
  title?: string

  /** 从数据源接收的数据 - 期望包含3个key的对象 */
  data?: ReceivedData | null

  /** 是否显示调试信息 */
  showDebugInfo?: boolean

  /** 数据刷新间隔(毫秒) */
  refreshInterval?: number
}

// 组件属性定义
const props = withDefaults(defineProps<Props>(), {
  title: '数据源测试组件',
  data: null,
  showDebugInfo: true,
  refreshInterval: 5000
})

const message = useMessage()

// 响应式状态
const lastUpdateTime = ref<string>('暂无')
const updateCount = ref(0)

// 格式化接收到的数据
const receivedData = computed<ReceivedData>(() => {
  return props.data || { key1: null, key2: null, key3: null }
})

// 计算属性
const hasData = computed(() => {
  const data = receivedData.value
  return data && (data.key1 !== undefined || data.key2 !== undefined || data.key3 !== undefined)
})

const dataCount = computed(() => {
  const data = receivedData.value
  let count = 0
  if (data.key1 !== undefined && data.key1 !== null) count++
  if (data.key2 !== undefined && data.key2 !== null) count++
  if (data.key3 !== undefined && data.key3 !== null) count++
  return count
})

const dataType = computed(() => {
  return hasData.value ? '3-key对象' : '无数据'
})

const displayData = computed(() => {
  return JSON.stringify(receivedData.value, null, 2)
})

/**
 * 格式化值显示
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '暂无数据'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

/**
 * 获取数据类型
 */
function getDataType(value: any): string {
  if (value === null || value === undefined) {
    return 'null'
  }
  return typeof value
}

/**
 * 获取状态类型
 */
function getStatusType(): 'success' | 'warning' | 'default' {
  if (hasData.value) return 'success'
  return 'default'
}

/**
 * 获取状态文本
 */
function getStatusText(): string {
  if (hasData.value) return '已接收'
  return '等待数据'
}

/**
 * 获取数据大小
 */
function getDataSize(): string {
  if (!hasData.value) return '0B'
  const str = JSON.stringify(receivedData.value)
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

/**
 * 智能刷新数据
 * 如果有数据则提示数据状态，否则提示配置
 */
function refreshData() {
  if (hasData.value) {
    // 如果有数据，显示当前数据状态
    message.info(`当前数据状态：已接收${dataCount.value}个key的数据，最后更新${lastUpdateTime.value}`)

    // 触发一次数据重新检查（模拟刷新）
    const currentData = receivedData.value
    if (
      currentData &&
      (currentData.key1 !== undefined || currentData.key2 !== undefined || currentData.key3 !== undefined)
    ) {
      // 发送数据更新通知
      console.log('🔄 [DataSourceTestCard] 手动刷新，当前数据:', currentData)
      message.success('数据刷新完成，当前数据正常')
    }
  } else {
    // 如果没有数据，提示配置
    message.info('请在右侧数据源面板配置复杂JSON数据和路径映射')
  }
}

// 监听数据变化
watch(
  () => props.data,
  (newData, oldData) => {
    console.log('🔍 [DataSourceTestCard] watch触发 - newData:', newData, 'oldData:', oldData)

    if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
      lastUpdateTime.value = new Date().toLocaleString()
      updateCount.value++

      // 显示数据更新提示
      if (updateCount.value > 1) {
        message.success('数据已更新')
      }

      console.log('📥 [DataSourceTestCard] 接收到新数据:', newData)
    }
  },
  { deep: true, immediate: true }
)

// 组件挂载时的初始化
onMounted(() => {
  console.log('🚀 [DataSourceTestCard] 组件已挂载，等待从数据源接收3个key数据')
  console.log('🚀 [DataSourceTestCard] 当前props.data:', props.data)
  console.log('🚀 [DataSourceTestCard] receivedData:', receivedData.value)
  console.log('🚀 [DataSourceTestCard] hasData:', hasData.value)
})
</script>

<style scoped>
.datasource-test-card {
  padding: 16px;
  min-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-stats {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--text-color-2);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
}

.data-display-section {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-weight: 600;
  color: var(--text-color);
}

.data-content {
  padding: 16px;
}

.three-key-data {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.key-card {
  flex: 1;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-color);
  text-align: center;
  transition: all 0.2s ease;
}

.key-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.key-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-2);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.key-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.json-debug {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.structured-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.data-key {
  font-weight: 500;
  color: var(--text-color);
  min-width: 120px;
}

.data-value {
  font-family: 'Courier New', monospace;
  color: var(--primary-color);
  font-weight: 600;
}

.no-data {
  padding: 40px 16px;
  text-align: center;
}

.hint-text {
  color: var(--text-color-2);
  font-size: 14px;
  margin-top: 8px;
}

.status-info {
  text-align: left;
  max-width: 280px;
}

.status-list {
  margin: 8px 0 0 0;
  padding: 0 0 0 16px;
  list-style: none;
  font-size: 12px;
  line-height: 1.6;
}

.status-list li {
  margin: 4px 0;
  color: var(--text-color-2);
}

.help-text {
  color: var(--primary-color);
  font-weight: 500;
  margin-top: 8px !important;
}

.debug-section {
  margin-top: 16px;
}

.debug-info p {
  margin: 8px 0;
  font-size: 14px;
  color: var(--text-color);
}
</style>
