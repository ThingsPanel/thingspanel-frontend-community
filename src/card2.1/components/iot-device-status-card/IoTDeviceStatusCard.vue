<template>
  <div
    class="iot-device-status-card"
    :style="finalCardStyles"
    tabindex="0"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- 📱 设备头部信息 -->
    <div class="device-header" :style="headerStyles">
      <div class="device-info">
        <div class="device-icon" :style="iconStyles">
          <n-icon :size="config.iconSize" :color="statusIconColor">
            <component :is="deviceIcon" />
          </n-icon>
        </div>
        <div class="device-details">
          <h4 class="device-name" :style="deviceNameStyles">
            {{ currentData.deviceName || config.deviceName || 'IoT设备' }}
          </h4>
          <p class="device-type" :style="deviceTypeStyles">
            {{ currentData.deviceType || config.deviceType || '传感器' }}
          </p>
        </div>
      </div>

      <!-- 🔋 设备状态指示器 -->
      <div class="status-section">
        <n-tag :type="statusTagType" :bordered="false" round>
          <template #icon>
            <n-icon><component :is="statusIcon" /></n-icon>
          </template>
          {{ statusText }}
        </n-tag>

        <!-- 📊 信号强度 -->
        <div v-if="config.showSignalStrength" class="signal-strength" :style="signalStyles">
          <n-icon :size="16" :color="signalColor">
            <WifiOutline />
          </n-icon>
          <span class="signal-text">{{ signalStrengthText }}</span>
        </div>
      </div>
    </div>

    <!-- 📈 数据监控区域 -->
    <div class="monitoring-section" :style="monitoringSectionStyles">
      <!-- 🌡️ 主要指标 -->
      <div class="primary-metrics">
        <div v-for="(metric, index) in displayMetrics" :key="index" class="metric-item">
          <div class="metric-label">{{ metric.label }}</div>
          <div class="metric-value" :style="{ color: metric.color }">
            {{ formatMetricValue(metric.value, metric.unit) }}
            <span v-if="metric.trend" class="metric-trend" :style="{ color: metric.trendColor }">
              <n-icon :size="12">
                <component :is="getTrendIcon(metric.trend)" />
              </n-icon>
              {{ metric.trendText }}
            </span>
          </div>
        </div>
      </div>

      <!-- 📍 位置信息 -->
      <div v-if="config.showLocation && currentData.location" class="location-info">
        <n-icon :size="14" color="#666">
          <LocationOutline />
        </n-icon>
        <span class="location-text">{{ currentData.location }}</span>
      </div>

      <!-- ⏰ 最后更新时间 -->
      <div class="update-info" :style="updateInfoStyles">
        <n-icon :size="12" color="#999">
          <TimeOutline />
        </n-icon>
        <span class="update-text">
          {{ $t('device.lastUpdate') }}:
          <n-time v-if="currentData.lastUpdate" :time="currentData.lastUpdate" type="relative" />
          <span v-else>{{ $t('common.never') }}</span>
        </span>
      </div>
    </div>

    <!-- 🔧 操作按钮 -->
    <div v-if="config.showActions && hasActions" class="action-section">
      <n-space :size="8">
        <n-button
          v-for="action in config.actions"
          :key="action.key"
          :size="config.actionSize"
          :type="action.type"
          :disabled="!isDeviceOnline || action.disabled"
          :loading="actionLoadingStates[action.key]"
          @click="handleAction(action)"
        >
          <template #icon>
            <n-icon><component :is="getActionIcon(action.icon)" /></n-icon>
          </template>
          {{ action.label }}
        </n-button>
      </n-space>
    </div>

    <!-- 🚨 告警信息 -->
    <div v-if="hasAlerts" class="alerts-section">
      <n-alert
        v-for="alert in currentData.alerts"
        :key="alert.id"
        :type="alert.level"
        :show-icon="true"
        size="small"
        style="margin-bottom: 8px"
      >
        <template #header>{{ alert.title }}</template>
        {{ alert.message }}
        <template #action>
          <n-button size="tiny" quaternary @click="dismissAlert(alert.id)">
            {{ $t('common.dismiss') }}
          </n-button>
        </template>
      </n-alert>
    </div>

    <!-- 🔍 交互状态指示器 (调试模式) -->
    <div v-if="showInteractionIndicator" class="interaction-indicator">
      <span class="indicator-label">交互状态:</span>
      <span class="indicator-value">{{ interactionStatusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * IoT设备状态卡片组件
 * 专为物联网设备监控设计，支持实时状态、指标监控、告警处理
 */

import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInteractionCapable } from '@/card2.1/core/mixins/InteractionCapable'
import type { InteractionProps, InteractionEmits } from '@/card2.1/types/interaction-component'
import {
  propertyExposureRegistry,
  createPropertyExposure,
  createProperty,
  CommonProperties
} from '@/card2.1/core/property-exposure'
import {
  componentDataRequirementsRegistry,
  createDataRequirement,
  createDataField
} from '@/card2.1/core/component-data-requirements'
import {
  // 设备图标
  PhonePortraitOutline,
  TabletLandscapeOutline,
  DesktopOutline,
  TvOutline,
  CarOutline,
  // 状态图标
  CheckmarkCircleOutline,
  CloseCircleOutline,
  WarningOutline,
  BatteryHalfOutline,
  WifiOutline,
  LocationOutline,
  TimeOutline,
  // 趋势图标
  TrendingUpOutline,
  TrendingDownOutline,
  RemoveOutline,
  // 操作图标
  PlayOutline,
  StopOutline,
  RefreshOutline,
  SettingsOutline,
  InformationCircleOutline
} from '@vicons/ionicons5'

const { t } = useI18n()

// 设备类型图标映射
const DEVICE_ICON_MAP = {
  sensor: PhonePortraitOutline,
  gateway: TabletLandscapeOutline,
  controller: DesktopOutline,
  display: TvOutline,
  vehicle: CarOutline,
  camera: PhonePortraitOutline,
  thermostat: DesktopOutline
}

// 操作图标映射
const ACTION_ICON_MAP = {
  start: PlayOutline,
  stop: StopOutline,
  restart: RefreshOutline,
  configure: SettingsOutline,
  info: InformationCircleOutline
}

interface DeviceMetric {
  label: string
  value: number | string
  unit?: string
  color?: string
  trend?: 'up' | 'down' | 'stable'
  trendText?: string
  trendColor?: string
}

interface DeviceAlert {
  id: string
  title: string
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
}

interface DeviceAction {
  key: string
  label: string
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  icon?: string
  disabled?: boolean
}

interface Props extends InteractionProps {
  config?: {
    // 设备基础信息
    deviceName?: string
    deviceType?: string
    deviceCategory?: string

    // 显示配置
    showLocation?: boolean
    showSignalStrength?: boolean
    showActions?: boolean

    // 图标配置
    iconSize?: number
    deviceIcon?: string

    // 指标配置
    primaryMetrics?: DeviceMetric[]
    maxMetricsDisplay?: number

    // 操作配置
    actions?: DeviceAction[]
    actionSize?: 'small' | 'medium' | 'large'

    // 样式配置
    backgroundColor?: string
    borderColor?: string
    borderRadius?: number
    textColor?: string
    headerColor?: string
    padding?: number
    minHeight?: number

    // 状态配置
    statusColors?: {
      online?: string
      offline?: string
      warning?: string
      error?: string
    }
  }
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    deviceName: 'IoT设备',
    deviceType: '温湿度传感器',
    deviceCategory: 'sensor',
    showLocation: true,
    showSignalStrength: true,
    showActions: true,
    iconSize: 28,
    deviceIcon: 'sensor',
    primaryMetrics: [],
    maxMetricsDisplay: 4,
    actions: [
      { key: 'refresh', label: '刷新', type: 'default', icon: 'restart' },
      { key: 'configure', label: '配置', type: 'primary', icon: 'configure' }
    ],
    actionSize: 'small',
    backgroundColor: '#ffffff',
    borderColor: '#e6e6e6',
    borderRadius: 12,
    textColor: '#333333',
    headerColor: '#1a1a1a',
    padding: 16,
    minHeight: 280,
    statusColors: {
      online: '#52c41a',
      offline: '#ff4d4f',
      warning: '#faad14',
      error: '#ff4d4f'
    }
  }),
  componentId: '',
  showInteractionIndicator: false,
  allowExternalControl: true,
  previewMode: true
})

