<!--
  设备指标选择器组件
  中等复杂模式：选择设备和指标，生成deviceId + metric参数
-->
<script setup lang="ts">
/**
 * DeviceMetricSelector - 设备指标选择器（中等复杂）
 * 需要选择设备和指标，生成deviceId + metric两个参数
 */

import { ref, computed, watch } from 'vue'
import { NSelect, NSpace, NText, NIcon, NButton, NAlert, NDivider } from 'naive-ui'
import { PhonePortraitOutline as DeviceIcon, BarChartOutline as MetricIcon } from '@vicons/ionicons5'
import type { DeviceInfo, DeviceMetric } from '../../types/device-parameter-group'
import type { SelectOption } from 'naive-ui'

interface Props {
  /** 预选择的设备（编辑模式下使用） */
  preSelectedDevice?: DeviceInfo
  /** 预选择的指标（编辑模式下使用） */
  preSelectedMetric?: DeviceMetric
  /** 是否为编辑模式 */
  editMode?: boolean
}

interface Emits {
  (e: 'selectionCompleted', data: { device: DeviceInfo; metric: DeviceMetric }): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 模拟设备数据
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
    deviceId: 'power_001',
    deviceName: '电能表-A区',
    deviceType: '电力设备',
    deviceModel: 'PM-300'
  }
]

/**
 * 模拟设备指标数据（根据设备类型提供不同指标）
 */
const getMetricsByDeviceType = (deviceType: string): DeviceMetric[] => {
  const metricMap: Record<string, DeviceMetric[]> = {
    环境传感器: [
      {
        metricKey: 'temperature',
        metricLabel: '温度',
        metricType: 'number',
        unit: '°C',
        description: '环境温度值'
      },
      {
        metricKey: 'humidity',
        metricLabel: '湿度',
        metricType: 'number',
        unit: '%RH',
        description: '环境湿度值'
      },
      {
        metricKey: 'pressure',
        metricLabel: '大气压力',
        metricType: 'number',
        unit: 'hPa',
        description: '大气压力值'
      }
    ],
    电力设备: [
      {
        metricKey: 'voltage',
        metricLabel: '电压',
        metricType: 'number',
        unit: 'V',
        description: '电压值'
      },
      {
        metricKey: 'current',
        metricLabel: '电流',
        metricType: 'number',
        unit: 'A',
        description: '电流值'
      },
      {
        metricKey: 'power',
        metricLabel: '功率',
        metricType: 'number',
        unit: 'W',
        description: '功率值'
      },
      {
        metricKey: 'energy',
        metricLabel: '电能',
        metricType: 'number',
        unit: 'kWh',
        description: '累计电能值'
      }
    ]
  }

  return metricMap[deviceType] || []
}

// 当前选择状态
const selectedDeviceId = ref<string>(props.preSelectedDevice?.deviceId || '')
const selectedMetricKey = ref<string>(props.preSelectedMetric?.metricKey || '')

// 设备选项
const deviceOptions = computed<SelectOption[]>(() => {
  return mockDevices.map(device => ({
    label: `${device.deviceName} (${device.deviceType})`,
    value: device.deviceId,
    device: device
  }))
})

// 当前选择的设备
const selectedDevice = computed<DeviceInfo | null>(() => {
  if (!selectedDeviceId.value) return null
  return mockDevices.find(device => device.deviceId === selectedDeviceId.value) || null
})

// 可用的指标选项（根据选择的设备动态变化）
const availableMetrics = computed<DeviceMetric[]>(() => {
  if (!selectedDevice.value) return []
  return getMetricsByDeviceType(selectedDevice.value.deviceType)
})

// 指标选项
const metricOptions = computed<SelectOption[]>(() => {
  return availableMetrics.value.map(metric => ({
    label: `${metric.metricLabel}${metric.unit ? ` (${metric.unit})` : ''}`,
    value: metric.metricKey,
    metric: metric
  }))
})

// 当前选择的指标
const selectedMetric = computed<DeviceMetric | null>(() => {
  if (!selectedMetricKey.value) return null
  return availableMetrics.value.find(metric => metric.metricKey === selectedMetricKey.value) || null
})

// 是否可以确认选择
const canConfirm = computed(() => {
  return selectedDevice.value !== null && selectedMetric.value !== null
})

/**
 * 监听设备变化，重置指标选择
 */
watch(selectedDeviceId, (newDeviceId, oldDeviceId) => {
  if (newDeviceId !== oldDeviceId && !props.editMode) {
    selectedMetricKey.value = ''
  }
})

/**
 * 处理设备选择
 */
const handleDeviceChange = (deviceId: string) => {
  selectedDeviceId.value = deviceId
  console.log('📱 [DeviceMetricSelector] 选择设备:', selectedDevice.value)
}

/**
 * 处理指标选择
 */
