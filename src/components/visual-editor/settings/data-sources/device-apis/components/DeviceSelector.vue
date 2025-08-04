<template>
  <div class="device-selector">
    <n-form-item label="设备选择" required>
      <n-select
        v-model:value="selectedDeviceId"
        :options="deviceOptions"
        placeholder="请选择设备"
        :loading="isLoading"
        label-field="name"
        value-field="id"
        filterable
        clearable
        @update:value="onDeviceChange"
        @update:show="onDropdownShow"
      >
        <template #option="{ option }">
          <div class="device-option">
            <div class="device-name">{{ option.name }}</div>
            <div class="device-info">
              <span class="device-id">ID: {{ option.id }}</span>
              <span class="device-status" :class="getStatusClass(option.status)">
                {{ getStatusText(option.status) }}
              </span>
            </div>
          </div>
        </template>
      </n-select>
    </n-form-item>

    <!-- 错误信息显示 -->
    <template v-if="errorMessage">
      <n-alert type="error" :title="errorMessage" />
    </template>

    <!-- 设备信息预览 -->
    <template v-if="selectedDevice">
      <n-card size="small" class="device-preview">
        <template #header>
          <span>设备信息</span>
        </template>
        <div class="device-details">
          <div class="detail-item">
            <span class="label">设备名称：</span>
            <span class="value">{{ selectedDevice.name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">设备ID：</span>
            <span class="value">{{ selectedDevice.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">设备类型：</span>
            <span class="value">{{ selectedDevice.type || '未知' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">连接状态：</span>
            <span class="value" :class="getStatusClass(selectedDevice.status)">
              {{ getStatusText(selectedDevice.status) }}
            </span>
          </div>
        </div>
      </n-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NFormItem, NSelect, NAlert, NCard } from 'naive-ui'
import { deviceListForPanel } from '@/service/api'
import type { DeviceInfo } from '../types/api-types'

interface Props {
  modelValue?: string
}

interface Emits {
  'update:modelValue': [value: string]
  'device-change': [device: DeviceInfo | null]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const deviceOptions = ref<any[]>([])
const selectedDeviceId = ref<string>(props.modelValue || '')
const isLoading = ref(false)
const errorMessage = ref('')
const devicesLoaded = ref(false)

// 计算属性
const selectedDevice = computed(() => {
  if (!selectedDeviceId.value) return null
  return deviceOptions.value.find(device => device.id === selectedDeviceId.value)
})

// 获取设备列表
const getDeviceList = async () => {
  if (devicesLoaded.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await deviceListForPanel({})
    deviceOptions.value = res.data || []
    devicesLoaded.value = true
    console.log('设备列表加载成功:', deviceOptions.value.length, '个设备')
  } catch (error) {
    console.error('设备列表加载失败:', error)
    errorMessage.value = '设备列表加载失败，请重试'
    deviceOptions.value = []
  } finally {
    isLoading.value = false
  }
}

// 设备状态处理
const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'online':
    case 'connected':
      return 'status-online'
    case 'offline':
    case 'disconnected':
      return 'status-offline'
    case 'error':
    case 'fault':
      return 'status-error'
    default:
      return 'status-unknown'
  }
}

const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'online':
    case 'connected':
      return '在线'
    case 'offline':
    case 'disconnected':
      return '离线'
    case 'error':
    case 'fault':
      return '故障'
    default:
      return '未知'
  }
}

// 事件处理
const onDeviceChange = (deviceId: string) => {
  selectedDeviceId.value = deviceId
  emit('update:modelValue', deviceId)

  const device = deviceId ? selectedDevice.value : null
  emit('device-change', device)

  console.log('设备选择变更:', deviceId, device)
}

const onDropdownShow = (show: boolean) => {
  if (show && !devicesLoaded.value) {
    getDeviceList()
  }
}

// 组件挂载时初始化
onMounted(() => {
  if (selectedDeviceId.value) {
    getDeviceList()
  }
})
</script>

<style scoped>
.device-selector {
  width: 100%;
}

.device-option {
  padding: 4px 0;
}

.device-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.device-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.device-id {
  color: #999;
}

.device-status {
  font-weight: 500;
}

.status-online {
  color: #18a058;
}

.status-offline {
  color: #d03050;
}

.status-error {
  color: #f0a020;
}

.status-unknown {
  color: #666;
}

.device-preview {
  margin-top: 12px;
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.detail-item .value {
  color: #333;
}
</style>