const emit = defineEmits<InteractionEmits>()

// 🔥 使用交互能力混入
const { currentInteractionState, createEventHandler, interactionStatusText, triggerInteractionEvent } =
  useInteractionCapable(props, emit, {
    enableDebug: true
  })

// 🔥 设备状态数据模拟器
const simulatedDeviceData = ref({
  status: 'online' as 'online' | 'offline' | 'warning' | 'error',
  signalStrength: 85,
  batteryLevel: 78,
  temperature: 25.6,
  humidity: 68.2,
  pressure: 1013.25,
  connectionTime: new Date(Date.now() - 3600000) // 1小时前连接
})

// 📊 当前设备数据
const currentData = ref({
  deviceName: props.config.deviceName || 'IoT设备',
  deviceType: props.config.deviceType || '温湿度传感器',
  status: 'online' as 'online' | 'offline' | 'warning' | 'error',
  location: '机房A-货架01',
  signalStrength: 85,
  batteryLevel: 78,
  lastUpdate: new Date(),
  metrics: [
    {
      label: '温度',
      value: 25.6,
      unit: '°C',
      color: '#ff6b6b',
      trend: 'up',
      trendText: '+0.5°C',
      trendColor: '#ff6b6b'
    },
    { label: '湿度', value: 68.2, unit: '%', color: '#4ecdc4', trend: 'stable', trendText: '持平', trendColor: '#999' },
    {
      label: '压力',
      value: 1013.25,
      unit: 'hPa',
      color: '#45b7d1',
      trend: 'down',
      trendText: '-2.1hPa',
      trendColor: '#45b7d1'
    },
    { label: '电池', value: 78, unit: '%', color: '#96ceb4', trend: 'down', trendText: '-5%', trendColor: '#ffa726' }
  ] as DeviceMetric[],
  alerts: [] as DeviceAlert[]
})

