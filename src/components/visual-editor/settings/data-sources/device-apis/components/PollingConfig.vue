<template>
  <div class="polling-config">
    <n-card size="small" title="轮询配置">
      <!-- 轮询开关 -->
      <n-form-item label="启用轮询">
        <n-switch v-model:value="pollingEnabled" @update:value="onPollingToggle" />
        <template #feedback>
          <span class="form-tip">启用后会自动定时获取数据</span>
        </template>
      </n-form-item>

      <!-- 轮询间隔设置 -->
      <template v-if="pollingEnabled">
        <n-form-item label="轮询间隔">
          <n-select
            v-model:value="pollingInterval"
            :options="intervalOptions"
            placeholder="选择轮询间隔"
            @update:value="onIntervalChange"
          />
        </n-form-item>

        <!-- 自定义间隔 -->
        <n-form-item label="自定义间隔（秒）">
          <n-input-number
            v-model:value="customInterval"
            :min="1"
            :max="3600"
            placeholder="输入自定义间隔"
            :disabled="pollingInterval !== 'custom'"
            @update:value="onCustomIntervalChange"
          />
          <template #feedback>
            <span class="form-tip">1-3600秒之间</span>
          </template>
        </n-form-item>
      </template>

      <!-- 轮询状态显示 -->
      <template v-if="pollingEnabled">
        <n-divider />
        <div class="polling-status">
          <div class="status-item">
            <span class="status-label">轮询状态：</span>
            <n-tag :type="getStatusType(pollingStatus)" size="small">
              {{ getStatusText(pollingStatus) }}
            </n-tag>
          </div>

          <div v-if="lastUpdate" class="status-item">
            <span class="status-label">最后更新：</span>
            <span class="status-value">{{ formatTime(lastUpdate) }}</span>
          </div>

          <div v-if="errorMessage" class="status-item">
            <span class="status-label">错误信息：</span>
            <span class="status-error">{{ errorMessage }}</span>
          </div>

          <div class="status-item">
            <span class="status-label">请求次数：</span>
            <span class="status-value">{{ requestCount }}</span>
          </div>
        </div>

        <!-- 手动控制按钮 -->
        <div class="polling-controls">
          <n-space>
            <n-button
              size="small"
              :type="isRunning ? 'warning' : 'primary'"
              :disabled="!canControl"
              @click="togglePolling"
            >
              {{ isRunning ? '停止轮询' : '开始轮询' }}
            </n-button>
            <n-button size="small" :disabled="!canControl || !isRunning" @click="forceUpdate">立即更新</n-button>
            <n-button size="small" :disabled="!canControl" @click="resetStats">重置统计</n-button>
          </n-space>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NCard, NFormItem, NSwitch, NSelect, NInputNumber, NDivider, NTag, NButton, NSpace } from 'naive-ui'
import type { PollingConfig } from '../types/api-types'

interface Props {
  modelValue: PollingConfig
  canControl?: boolean
}

interface Emits {
  'update:modelValue': [value: PollingConfig]
  'polling-toggle': [enabled: boolean]
  'force-update': []
}

const props = withDefaults(defineProps<Props>(), {
  canControl: true
})

const emit = defineEmits<Emits>()

// 响应式数据
const pollingEnabled = ref(props.modelValue.enabled)
const pollingInterval = ref<string>('5s')
const customInterval = ref<number>(5)
const pollingStatus = ref<'stopped' | 'running' | 'error'>('stopped')
const lastUpdate = ref<string>('')
const errorMessage = ref('')
const requestCount = ref(0)
const isRunning = ref(false)

// 轮询间隔选项
const intervalOptions = [
  { label: '1秒', value: '1s' },
  { label: '5秒', value: '5s' },
  { label: '10秒', value: '10s' },
  { label: '30秒', value: '30s' },
  { label: '1分钟', value: '1m' },
  { label: '5分钟', value: '5m' },
  { label: '10分钟', value: '10m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '自定义', value: 'custom' }
]

// 计算属性
const currentInterval = computed(() => {
  if (pollingInterval.value === 'custom') {
    return customInterval.value * 1000
  }

  const intervalMap: Record<string, number> = {
    '1s': 1000,
    '5s': 5000,
    '10s': 10000,
    '30s': 30000,
    '1m': 60000,
    '5m': 300000,
    '10m': 600000,
    '30m': 1800000,
    '1h': 3600000
  }

  return intervalMap[pollingInterval.value] || 5000
})

// 监听外部配置变化
watch(
  () => props.modelValue,
  newConfig => {
    pollingEnabled.value = newConfig.enabled
    pollingStatus.value = newConfig.status
    lastUpdate.value = newConfig.lastUpdate || ''
    errorMessage.value = newConfig.errorMessage || ''
  },
  { deep: true }
)

// 事件处理
const onPollingToggle = (enabled: boolean) => {
  pollingEnabled.value = enabled
  updateConfig()
  emit('polling-toggle', enabled)
}

const onIntervalChange = (interval: string) => {
  pollingInterval.value = interval
  updateConfig()
}

const onCustomIntervalChange = (interval: number) => {
  if (interval) {
    customInterval.value = interval
    updateConfig()
  }
}

const togglePolling = () => {
  isRunning.value = !isRunning.value
  pollingStatus.value = isRunning.value ? 'running' : 'stopped'
  updateConfig()
}

const forceUpdate = () => {
  emit('force-update')
  requestCount.value++
  lastUpdate.value = new Date().toISOString()
  updateConfig()
}

const resetStats = () => {
  requestCount.value = 0
  lastUpdate.value = ''
  errorMessage.value = ''
  updateConfig()
}

// 更新配置
const updateConfig = () => {
  const config: PollingConfig = {
    enabled: pollingEnabled.value,
    interval: currentInterval.value,
    status: pollingStatus.value,
    lastUpdate: lastUpdate.value,
    errorMessage: errorMessage.value
  }

  emit('update:modelValue', config)
}

// 工具函数
const getStatusType = (status: string) => {
  switch (status) {
    case 'running':
      return 'success'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'running':
      return '运行中'
    case 'error':
      return '错误'
    default:
      return '已停止'
  }
}

const formatTime = (timeString: string) => {
  if (!timeString) return ''

  try {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN')
  } catch {
    return timeString
  }
}

// 设置状态
const setStatus = (status: 'stopped' | 'running' | 'error') => {
  pollingStatus.value = status
  isRunning.value = status === 'running'
  updateConfig()
}

const setLastUpdate = (time: string) => {
  lastUpdate.value = time
  updateConfig()
}

const setErrorMessage = (message: string) => {
  errorMessage.value = message
  updateConfig()
}

const incrementRequestCount = () => {
  requestCount.value++
  updateConfig()
}

// 暴露方法
defineExpose({
  setStatus,
  setLastUpdate,
  setErrorMessage,
  incrementRequestCount,
  currentInterval: computed(() => currentInterval.value)
})
</script>

<style scoped>
.polling-config {
  width: 100%;
}

.form-tip {
  font-size: 12px;
  color: #666;
}

.polling-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.status-value {
  color: #333;
}

.status-error {
  color: #d03050;
  font-size: 12px;
}

.polling-controls {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
