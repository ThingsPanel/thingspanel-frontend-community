<!--
  统一设备配置选择器
  用一个表单管理所有设备相关参数的选择，避免重复参数问题
-->
<script setup lang="ts">
/**
 * UnifiedDeviceConfigSelector - 统一设备配置选择器
 *
 * 设计原则：
 * - 每种参数类型只能存在一个实例（deviceId、metric等）
 * - 增量式配置：用户可以逐步添加参数，不会产生冲突
 * - 修改模式：再次选择就是修改现有配置
 * - 扩展性：未来可以轻松添加新的设备参数类型
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NCard, NSpace, NText, NIcon, NButton, NSelect, NCheckbox, NAlert, NDivider, NTag } from 'naive-ui'
import {
  PhonePortraitOutline as DeviceIcon,
  BarChartOutline as MetricIcon,
  LocationOutline as LocationIcon,
  WifiOutline as StatusIcon
} from '@vicons/ionicons5'
import type { DeviceInfo, DeviceMetric } from '@/core/data-architecture/types/device-parameter-group'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import type { SelectOption } from 'naive-ui'

interface Props {
  /** 当前已有的参数列表（用于检测现有配置） */
  existingParameters?: EnhancedParameter[]
  /** 是否为编辑模式 */
  editMode?: boolean
}

interface Emits {
  (e: 'parametersGenerated', parameters: EnhancedParameter[]): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 设备配置状态
 */
interface DeviceConfig {
  // 基础设备信息
  selectedDevice: DeviceInfo | null

  // 参数选择状态
  includeDeviceId: boolean // 是否包含设备ID参数
  includeMetric: boolean // 是否包含指标参数
  selectedMetric: DeviceMetric | null

  // 未来扩展的参数类型
  includeLocation: boolean // 设备位置
  includeStatus: boolean // 设备状态
}

// 配置状态
const config = ref<DeviceConfig>({
  selectedDevice: null,
  includeDeviceId: false,
  includeMetric: false,
  selectedMetric: null,
  includeLocation: false,
  includeStatus: false
})

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
 * 根据设备类型获取可用指标
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
        metricKey: 'power',
        metricLabel: '功率',
        metricType: 'number',
        unit: 'W',
        description: '功率值'
      }
    ]
  }

  return metricMap[deviceType] || []
}

// 设备选项
const deviceOptions = computed<SelectOption[]>(() => {
  return mockDevices.map(device => ({
    label: `${device.deviceName} (${device.deviceType})`,
    value: device.deviceId,
    device: device
  }))
})

// 可用指标选项
const availableMetrics = computed<DeviceMetric[]>(() => {
  if (!config.value.selectedDevice) return []
  return getMetricsByDeviceType(config.value.selectedDevice.deviceType)
})

const metricOptions = computed<SelectOption[]>(() => {
  return availableMetrics.value.map(metric => ({
    label: `${metric.metricLabel}${metric.unit ? ` (${metric.unit})` : ''}`,
    value: metric.metricKey,
    metric: metric
  }))
})

// 预览生成的参数
const previewParameters = computed(() => {
  const parameters: Array<{ key: string; value: string; type: string }> = []

  if (config.value.includeDeviceId && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceId',
      value: config.value.selectedDevice.deviceId,
      type: '设备ID'
    })
  }

  if (config.value.includeMetric && config.value.selectedMetric) {
    parameters.push({
      key: 'metric',
      value: config.value.selectedMetric.metricKey,
      type: '指标键'
    })
  }

  if (config.value.includeLocation && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceLocation',
      value: `location_${config.value.selectedDevice.deviceId}`,
      type: '设备位置'
    })
  }

  if (config.value.includeStatus && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceStatus',
      value: `status_${config.value.selectedDevice.deviceId}`,
      type: '设备状态'
    })
  }

  return parameters
})

// 是否可以生成参数
const canGenerate = computed(() => {
  // 必须选择了设备，且至少选择了一种参数类型
  return (
    config.value.selectedDevice !== null &&
    (config.value.includeDeviceId ||
      (config.value.includeMetric && config.value.selectedMetric) ||
      config.value.includeLocation ||
      config.value.includeStatus)
  )
})

/**
 * 监听设备变化，重置相关选择
 */
watch(
  () => config.value.selectedDevice,
  (newDevice, oldDevice) => {
    if (newDevice?.deviceId !== oldDevice?.deviceId) {
      // 设备变化时，重置指标选择
      config.value.selectedMetric = null
      if (config.value.includeMetric) {
        // 如果启用了指标选择，但没有可用指标，自动禁用
        if (availableMetrics.value.length === 0) {
          config.value.includeMetric = false
        }
      }
    }
  }
)

/**
 * 监听指标开关，自动处理指标选择
 */
watch(
  () => config.value.includeMetric,
  includeMetric => {
    if (!includeMetric) {
      config.value.selectedMetric = null
    }
  }
)