// 操作按钮加载状态
const actionLoadingStates = ref<Record<string, boolean>>({})

let dataSimulatorTimer: number | null = null

// 计算属性
const deviceIcon = computed(() => {
  return DEVICE_ICON_MAP[props.config.deviceIcon as keyof typeof DEVICE_ICON_MAP] || PhonePortraitOutline
})

const isDeviceOnline = computed(() => {
  return currentData.value.status === 'online'
})

const statusIcon = computed(() => {
  switch (currentData.value.status) {
    case 'online':
      return CheckmarkCircleOutline
    case 'offline':
      return CloseCircleOutline
    case 'warning':
      return WarningOutline
    case 'error':
      return CloseCircleOutline
    default:
      return WarningOutline
  }
})

const statusIconColor = computed(() => {
  const colors = props.config.statusColors
  switch (currentData.value.status) {
    case 'online':
      return colors?.online || '#52c41a'
    case 'offline':
      return colors?.offline || '#ff4d4f'
    case 'warning':
      return colors?.warning || '#faad14'
    case 'error':
      return colors?.error || '#ff4d4f'
    default:
      return '#999999'
  }
})

const statusTagType = computed(() => {
  switch (currentData.value.status) {
    case 'online':
      return 'success'
    case 'offline':
      return 'error'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
})

const statusText = computed(() => {
  switch (currentData.value.status) {
    case 'online':
      return t('device.status.online')
    case 'offline':
      return t('device.status.offline')
    case 'warning':
      return t('device.status.warning')
    case 'error':
      return t('device.status.error')
    default:
      return t('device.status.unknown')
  }
})

const signalStrengthText = computed(() => {
  const strength = currentData.value.signalStrength
  if (strength >= 80) return t('device.signal.excellent')
  if (strength >= 60) return t('device.signal.good')
  if (strength >= 40) return t('device.signal.fair')
  return t('device.signal.poor')
})

const signalColor = computed(() => {
  const strength = currentData.value.signalStrength
  if (strength >= 80) return '#52c41a'
  if (strength >= 60) return '#52c41a'
  if (strength >= 40) return '#faad14'
  return '#ff4d4f'
})

const displayMetrics = computed(() => {
  const metrics = currentData.value.metrics.slice(0, props.config.maxMetricsDisplay)
  return metrics
})

const hasActions = computed(() => {
  return props.config.actions && props.config.actions.length > 0
})

const hasAlerts = computed(() => {
  return currentData.value.alerts && currentData.value.alerts.length > 0
})

// 样式计算
const cardStyles = computed(() => ({
  backgroundColor: props.config.backgroundColor,
  border: `1px solid ${props.config.borderColor}`,
  borderRadius: `${props.config.borderRadius}px`,
  padding: `${props.config.padding}px`,
  minHeight: `${props.config.minHeight}px`,
  color: props.config.textColor
}))

const finalCardStyles = computed(() => {
  const baseStyles = cardStyles.value
  const state = currentInteractionState.value

  return {
    ...baseStyles,
    backgroundColor: state.backgroundColor || baseStyles.backgroundColor,
    color: state.textColor || baseStyles.color,
    borderColor: state.borderColor || baseStyles.borderColor,
    width: state.width ? `${state.width}px` : undefined,
    height: state.height ? `${state.height}px` : undefined,
    opacity: state.opacity !== undefined ? state.opacity : 1,
    transform: state.transform || 'none',
    visibility: state.visibility || 'visible',
    transition: 'all 0.3s ease',
    ...(state.isAnimating && {
      transform: `${state.transform || ''} scale(1.02)`,
      boxShadow: '0 4px 20px rgba(0, 123, 255, 0.2)'
    })
  }
})

const headerStyles = computed(() => ({
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: `1px solid ${props.config.borderColor}33`
}))

const iconStyles = computed(() => ({
  marginRight: '12px'
}))

const deviceNameStyles = computed(() => ({
  color: props.config.headerColor,
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px 0'
}))

const deviceTypeStyles = computed(() => ({
  color: '#666666',
  fontSize: '12px',
  margin: '0'
}))

const signalStyles = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  marginTop: '8px',
  fontSize: '12px',
  color: '#666666'
}))

