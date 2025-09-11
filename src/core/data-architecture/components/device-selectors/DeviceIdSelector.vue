<!--
  设备ID选择器组件
  简单模式：只需要选择设备，生成deviceId参数
-->
<script setup lang="ts">
/**
 * DeviceIdSelector - 设备ID选择器（简单模式）
 * 提供最基础的设备选择功能，只生成deviceId参数
 */

import { ref, computed } from 'vue'
import { NSelect, NSpace, NText, NIcon, NButton, NAlert } from 'naive-ui'
import { PhonePortraitOutline as DeviceIcon } from '@vicons/ionicons5'
import type { DeviceInfo } from '@/core/data-architecture/types/device-parameter-group'
import type { SelectOption } from 'naive-ui'

interface Props {
  /** 预选择的设备（编辑模式下使用） */
  preSelectedDevice?: DeviceInfo
  /** 是否为编辑模式 */
  editMode?: boolean
}

interface Emits {
  (e: 'deviceSelected', device: DeviceInfo): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 模拟设备数据（实际项目中应从API获取）
 */
const mockDevices: DeviceInfo[] = [
  {
    deviceId: 'sensor_001',
    deviceName: '温湿度传感器-01',
    deviceType: '环境传感器',
    deviceModel: 'TH-2000'
  },
  {
    deviceId: 'sensor_002',
    deviceName: '温湿度传感器-02',
    deviceType: '环境传感器',
    deviceModel: 'TH-2000'
  },
  {
    deviceId: 'camera_001',
    deviceName: '监控摄像头-A1',
    deviceType: '视频设备',
    deviceModel: 'CAM-4K'
  },
  {
    deviceId: 'switch_001',
    deviceName: '智能开关-客厅',
    deviceType: '控制设备',
    deviceModel: 'SW-100'
  },
  {
    deviceId: 'gateway_001',
    deviceName: '物联网网关-主控',
    deviceType: '网关设备',
    deviceModel: 'GW-5000'
  }
]

// 当前选择的设备ID
const selectedDeviceId = ref<string>(props.preSelectedDevice?.deviceId || '')

// 转换为下拉选项格式
const deviceOptions = computed<SelectOption[]>(() => {
  return mockDevices.map(device => ({
    label: `${device.deviceName} (${device.deviceType})`,
    value: device.deviceId,
    device: device // 携带完整设备信息
  }))
})

// 当前选择的设备信息
const selectedDevice = computed<DeviceInfo | null>(() => {
  if (!selectedDeviceId.value) return null
  return mockDevices.find(device => device.deviceId === selectedDeviceId.value) || null
})

// 是否可以确认选择
const canConfirm = computed(() => {
  return selectedDevice.value !== null
})

/**
 * 处理设备选择
 */
const handleDeviceChange = (deviceId: string) => {
  selectedDeviceId.value = deviceId
}

/**
 * 确认选择
 */
const confirmSelection = () => {
  if (!selectedDevice.value) return
  emit('deviceSelected', selectedDevice.value)
}

/**
 * 取消选择
 */
const cancelSelection = () => {
  emit('cancel')
}
</script>

<template>
  <div class="device-id-selector">
    <!-- 选择器标题 -->
    <div class="selector-header">
      <n-space align="center">
        <n-icon size="20" color="#2080f0">
          <DeviceIcon />
        </n-icon>
        <n-text strong>{{ editMode ? '重新选择设备' : '选择设备' }}</n-text>
      </n-space>
      <n-text depth="3" style="font-size: 12px; margin-top: 4px">
        选择一个设备，将生成
        <strong>deviceId</strong>
        参数
      </n-text>
    </div>

    <!-- 设备选择器 -->
    <div class="device-selector">
      <n-select
        v-model:value="selectedDeviceId"
        :options="deviceOptions"
        placeholder="请选择设备..."
        clearable
        filterable
        @update:value="handleDeviceChange"
      />
    </div>

    <!-- 选择预览 -->
    <div v-if="selectedDevice" class="selection-preview">
      <n-alert type="info" style="margin-top: 12px">
        <template #header>
          <n-space align="center">
            <n-icon size="16"><DeviceIcon /></n-icon>
            <span>已选择设备</span>
          </n-space>
        </template>

        <n-space vertical size="small">
          <n-space>
            <n-text strong>设备名称：</n-text>
            <n-text>{{ selectedDevice.deviceName }}</n-text>
          </n-space>
          <n-space>
            <n-text strong>设备类型：</n-text>
            <n-text>{{ selectedDevice.deviceType }}</n-text>
          </n-space>
          <n-space>
            <n-text strong>设备型号：</n-text>
            <n-text>{{ selectedDevice.deviceModel }}</n-text>
          </n-space>

          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color)">
            <n-text depth="3" style="font-size: 12px">
              💡 将生成参数：
              <strong>deviceId = "{{ selectedDevice.deviceId }}"</strong>
            </n-text>
          </div>
        </n-space>
      </n-alert>
    </div>

    <!-- 操作按钮 -->
    <div class="selector-actions">
      <n-space justify="end">
        <n-button @click="cancelSelection">取消</n-button>
        <n-button type="primary" :disabled="!canConfirm" @click="confirmSelection">
          {{ editMode ? '更新参数' : '生成参数' }}
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.device-id-selector {
  padding: 20px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selector-header {
  margin-bottom: 8px;
}

.device-selector {
  flex: 1;
}

.selection-preview {
  margin: 12px 0;
}

.selector-actions {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
