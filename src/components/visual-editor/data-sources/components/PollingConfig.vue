<template>
  <div class="polling-config">
    <n-form-item label="数据获取方式">
      <n-select
        v-model:value="config.mode"
        :options="pollingModeOptions"
        placeholder="选择数据获取方式"
        @update:value="onModeChange"
      />
    </n-form-item>

    <!-- 定时器轮询配置 -->
    <template v-if="config.mode === 'timer'">
      <n-form-item label="轮询间隔">
        <n-input-number
          v-model:value="config.interval"
          :min="1000"
          :max="3600000"
          :step="1000"
          placeholder="轮询间隔(毫秒)"
          @update:value="onIntervalChange"
        >
          <template #suffix>毫秒</template>
        </n-input-number>
        <template #feedback>
          <div class="interval-tip">当前设置: 每 {{ Math.round(config.interval / 1000) }} 秒获取一次数据</div>
        </template>
      </n-form-item>
    </template>

    <!-- WebSocket 配置 -->
    <template v-if="config.mode === 'websocket'">
      <n-alert type="info" size="small" style="margin-bottom: 12px">
        <template #default>
          <p>
            <strong>WebSocket 模式</strong>
            ：系统将自动建立 WebSocket 连接获取实时数据
          </p>
          <p>无需手动配置 URL，系统会自动连接到设备数据服务</p>
        </template>
      </n-alert>

      <n-form-item label="连接状态">
        <n-space align="center">
          <n-tag :type="websocketStatus.type" size="small">
            {{ websocketStatus.text }}
          </n-tag>
          <n-button
            size="small"
            :type="websocketStatus.type === 'success' ? 'error' : 'primary'"
            @click="toggleWebSocketConnection"
          >
            {{ websocketStatus.type === 'success' ? '断开连接' : '建立连接' }}
          </n-button>
        </n-space>
      </n-form-item>
    </template>

    <!-- 手动模式 -->
    <template v-if="config.mode === 'manual'">
      <n-alert type="warning" size="small">
        <template #default>
          <p>
            <strong>手动模式</strong>
            ：需要手动触发数据获取
          </p>
          <p>适用于一次性数据获取或特殊场景</p>
        </template>
      </n-alert>
    </template>

    <!-- 状态显示 -->
    <n-form-item label="获取状态">
      <n-tag :type="statusTagType" size="small">
        {{ statusText }}
      </n-tag>
    </n-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NFormItem, NSelect, NInputNumber, NTag, NAlert, NSpace, NButton } from 'naive-ui'
import type { PollingConfig } from '../../../types/data-source'

interface Props {
  modelValue?: PollingConfig
}

interface Emits {
  'update:modelValue': [value: PollingConfig]
  'polling-change': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 轮询模式选项
const pollingModeOptions = [
  { label: 'WebSocket (推荐)', value: 'websocket' },
  { label: '定时器', value: 'timer' },
  { label: '手动', value: 'manual' }
]

const config = ref<PollingConfig>({
  enabled: true,
  mode: 'websocket', // 默认使用 WebSocket
  interval: 5000,
  status: 'stopped',
  ...props.modelValue
})

// WebSocket 状态
const websocketStatus = ref<{ type: 'info' | 'success' | 'error'; text: string }>({
  type: 'info',
  text: '未连接'
})

// 状态标签类型
const statusTagType = computed(() => {
  switch (config.value.status) {
    case 'running':
      return 'success'
    case 'paused':
      return 'warning'
    case 'stopped':
      return 'default'
    default:
      return 'default'
  }
})

// 状态文本
const statusText = computed(() => {
  switch (config.value.status) {
    case 'running':
      return '运行中'
    case 'paused':
      return '已暂停'
    case 'stopped':
      return '已停止'
    default:
      return '未知状态'
  }
})

// 模式切换
const onModeChange = (mode: string) => {
  console.log('🔧 PollingConfig - 数据获取模式切换:', mode)
  config.value.mode = mode
  config.value.enabled = mode !== 'manual'

  // 根据模式设置状态
  if (mode === 'websocket') {
    config.value.status = 'running'
  } else if (mode === 'timer') {
    config.value.status = 'running'
  } else {
    config.value.status = 'stopped'
  }

  emitChange()
}

// 轮询间隔变化
const onIntervalChange = (interval: number | null) => {
  if (interval && interval >= 1000) {
    console.log('🔧 PollingConfig - 轮询间隔变化:', interval)
    config.value.interval = interval
    emitChange()
  }
}

// WebSocket 连接管理
const toggleWebSocketConnection = () => {
  if (websocketStatus.value.type === 'info') {
    connectWebSocket()
  } else {
    disconnectWebSocket()
  }
}

const connectWebSocket = () => {
  websocketStatus.value.text = '连接中...'
  websocketStatus.value.type = 'info'

  // 模拟连接过程
  setTimeout(() => {
    websocketStatus.value.text = '已连接'
    websocketStatus.value.type = 'success'
    config.value.status = 'running'
    emitChange()
  }, 1000)
}

const disconnectWebSocket = () => {
  websocketStatus.value.text = '已断开'
  websocketStatus.value.type = 'info'
  config.value.status = 'stopped'
  emitChange()
}

// 发出变化事件
const emitChange = () => {
  emit('update:modelValue', { ...config.value })
  emit('polling-change')
}

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      config.value = {
        ...config.value,
        ...newValue
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.polling-config {
  background: #f8f9ff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #d0d7ff;
}

.polling-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.polling-label {
  font-size: 14px;
  color: #333;
}

.interval-tip {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>