const monitoringSectionStyles = computed(() => ({
  marginBottom: '16px'
}))

const updateInfoStyles = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  marginTop: '12px',
  fontSize: '11px',
  color: '#999999'
}))

// 工具函数
const formatMetricValue = (value: number | string, unit?: string): string => {
  if (typeof value === 'number') {
    return `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`
  }
  return `${value}${unit ? ` ${unit}` : ''}`
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return TrendingUpOutline
    case 'down':
      return TrendingDownOutline
    default:
      return RemoveOutline
  }
}

const getActionIcon = (iconKey?: string) => {
  if (!iconKey) return SettingsOutline
  return ACTION_ICON_MAP[iconKey as keyof typeof ACTION_ICON_MAP] || SettingsOutline
}

// 事件处理
const handleClick = createEventHandler('click')
const handleMouseEnter = createEventHandler('hover')
const handleMouseLeave = () => {
  console.log(`[IoTDeviceStatusCard] 鼠标离开 - ${props.componentId}`)
}
const handleFocus = createEventHandler('focus')
const handleBlur = createEventHandler('blur')

const handleAction = async (action: DeviceAction) => {
  console.log('[IoTDeviceStatusCard] 操作点击:', action)

  actionLoadingStates.value[action.key] = true

  try {
    // 模拟操作延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 触发交互事件
    triggerInteractionEvent('action', {
      actionKey: action.key,
      actionLabel: action.label,
      deviceId: props.componentId,
      timestamp: new Date()
    })

    window.$message?.success(`${action.label}操作已执行`)
  } catch (error) {
    console.error('操作执行失败:', error)
    window.$message?.error(`${action.label}操作失败`)
  } finally {
    actionLoadingStates.value[action.key] = false
  }
}