const handleMetricChange = (metricKey: string) => {
  selectedMetricKey.value = metricKey
  console.log('📊 [DeviceMetricSelector] 选择指标:', selectedMetric.value)
}

/**
 * 确认选择
 */
const confirmSelection = () => {
  if (!selectedDevice.value || !selectedMetric.value) return

  console.log('✅ [DeviceMetricSelector] 确认选择:', {
    device: selectedDevice.value,
    metric: selectedMetric.value
  })

  emit('selectionCompleted', {
    device: selectedDevice.value,
    metric: selectedMetric.value
  })
}

/**
 * 取消选择
 */
const cancelSelection = () => {
  emit('cancel')
}
</script>

<template>
  <div class="device-metric-selector">
    <!-- 选择器标题 -->
    <div class="selector-header">
      <n-space align="center">
        <n-icon size="20" color="#2080f0">
          <MetricIcon />
        </n-icon>
        <n-text strong>{{ editMode ? '重新选择设备指标' : '选择设备指标' }}</n-text>
      </n-space>
      <n-text depth="3" style="font-size: 12px; margin-top: 4px">
        选择设备和指标，将生成
        <strong>deviceId</strong>
        +
        <strong>metric</strong>
        两个参数
      </n-text>
    </div>

    <!-- 设备选择 -->
    <div class="selection-step">
      <n-space align="center" style="margin-bottom: 8px">
        <n-icon size="16"><DeviceIcon /></n-icon>
        <n-text strong>第1步：选择设备</n-text>
      </n-space>

      <n-select
        v-model:value="selectedDeviceId"
        :options="deviceOptions"
        placeholder="请选择设备..."
        clearable
        filterable
        @update:value="handleDeviceChange"
      />
    </div>

    <n-divider style="margin: 12px 0" />

    <!-- 指标选择 -->
    <div class="selection-step">
      <n-space align="center" style="margin-bottom: 8px">
        <n-icon size="16"><MetricIcon /></n-icon>
        <n-text strong>第2步：选择指标</n-text>
        <n-text v-if="!selectedDevice" depth="3" style="font-size: 12px">（请先选择设备）</n-text>
      </n-space>

      <n-select
        v-model:value="selectedMetricKey"
        :options="metricOptions"
        placeholder="请选择指标..."
        :disabled="!selectedDevice"
        clearable
        @update:value="handleMetricChange"
      />
    </div>

    <!-- 选择预览 -->
    <div v-if="selectedDevice || selectedMetric" class="selection-preview">
      <n-alert type="info" style="margin-top: 16px">
        <template #header>
          <span>选择预览</span>
        </template>

        <n-space vertical size="small">
          <!-- 设备信息 -->
          <div v-if="selectedDevice">
            <n-space align="center" style="margin-bottom: 8px">
              <n-icon size="16"><DeviceIcon /></n-icon>
              <n-text strong>选择的设备：</n-text>
            </n-space>
            <div style="padding-left: 20px">
              <n-space vertical size="small">
                <n-space>
                  <n-text depth="3">设备名称：</n-text>
                  <n-text>{{ selectedDevice.deviceName }}</n-text>
                </n-space>
                <n-space>
                  <n-text depth="3">设备类型：</n-text>
                  <n-text>{{ selectedDevice.deviceType }}</n-text>
                </n-space>
              </n-space>
            </div>
          </div>

          <!-- 指标信息 -->
          <div v-if="selectedMetric">
            <n-space align="center" style="margin-bottom: 8px">
              <n-icon size="16"><MetricIcon /></n-icon>
              <n-text strong>选择的指标：</n-text>
            </n-space>
            <div style="padding-left: 20px">
              <n-space vertical size="small">
                <n-space>
                  <n-text depth="3">指标名称：</n-text>
                  <n-text>{{ selectedMetric.metricLabel }}</n-text>
                </n-space>
                <n-space>
                  <n-text depth="3">数据类型：</n-text>
                  <n-text>{{ selectedMetric.metricType }}</n-text>
                </n-space>
                <n-space v-if="selectedMetric.unit">
                  <n-text depth="3">单位：</n-text>
                  <n-text>{{ selectedMetric.unit }}</n-text>
                </n-space>
              </n-space>
            </div>
          </div>

          <!-- 生成参数预览 -->
          <div v-if="canConfirm" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color)">
            <n-text depth="3" style="font-size: 12px">💡 将生成参数：</n-text>
            <div
              style="
                margin-top: 8px;
                padding: 8px;
                background: var(--code-color);
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
              "
            >
              <div>
                <strong>deviceId</strong>
                = "{{ selectedDevice!.deviceId }}"
              </div>
              <div>
                <strong>metric</strong>
                = "{{ selectedMetric!.metricKey }}"
              </div>
            </div>
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
.device-metric-selector {
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selector-header {
  margin-bottom: 8px;
}

.selection-step {
  margin-bottom: 12px;
}

.selection-preview {
  margin: 16px 0;
}

.selector-actions {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