/**
 * 处理设备选择
 */
const handleDeviceChange = (deviceId: string) => {
  const device = mockDevices.find(d => d.deviceId === deviceId)
  config.value.selectedDevice = device || null
}

/**
 * 处理指标选择
 */
const handleMetricChange = (metricKey: string) => {
  const metric = availableMetrics.value.find(m => m.metricKey === metricKey)
  config.value.selectedMetric = metric || null
}

/**
 * 初始化编辑模式（从现有参数中恢复配置）
 */
const initEditMode = () => {
  if (!props.existingParameters) return

  // 分析现有参数，恢复设备配置
  let deviceId = ''
  let metricKey = ''

  for (const param of props.existingParameters) {
    if (param.key === 'deviceId') {
      deviceId = param.value
      config.value.includeDeviceId = true
    }
    if (param.key === 'metric') {
      metricKey = param.value
      config.value.includeMetric = true
    }
    if (param.key === 'deviceLocation') {
      config.value.includeLocation = true
    }
    if (param.key === 'deviceStatus') {
      config.value.includeStatus = true
    }
  }

  // 恢复设备选择
  if (deviceId) {
    const device = mockDevices.find(d => d.deviceId === deviceId)
    if (device) {
      config.value.selectedDevice = device

      // 恢复指标选择
      if (metricKey) {
        nextTick(() => {
          const metric = availableMetrics.value.find(m => m.metricKey === metricKey)
          if (metric) {
            config.value.selectedMetric = metric
          }
        })
      }
    }
  }
}

/**
 * 生成参数
 */
const generateParameters = () => {
  if (!canGenerate.value) return

  const parameters: EnhancedParameter[] = []

  // 生成设备ID参数
  if (config.value.includeDeviceId && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceId',
      value: config.value.selectedDevice.deviceId,
      enabled: true,
      valueMode: 'manual',
      dataType: 'string',
      _id: `param_device_id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `设备ID: ${config.value.selectedDevice.deviceName}`,
      deviceContext: {
        sourceType: 'device-selection',
        selectionConfig: {
          selectedDevice: config.value.selectedDevice
        },
        timestamp: Date.now()
      }
    })
  }

  // 生成指标参数
  if (config.value.includeMetric && config.value.selectedMetric) {
    parameters.push({
      key: 'metric',
      value: config.value.selectedMetric.metricKey,
      enabled: true,
      valueMode: 'manual',
      dataType: 'string',
      _id: `param_metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `指标: ${config.value.selectedMetric.metricLabel}`,
      deviceContext: {
        sourceType: 'device-selection',
        selectionConfig: {
          selectedDevice: config.value.selectedDevice,
          selectedMetric: config.value.selectedMetric
        },
        timestamp: Date.now()
      }
    })
  }

  // 生成位置参数（未来扩展）
  if (config.value.includeLocation && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceLocation',
      value: `location_${config.value.selectedDevice.deviceId}`,
      enabled: true,
      valueMode: 'manual',
      dataType: 'string',
      _id: `param_location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `设备位置: ${config.value.selectedDevice.deviceName}`
    })
  }

  // 生成状态参数（未来扩展）
  if (config.value.includeStatus && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceStatus',
      value: `status_${config.value.selectedDevice.deviceId}`,
      enabled: true,
      valueMode: 'manual',
      dataType: 'string',
      _id: `param_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `设备状态: ${config.value.selectedDevice.deviceName}`
    })
  }

  emit('parametersGenerated', parameters)
}

/**
 * 取消选择
 */
const cancel = () => {
  emit('cancel')
}

// 初始化编辑模式
if (props.editMode) {
  nextTick(() => {
    initEditMode()
  })
}
</script>