const dismissAlert = (alertId: string) => {
  const index = currentData.value.alerts.findIndex(alert => alert.id === alertId)
  if (index > -1) {
    currentData.value.alerts.splice(index, 1)
  }
}

// 数据模拟器
const startDataSimulator = () => {
  dataSimulatorTimer = window.setInterval(() => {
    // 模拟传感器数据变化
    simulatedDeviceData.value.temperature = 25.6 + (Math.random() - 0.5) * 4
    simulatedDeviceData.value.humidity = 68.2 + (Math.random() - 0.5) * 10
    simulatedDeviceData.value.pressure = 1013.25 + (Math.random() - 0.5) * 20

    // 模拟信号强度变化
    simulatedDeviceData.value.signalStrength = Math.max(
      20,
      Math.min(100, simulatedDeviceData.value.signalStrength + (Math.random() - 0.5) * 10)
    )

    // 模拟电池电量下降
    simulatedDeviceData.value.batteryLevel = Math.max(0, simulatedDeviceData.value.batteryLevel - Math.random() * 0.1)

    // 更新显示数据
    currentData.value.metrics[0].value = simulatedDeviceData.value.temperature
    currentData.value.metrics[1].value = simulatedDeviceData.value.humidity
    currentData.value.metrics[2].value = simulatedDeviceData.value.pressure
    currentData.value.metrics[3].value = simulatedDeviceData.value.batteryLevel

    currentData.value.signalStrength = simulatedDeviceData.value.signalStrength
    currentData.value.lastUpdate = new Date()

    // 模拟状态变化
    if (Math.random() < 0.05) {
      // 5% 概率状态变化
      const statuses = ['online', 'warning'] as const
      currentData.value.status = statuses[Math.floor(Math.random() * statuses.length)]
    }

    // 模拟告警生成
    if (Math.random() < 0.02 && currentData.value.alerts.length < 2) {
      // 2% 概率生成告警
      const alertTypes = [
        { title: '温度异常', message: '设备温度超过正常范围', level: 'warning' as const },
        { title: '信号弱', message: '设备信号强度较低', level: 'info' as const },
        { title: '电池低电量', message: '设备电池电量不足', level: 'warning' as const }
      ]

      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      currentData.value.alerts.push({
        id: `alert_${Date.now()}`,
        title: alertType.title,
        message: alertType.message,
        level: alertType.level,
        timestamp: new Date()
      })
    }

    console.log(`[IoTDeviceStatusCard] 数据更新 - ${props.componentId}:`, {
      temperature: simulatedDeviceData.value.temperature.toFixed(1),
      humidity: simulatedDeviceData.value.humidity.toFixed(1),
      status: currentData.value.status,
      alerts: currentData.value.alerts.length
    })
  }, 4000) // 每4秒更新一次

  console.log(`[IoTDeviceStatusCard] 数据模拟器已启动 - ${props.componentId}`)
}

const stopDataSimulator = () => {
  if (dataSimulatorTimer) {
    clearInterval(dataSimulatorTimer)
    dataSimulatorTimer = null
    console.log(`[IoTDeviceStatusCard] 数据模拟器已停止 - ${props.componentId}`)
  }
}

// 生命周期
onMounted(() => {
  console.log(`[IoTDeviceStatusCard] 组件已挂载 - ${props.componentId}`)

  // 启动数据模拟器
  startDataSimulator()

  // 🔥 注册组件属性暴露配置
  const propertyExposure = createPropertyExposure('iot-device-status-card', 'IoT设备状态卡片', [
    // 设备信息属性
    { ...CommonProperties.title, name: 'deviceName', label: '设备名称', defaultValue: props.config.deviceName },

    createProperty('deviceType', '设备类型', 'string', {
      description: '设备的类型或型号',
      group: '设备信息',
      defaultValue: props.config.deviceType,
      example: '温湿度传感器'
    }),

    createProperty('status', '设备状态', 'string', {
      description: '设备当前运行状态',
      group: '设备信息',
      defaultValue: 'online',
      enum: [
        { label: '在线', value: 'online' },
        { label: '离线', value: 'offline' },
        { label: '警告', value: 'warning' },
        { label: '错误', value: 'error' }
      ]
    }),

    createProperty('location', '设备位置', 'string', {
      description: '设备的物理位置',
      group: '设备信息',
      defaultValue: '未设置',
      example: '机房A-货架01'
    }),

    // 监控数据属性
    createProperty('temperature', '温度', 'number', {
      description: '当前温度值',
      group: '监控数据',
      defaultValue: 25.6,
      example: 25.6
    }),

    createProperty('humidity', '湿度', 'number', {
      description: '当前湿度百分比',
      group: '监控数据',
      defaultValue: 68.2,
      example: 68.2
    }),

    createProperty('signalStrength', '信号强度', 'number', {
      description: '设备信号强度百分比',
      group: '监控数据',
      defaultValue: 85,
      example: 85
    }),

    createProperty('batteryLevel', '电池电量', 'number', {
      description: '设备电池电量百分比',
      group: '监控数据',
      defaultValue: 78,
      example: 78
    }),

    // 样式属性
    { ...CommonProperties.backgroundColor, defaultValue: props.config.backgroundColor },
    { ...CommonProperties.textColor, defaultValue: props.config.textColor },
    { ...CommonProperties.visibility, defaultValue: 'visible' },

    // 显示控制属性
    createProperty('showLocation', '显示位置', 'boolean', {
      description: '是否显示设备位置信息',
      group: '显示控制',
      defaultValue: props.config.showLocation
    }),

    createProperty('showSignalStrength', '显示信号强度', 'boolean', {
      description: '是否显示设备信号强度',
      group: '显示控制',
      defaultValue: props.config.showSignalStrength
    }),

    createProperty('showActions', '显示操作按钮', 'boolean', {
      description: '是否显示设备操作按钮',
      group: '显示控制',
      defaultValue: props.config.showActions
    })
  ])

  propertyExposureRegistry.register(propertyExposure)

  // 🔥 注册组件数据需求声明
  console.log(`[IoTDeviceStatusCard] 注册数据需求声明 - ${props.componentId}`)
  const dataRequirement = createDataRequirement('iot-device-status-card', 'IoT设备状态卡片', {
    description: '专为物联网设备监控设计的状态卡片，支持实时状态、指标监控、告警处理',
    category: 'IoT设备',

    // 🌟 主要数据需求
    primaryData: {
      name: 'deviceStatus',
      label: '设备状态',
      description: '设备的整体运行状态信息',
      type: 'object',
      required: true,
      defaultValue: {
        status: 'online',
        deviceName: 'IoT设备',
        lastUpdate: new Date()
      },
      example: {
        status: 'online',
        deviceName: '温湿度传感器01',
        lastUpdate: '2024-01-01T12:00:00Z'
      },
      tags: ['primary', 'device', 'status']
    },

    // 📊 数据字段声明
    dataFields: [
      createDataField('deviceName', '设备名称', 'string', {
        description: '设备的名称或标识符',
        required: true,
        defaultValue: 'IoT设备',
        example: '温湿度传感器01',
        maxLength: 50,
        tags: ['device', 'identity']
      }),

      createDataField('deviceType', '设备类型', 'string', {
        description: '设备的类型或型号',
        required: false,
        defaultValue: '传感器',
        example: '温湿度传感器',
        maxLength: 30,
        tags: ['device', 'category']
      }),

      createDataField('deviceId', '设备ID', 'string', {
        description: '设备的唯一标识符',
        required: false,
        defaultValue: '',
        example: 'DEVICE_001',
        maxLength: 50,
        tags: ['device', 'id']
      }),

      createDataField('status', '设备状态', 'string', {
        description: '设备当前的运行状态',
        required: true,
        defaultValue: 'online',
        enum: [
          { label: '在线', value: 'online' },
          { label: '离线', value: 'offline' },
          { label: '警告', value: 'warning' },
          { label: '错误', value: 'error' }
        ],
        example: 'online',
        tags: ['status', 'state']
      }),

      createDataField('location', '设备位置', 'string', {
        description: '设备的物理安装位置',
        required: false,
        defaultValue: '',
        example: '机房A-货架01',
        maxLength: 100,
        tags: ['location', 'physical']
      }),

      createDataField('metrics', '监控指标', 'array', {
        description: '设备的监控指标数据列表',
        required: false,
        defaultValue: [],
        itemSchema: {
          type: 'object',
          properties: {
            label: { type: 'string', description: '指标名称' },
            value: { type: 'number', description: '指标数值' },
            unit: { type: 'string', description: '计量单位' },
            color: { type: 'string', description: '显示颜色' },
            trend: { type: 'string', enum: ['up', 'down', 'stable'], description: '变化趋势' }
          }
        },
        example: [
          { label: '温度', value: 25.6, unit: '°C', color: '#ff6b6b', trend: 'up' },
          { label: '湿度', value: 68.2, unit: '%', color: '#4ecdc4', trend: 'stable' }
        ],
        tags: ['metrics', 'monitoring']
      }),

      createDataField('signalStrength', '信号强度', 'number', {
        description: '设备信号强度百分比 (0-100)',
        required: false,
        defaultValue: 100,
        validation: {
          min: 0,
          max: 100
        },
        example: 85,
        tags: ['signal', 'connectivity']
      }),

      createDataField('batteryLevel', '电池电量', 'number', {
        description: '设备电池电量百分比 (0-100)',
        required: false,
        defaultValue: 100,
        validation: {
          min: 0,
          max: 100
        },
        example: 78,
        tags: ['battery', 'power']
      }),

      createDataField('lastUpdate', '最后更新时间', 'date', {
        description: '设备数据的最后更新时间',
        required: false,
        defaultValue: new Date(),
        example: '2024-01-01T12:00:00Z',
        tags: ['timestamp', 'metadata']
      }),

      createDataField('connectionTime', '连接时间', 'date', {
        description: '设备建立连接的时间',
        required: false,
        defaultValue: new Date(),
        example: '2024-01-01T10:00:00Z',
        tags: ['timestamp', 'connection']
      }),

      createDataField('alerts', '告警信息', 'array', {
        description: '设备当前的告警信息列表',
        required: false,
        defaultValue: [],
        itemSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '告警ID' },
            title: { type: 'string', description: '告警标题' },
            message: { type: 'string', description: '告警消息' },
            level: { type: 'string', enum: ['info', 'success', 'warning', 'error'], description: '告警级别' },
            timestamp: { type: 'string', format: 'date-time', description: '告警时间' }
          }
        },
        example: [
          {
            id: 'alert_001',
            title: '温度异常',
            message: '设备温度超过正常范围',
            level: 'warning',
            timestamp: '2024-01-01T12:00:00Z'
          }
        ],
        tags: ['alerts', 'notifications']
      }),

      createDataField('firmware', '固件信息', 'object', {
        description: '设备固件版本和相关信息',
        required: false,
        defaultValue: {},
        example: {
          version: '1.2.3',
          lastUpdate: '2024-01-01',
          updateAvailable: false
        },
        tags: ['firmware', 'version']
      }),

      createDataField('networkInfo', '网络信息', 'object', {
        description: '设备网络连接相关信息',
        required: false,
        defaultValue: {},
        example: {
          ip: '192.168.1.100',
          mac: '00:11:22:33:44:55',
          ssid: 'IoT_Network',
          rssi: -45
        },
        tags: ['network', 'connectivity']
      })
    ],

    // 🔄 数据更新配置
    updateConfig: {
      // 支持的触发方式
      supportedTriggers: ['timer', 'websocket', 'manual', 'event'],

      // 推荐的更新间隔（毫秒）
      recommendedInterval: 5000,

      // 最小更新间隔（毫秒）
      minInterval: 1000,

      // 数据验证规则
      validation: {
        requiredFields: ['deviceName', 'status'],
        stringFields: ['deviceName', 'deviceType', 'deviceId', 'status', 'location'],
        numericFields: ['signalStrength', 'batteryLevel'],
        enumFields: [{ field: 'status', values: ['online', 'offline', 'warning', 'error'] }]
      }
    },

    // 🎯 使用场景和示例
    useCases: [
      {
        name: '环境监测传感器',
        description: '监控环境温度、湿度等参数的传感器设备',
        exampleData: {
          deviceName: '环境传感器01',
          deviceType: '温湿度传感器',
          status: 'online',
          location: '机房A-货架01',
          metrics: [
            { label: '温度', value: 25.6, unit: '°C', color: '#ff6b6b', trend: 'up' },
            { label: '湿度', value: 68.2, unit: '%', color: '#4ecdc4', trend: 'stable' }
          ],
          signalStrength: 85,
          batteryLevel: 78,
          lastUpdate: new Date()
        }
      },
      {
        name: '智能网关设备',
        description: '物联网网关设备的状态监控',
        exampleData: {
          deviceName: '智能网关01',
          deviceType: 'LoRa网关',
          status: 'online',
          location: '数据中心-3楼',
          metrics: [
            { label: '连接设备', value: 45, unit: '个', color: '#45b7d1', trend: 'up' },
            { label: '数据流量', value: 2.8, unit: 'MB/h', color: '#96ceb4', trend: 'stable' }
          ],
          signalStrength: 95,
          batteryLevel: 100,
          lastUpdate: new Date()
        }
      },
      {
        name: '移动设备追踪',
        description: '移动IoT设备的位置和状态追踪',
        exampleData: {
          deviceName: '货车追踪器01',
          deviceType: 'GPS追踪器',
          status: 'online',
          location: '北京市朝阳区',
          metrics: [
            { label: '速度', value: 60, unit: 'km/h', color: '#ffa726', trend: 'stable' },
            { label: '里程', value: 1250, unit: 'km', color: '#26c6da', trend: 'up' }
          ],
          signalStrength: 72,
          batteryLevel: 45,
          lastUpdate: new Date(),
          alerts: [
            {
              id: 'battery_low',
              title: '电池电量低',
              message: '设备电池电量不足50%',
              level: 'warning',
              timestamp: new Date()
            }
          ]
        }
      }
    ]
  })

  componentDataRequirementsRegistry.register(dataRequirement)
  console.log(`[IoTDeviceStatusCard] 数据需求声明注册完成 - ${props.componentId}`)
})