<template>
  <div class="unified-device-config-selector">
    <!-- 标题 -->
    <div class="selector-header">
      <n-space align="center">
        <n-icon size="20" color="#2080f0">
          <DeviceIcon />
        </n-icon>
        <n-text strong>{{ editMode ? '修改设备配置' : '设备参数配置' }}</n-text>
      </n-space>
      <n-text depth="3" style="font-size: 12px; margin-top: 4px">选择设备和需要的参数类型，避免重复参数问题</n-text>
    </div>

    <n-card :bordered="false" class="config-card">
      <!-- 设备选择 -->
      <div class="config-section">
        <n-space align="center" style="margin-bottom: 12px">
          <n-icon size="16"><DeviceIcon /></n-icon>
          <n-text strong>选择设备</n-text>
          <n-text type="error" style="font-size: 12px">*</n-text>
        </n-space>

        <n-select
          :value="config.selectedDevice?.deviceId"
          :options="deviceOptions"
          placeholder="请选择设备..."
          clearable
          filterable
          @update:value="handleDeviceChange"
        />
      </div>

      <n-divider style="margin: 20px 0" />

      <!-- 参数类型选择 -->
      <div class="config-section">
        <n-text strong style="margin-bottom: 12px; display: block">选择需要的参数类型</n-text>

        <n-space vertical size="large">
          <!-- 设备ID参数 -->
          <div class="param-type-option">
            <n-space align="center">
              <n-checkbox v-model:checked="config.includeDeviceId" :disabled="!config.selectedDevice" />
              <n-icon size="16" color="#2080f0">
                <DeviceIcon />
              </n-icon>
              <div class="param-type-info">
                <n-text strong>设备ID参数</n-text>
                <n-text depth="3" style="font-size: 12px; display: block">生成 deviceId 参数，用于标识具体设备</n-text>
              </div>
              <n-tag v-if="config.includeDeviceId && config.selectedDevice" size="small" type="success">
                {{ config.selectedDevice.deviceId }}
              </n-tag>
            </n-space>
          </div>

          <!-- 指标参数 -->
          <div class="param-type-option">
            <n-space align="center">
              <n-checkbox
                v-model:checked="config.includeMetric"
                :disabled="!config.selectedDevice || availableMetrics.length === 0"
              />
              <n-icon size="16" color="#18a058">
                <MetricIcon />
              </n-icon>
              <div class="param-type-info">
                <n-text strong>指标参数</n-text>
                <n-text depth="3" style="font-size: 12px; display: block">生成 metric 参数，用于指定监控指标</n-text>
              </div>
              <n-tag v-if="config.includeMetric && config.selectedMetric" size="small" type="info">
                {{ config.selectedMetric.metricKey }}
              </n-tag>
            </n-space>

            <!-- 指标选择 -->
            <div v-if="config.includeMetric && config.selectedDevice" style="margin-left: 32px; margin-top: 8px">
              <n-select
                :value="config.selectedMetric?.metricKey"
                :options="metricOptions"
                placeholder="选择指标..."
                size="small"
                :disabled="availableMetrics.length === 0"
                @update:value="handleMetricChange"
              />
            </div>
          </div>

          <!-- 位置参数（未来扩展） -->
          <div class="param-type-option">
            <n-space align="center">
              <n-checkbox v-model:checked="config.includeLocation" :disabled="!config.selectedDevice" />
              <n-icon size="16" color="#f0a020">
                <LocationIcon />
              </n-icon>
              <div class="param-type-info">
                <n-text strong>设备位置参数</n-text>
                <n-text depth="3" style="font-size: 12px; display: block">
                  生成 deviceLocation 参数（未来扩展功能）
                </n-text>
              </div>
              <n-tag v-if="config.includeLocation" size="small" type="warning">敬请期待</n-tag>
            </n-space>
          </div>

          <!-- 状态参数（未来扩展） -->
          <div class="param-type-option">
            <n-space align="center">
              <n-checkbox v-model:checked="config.includeStatus" :disabled="!config.selectedDevice" />
              <n-icon size="16" color="#e88080">
                <StatusIcon />
              </n-icon>
              <div class="param-type-info">
                <n-text strong>设备状态参数</n-text>
                <n-text depth="3" style="font-size: 12px; display: block">
                  生成 deviceStatus 参数（未来扩展功能）
                </n-text>
              </div>
              <n-tag v-if="config.includeStatus" size="small" type="warning">敬请期待</n-tag>
            </n-space>
          </div>
        </n-space>
      </div>

      <!-- 参数预览 -->
      <div v-if="previewParameters.length > 0" class="preview-section">
        <n-divider style="margin: 20px 0" />

        <n-alert type="info">
          <template #header>
            <span>生成参数预览</span>
          </template>

          <div class="param-preview">
            <div v-for="param in previewParameters" :key="param.key" class="param-preview-item">
              <strong>{{ param.key }}</strong>
              = "{{ param.value }}"
              <n-tag size="small" style="margin-left: 8px">{{ param.type }}</n-tag>
            </div>
          </div>
        </n-alert>
      </div>
    </n-card>

    <!-- 操作按钮 -->
    <div class="selector-actions">
      <n-space justify="end">
        <n-button @click="cancel">取消</n-button>
        <n-button type="primary" :disabled="!canGenerate" @click="generateParameters">
          {{ editMode ? '更新参数' : '生成参数' }} ({{ previewParameters.length }})
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.unified-device-config-selector {
  padding: 20px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selector-header {
  margin-bottom: 8px;
}

.config-card {
  flex: 1;
  background: var(--card-color);
}

.config-section {
  margin-bottom: 20px;
}

.param-type-option {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.param-type-option:hover {
  border-color: var(--primary-color-suppl);
  background: var(--hover-color);
}

.param-type-info {
  flex: 1;
  margin-left: 8px;
}

.preview-section {
  margin-top: 16px;
}

.param-preview {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
}

.param-preview-item {
  padding: 4px 8px;
  margin: 4px 0;
  background: var(--code-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.selector-actions {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