onUnmounted(() => {
  console.log(`[IoTDeviceStatusCard] 组件即将卸载 - ${props.componentId}`)
  stopDataSimulator()
})
</script>

<style scoped>
.iot-device-status-card {
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.iot-device-status-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.device-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.device-details {
  flex: 1;
}

.device-name {
  line-height: 1.2;
}

.device-type {
  line-height: 1.2;
}

.status-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.signal-strength {
  white-space: nowrap;
}

.signal-text {
  margin-left: 4px;
}

.monitoring-section {
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
  padding: 12px;
}

.primary-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.metric-item {
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.metric-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.metric-value {
  font-size: 14px;
  font-weight: bold;
  line-height: 1.2;
}

.metric-trend {
  display: block;
  font-size: 10px;
  font-weight: normal;
  margin-top: 2px;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.location-text {
  font-weight: 500;
}

.action-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.alerts-section {
  margin-top: 16px;
}

.update-info {
  text-align: right;
}

.update-text {
  margin-left: 4px;
}

/* 交互状态指示器 */
.interaction-indicator {
  margin-top: 12px;
  padding: 8px;
  background: rgba(0, 123, 255, 0.1);
  border: 1px solid rgba(0, 123, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
}

.indicator-label {
  font-weight: bold;
  color: #007bff;
}

.indicator-value {
  color: #666;
  margin-left: 8px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .primary-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .metric-item {
    padding: 6px;
  }

  .device-header {
    flex-direction: column;
    gap: 12px;
  }

  .status-section {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
}

/* 主题适配 */
[data-theme='dark'] .monitoring-section {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme='dark'] .metric-item {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .location-info {
  background: rgba(255, 255, 255, 0.05);
}
</style>
