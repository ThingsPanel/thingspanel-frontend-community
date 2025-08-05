<template>
  <div class="device-data-source-config">
    <n-form :model="config" label-placement="top" size="small">
      <!-- 第一步：选择数据类型 -->
      <n-form-item label="数据类型">
        <n-select
          v-model:value="config.metricsType"
          :options="metricsTypeOptions"
          placeholder="选择数据类型"
          @update:value="onMetricsTypeChange"
        />
      </n-form-item>

      <!-- 第二步：选择数据模式 -->
      <n-form-item label="数据模式">
        <n-select
          v-model:value="config.dataMode"
          :options="dataModeOptions"
          placeholder="选择数据模式"
          :disabled="config.metricsType !== 'telemetry'"
          @update:value="onDataModeChange"
        />
      </n-form-item>

      <!-- 第三步：如果是历史数据，选择时间范围和聚合方式 -->
      <template v-if="config.dataMode === 'history'">
        <n-form-item label="时间范围">
          <n-select
            v-model:value="config.timeRange"
            :options="timeRangeOptions"
            placeholder="选择时间范围"
            @update:value="updateConfig"
          />
        </n-form-item>

        <n-form-item label="聚合方式">
          <n-select
            v-model:value="config.aggregateFunction"
            :options="aggregateFunctionOptions"
            placeholder="选择聚合方式"
            @update:value="updateConfig"
          />
        </n-form-item>
      </template>

      <!-- 第四步：选择设备 -->
      <n-form-item label="设备">
        <n-select
          v-model:value="config.deviceId"
          :options="deviceOptions"
          placeholder="选择设备"
          :loading="isLoadingDevices"
          label-field="name"
          value-field="id"
          filterable
          @update:value="onDeviceChange"
        />
      </n-form-item>

      <!-- 第五步：选择指标 -->
      <n-form-item label="指标">
        <n-select
          v-model:value="config.metricsId"
          :options="metricsOptions"
          placeholder="选择指标"
          :loading="isLoadingMetrics"
          :disabled="!config.deviceId || !config.metricsType"
          :show="config.metricsShow"
          :consistent-menu-width="false"
          filterable
          :render-option="metricsOptionRender"
          @update:show="onMetricsDropdownShow"
        />
      </n-form-item>

      <!-- 第六步：轮询配置 -->
      <n-form-item label="数据获取方式">
        <!-- 调试信息 -->
        <div style="margin-bottom: 8px; padding: 4px; background: #f0f0f0; border-radius: 4px; font-size: 12px">
          <div>当前选择: {{ config.pollingType }}</div>
          <div>可用选项: {{ pollingTypeOptions.map(opt => opt.label).join(', ') }}</div>
        </div>

        <n-select
          v-model:value="config.pollingType"
          :options="pollingTypeOptions"
          placeholder="选择数据获取方式"
          @update:value="onPollingTypeChange"
        />
      </n-form-item>

      <!-- 轮询配置详情 -->
      <template v-if="config.pollingType === 'timer'">
        <n-form-item label="刷新间隔（秒）">
          <n-input-number
            v-model:value="refreshIntervalSeconds"
            :min="1"
            :max="3600"
            placeholder="输入刷新间隔"
            @update:value="updateRefreshInterval"
          />
        </n-form-item>
      </template>

      <template v-if="config.pollingType === 'websocket'">
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

        <!-- 实时数据预览 -->
        <template v-if="websocketStatus.type === 'success' && realtimeData">
          <n-form-item label="实时数据">
            <n-card size="small" class="realtime-data">
              <n-space vertical>
                <div class="data-header">
                  <n-text strong>最新数据 ({{ formatTime(realtimeData.timestamp) }})</n-text>
                  <n-button size="small" @click="clearRealtimeData">清空</n-button>
                </div>
                <pre class="data-content">{{ JSON.stringify(realtimeData.data, null, 2) }}</pre>
              </n-space>
            </n-card>
          </n-form-item>
        </template>
      </template>

      <template v-if="config.pollingType === 'mqtt'">
        <n-form-item label="MQTT Broker">
          <n-input
            :value="config.mqttConfig?.broker || ''"
            placeholder="输入MQTT Broker地址"
            @update:value="updateMqttBroker"
          />
        </n-form-item>
        <n-form-item label="MQTT Topic">
          <n-input
            :value="config.mqttConfig?.topic || ''"
            placeholder="输入MQTT Topic"
            @update:value="updateMqttTopic"
          />
        </n-form-item>
      </template>

      <!-- 第七步：数据获取方式选择 -->
      <n-form-item label="数据获取方式">
        <n-select
          v-model:value="selectedApiType"
          :options="apiTypeOptions"
          placeholder="选择数据获取方式"
          @update:value="onApiTypeChange"
        />
      </n-form-item>

      <!-- 第八步：手动获取数据 -->
      <n-form-item label="数据获取">
        <div class="data-fetch-container">
          <n-button type="primary" :loading="isLoadingData" :disabled="!canFetchData" @click="fetchSampleData">
            手动获取数据
          </n-button>
          <span class="fetch-tip">点击按钮手动获取当前配置的数据</span>
        </div>
      </n-form-item>

      <!-- 第八步：数据预览和映射 -->
      <template v-if="config.metricsId && sampleData">
        <n-form-item label="数据预览">
          <n-card size="small" class="data-preview">
            <pre>{{ JSON.stringify(sampleData, null, 2) }}</pre>
          </n-card>
        </n-form-item>

        <DataMappingConfig :data="sampleData" :mappings="config.dataPaths" @update:mappings="updateDataPaths" />
      </template>

      <!-- 错误信息显示 -->
      <template v-if="config.errorMessage">
        <n-alert type="error" :title="config.errorMessage" />
      </template>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, h } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NInputNumber, NCard, NAlert, NButton, NSpace, NTag, NText } from 'naive-ui'
import DataMappingConfig from './DataMappingConfig.vue'
import { deviceListForPanel, deviceMetricsList } from '@/service/api'
import {
  telemetryDataCurrentKeys,
  telemetryDataHistoryList,
  getAttributeDataSet,
  getAttributeDatasKey,
  telemetryDataPub,
  attributeDataPub,
  commandDataPub,
  getEventDataSet,
  getCommandDataSetLogs,
  deviceDetail,
  getDeviceConnectInfo,
  deviceAlarmStatus,
  deviceAlarmHistory,
  getSimulation,
  sendSimulation,
  deviceCustomCommandsIdList,
  getTelemetryLogList,
  getAttributeDataSetLogs
} from '@/service/api/device'
import type { DeviceDataSource } from '../../types/data-source'
import { DataSourceType } from '../../types/data-source'

interface Props {
  modelValue: DeviceDataSource
}

interface Emits {
  'update:modelValue': [value: DeviceDataSource]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = ref<DeviceDataSource>({
  ...props.modelValue,
  type: DataSourceType.DEVICE,
  enabled: true,
  deviceId: props.modelValue?.deviceId || '',
  metricsType: props.modelValue?.metricsType || 'telemetry',
  dataMode: props.modelValue?.dataMode || 'latest',
  pollingType: props.modelValue?.pollingType || 'websocket',
  timeRange: props.modelValue?.timeRange || '1h',
  aggregateFunction: props.modelValue?.aggregateFunction || 'avg',
  dataPaths: props.modelValue?.dataPaths || [],
  refreshInterval: props.modelValue?.refreshInterval || 5000,
  mqttConfig: props.modelValue?.mqttConfig || {
    broker: '',
    topic: '',
    username: '',
    password: ''
  },
  dataMapping: props.modelValue?.dataMapping || {
    mappings: [],
    defaultArrayMode: 'auto',
    defaultArrayIndex: 0,
    enableAutoDetection: true
  },
  metricsShow: false,
  metricsOptions: [],
  metricsOptionsFetched: false
})

// 响应式数据
const isLoadingDevices = ref(false)
const isLoadingMetrics = ref(false)
const isLoadingData = ref(false)
const sampleData = ref<any>(null)
const selectedApiType = ref<string>('telemetry_current')

// WebSocket 相关
const websocketStatus = ref<{ type: 'info' | 'success' | 'error'; text: string }>({ type: 'info', text: '未连接' })
const realtimeData = ref<any>(null)

// 计算属性
const refreshIntervalSeconds = computed({
  get: () => (config.value.refreshInterval || 5000) / 1000,
  set: value => {
    if (value) {
      config.value.refreshInterval = value * 1000
      updateConfig()
    }
  }
})

// 是否可以获取数据
const canFetchData = computed(() => {
  if (!config.value.deviceId || !config.value.metricsId) {
    return false
  }

  // 历史数据只支持定时器轮询
  if (config.value.dataMode === 'history' && config.value.pollingType !== 'timer') {
    return false
  }

  // WebSocket 模式不需要手动配置 URL，系统会自动连接
  // if (config.value.pollingType === 'websocket' && !config.value.websocketUrl) {
  //   return false
  // }

  // MQTT需要配置broker和topic
  if (config.value.pollingType === 'mqtt' && (!config.value.mqttConfig?.broker || !config.value.mqttConfig?.topic)) {
    return false
  }

  return true
})

// 选项配置
const metricsTypeOptions = [
  { label: '遥测数据', value: 'telemetry' },
  { label: '属性数据', value: 'attributes' },
  { label: '事件数据', value: 'event' },
  { label: '命令数据', value: 'command' }
]

const dataModeOptions = [
  { label: '最新数据', value: 'latest' },
  { label: '历史数据', value: 'history' }
]

const timeRangeOptions = [
  { label: '最近5分钟', value: '5m' },
  { label: '最近15分钟', value: '15m' },
  { label: '最近30分钟', value: '30m' },
  { label: '最近1小时', value: '1h' },
  { label: '最近3小时', value: '3h' },
  { label: '最近6小时', value: '6h' },
  { label: '最近12小时', value: '12h' },
  { label: '最近24小时', value: '24h' },
  { label: '最近3天', value: '3d' },
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' }
]

const aggregateFunctionOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' }
]

const pollingTypeOptions = [
  { label: 'WebSocket (推荐)', value: 'websocket' },
  { label: '定时器', value: 'timer' },
  { label: 'MQTT', value: 'mqtt' }
]

// API类型选项
const apiTypeOptions = [
  // 遥测数据
  { label: '遥测数据 - 当前值', value: 'telemetry_current' },
  { label: '遥测数据 - 历史值', value: 'telemetry_history' },
  { label: '遥测数据 - 发布', value: 'telemetry_pub' },
  { label: '遥测数据 - 日志', value: 'telemetry_logs' },

  // 属性数据
  { label: '属性数据 - 数据集', value: 'attributes_dataset' },
  { label: '属性数据 - 指定键', value: 'attributes_key' },
  { label: '属性数据 - 发布', value: 'attributes_pub' },
  { label: '属性数据 - 日志', value: 'attributes_logs' },

  // 事件数据
  { label: '事件数据 - 数据集', value: 'event_dataset' },

  // 命令数据
  { label: '命令数据 - 发布', value: 'command_pub' },
  { label: '命令数据 - 日志', value: 'command_logs' },
  { label: '命令数据 - 自定义命令', value: 'command_custom' },

  // 设备信息
  { label: '设备信息 - 详情', value: 'device_detail' },
  { label: '设备信息 - 连接信息', value: 'device_connect' },
  { label: '设备信息 - 告警状态', value: 'device_alarm_status' },
  { label: '设备信息 - 告警历史', value: 'device_alarm_history' },

  // 模拟数据
  { label: '模拟数据 - 获取', value: 'simulation_get' },
  { label: '模拟数据 - 发送', value: 'simulation_send' }
]

// 设备选项
const deviceOptions = ref<any[]>([])

// 指标选项
const metricsOptions = ref<any[]>([])

// 获取设备列表
const getDeviceList = async () => {
  isLoadingDevices.value = true
  try {
    const res = await deviceListForPanel({})
    deviceOptions.value = res.data || []
    console.log('设备列表加载成功:', deviceOptions.value)
    config.value.errorMessage = ''
  } catch (error) {
    console.error('设备列表加载失败:', error)
    config.value.errorMessage = '设备列表加载失败'
  } finally {
    isLoadingDevices.value = false
  }
}

// 获取指标列表
const getMetricsList = async (deviceId: string) => {
  if (!deviceId) return

  isLoadingMetrics.value = true
  try {
    const res = await deviceMetricsList(deviceId)
    metricsOptions.value = res?.data || []
    console.log('指标列表加载成功:', metricsOptions.value)
    config.value.errorMessage = ''
  } catch (error) {
    console.error('指标列表加载失败:', error)
    metricsOptions.value = []
    config.value.errorMessage = '指标列表加载失败'
  } finally {
    isLoadingMetrics.value = false
  }
}

// 指标选项渲染
const metricsOptionRender = (info: any) => {
  const option = info?.option
  const dataSourceType = option?.data_source_type
  const options = option?.options || []

  return h('div', { class: 'border-b border-#d9d9d9 p-x-10px p-y-15px' }, [
    h('div', { class: 'm-b-5px' }, [h('span', { style: 'font-size: 16px;color:#999' }, dataSourceType)]),
    ...options
      .map((it: any) => {
        if (!it.label) return null

        return h(
          'div',
          {
            class: 'm-b-2px',
            onClick: () => {
              config.value.metricsId = it.key
              config.value.metricsName = it.label || ''
              config.value.metricsType = dataSourceType
              config.value.metricsDataType = it.data_type
              config.value.metricsShow = false
              updateConfig()
            }
          },
          [
            h('div', { class: 'flex items-center gap-5px' }, [
              h('div', { class: 'flex flex-1 items-center gap-5px' }, [
                h('span', it.label),
                h('span', { class: 'color-#cccc' }, `(${it.key})`)
              ]),
              h('span', { class: 'text-#999' }, it.data_type)
            ])
          ]
        )
      })
      .filter(Boolean)
  ])
}

// 事件处理函数
const onMetricsTypeChange = (value: string) => {
  config.value.metricsType = value as any
  config.value.metricsId = '' // 清空指标选择
  config.value.metricsOptions = []
  config.value.metricsOptionsFetched = false

  // 如果不是遥测数据，强制设置为最新数据模式
  if (value !== 'telemetry') {
    config.value.dataMode = 'latest'
  }

  updateConfig()
  if (config.value.deviceId) {
    getMetricsList(config.value.deviceId)
  }
}

const onDataModeChange = (value: string) => {
  config.value.dataMode = value as any
  // 历史数据只能使用定时器轮询
  if (value === 'history') {
    config.value.pollingType = 'timer'
  }
  updateConfig()
}

const onDeviceChange = async (value: string) => {
  config.value.deviceId = value
  config.value.metricsId = '' // 清空指标选择
  config.value.metricsOptions = []
  config.value.metricsOptionsFetched = false
  updateConfig()

  if (value) {
    await getMetricsList(value)
  }
}

const onMetricsDropdownShow = async (show: boolean) => {
  config.value.metricsShow = show

  if (show && config.value.deviceId && !config.value.metricsOptionsFetched) {
    await getMetricsList(config.value.deviceId)
    config.value.metricsOptionsFetched = true
  }
}

const onPollingTypeChange = (value: string) => {
  config.value.pollingType = value as any
  updateConfig()
}

const onApiTypeChange = (value: string) => {
  selectedApiType.value = value
  updateConfig()
}

const updateDataPaths = (mappings: any[]) => {
  config.value.dataPaths = mappings
  updateConfig()
}

const updateRefreshInterval = (value: number | null) => {
  if (value) {
    config.value.refreshInterval = value * 1000
    updateConfig()
  }
}

const updateMqttBroker = (value: string) => {
  if (!config.value.mqttConfig) {
    config.value.mqttConfig = {
      broker: '',
      topic: '',
      username: '',
      password: ''
    }
  }
  config.value.mqttConfig.broker = value
  updateConfig()
}

const updateMqttTopic = (value: string) => {
  if (!config.value.mqttConfig) {
    config.value.mqttConfig = {
      broker: '',
      topic: '',
      username: '',
      password: ''
    }
  }
  config.value.mqttConfig.topic = value
  updateConfig()
}

const fetchSampleData = async () => {
  if (!canFetchData.value) {
    config.value.errorMessage = '请先完成配置'
    return
  }

  isLoadingData.value = true
  config.value.errorMessage = ''

  try {
    let data: any = null

    // 根据选择的API类型调用不同的接口
    switch (selectedApiType.value) {
      // 遥测数据相关
      case 'telemetry_current': {
        const currentResponse = await telemetryDataCurrentKeys({
          device_id: config.value.deviceId,
          keys: config.value.metricsId
        })
        data = {
          value: currentResponse?.data?.[0]?.value,
          timestamp: new Date().toISOString(),
          quality: 'good',
          unit: currentResponse?.data?.[0]?.unit
        }
        break
      }

      case 'telemetry_history': {
        const historyParams = {
          device_id: config.value.deviceId,
          key: config.value.metricsId,
          time_range: config.value.timeRange || '1h',
          aggregate_function: config.value.aggregateFunction || 'avg'
        }
        const historyResponse = await telemetryDataHistoryList(historyParams)
        data = {
          values: historyResponse?.data || [],
          aggregate: historyResponse?.data?.[0]?.value,
          timestamp: new Date().toISOString(),
          quality: 'good'
        }
        break
      }

      case 'telemetry_pub': {
        const telemetryPubData = {
          device_id: config.value.deviceId,
          key: config.value.metricsId,
          value: Math.random() * 100
        }
        const telemetryPubResponse = await telemetryDataPub(telemetryPubData)
        data = {
          success: true,
          message: '遥测数据发布成功',
          data: telemetryPubResponse,
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'telemetry_logs': {
        const telemetryLogsResponse = await getTelemetryLogList({
          device_id: config.value.deviceId,
          key: config.value.metricsId
        })
        data = {
          logs: telemetryLogsResponse?.data || [],
          timestamp: new Date().toISOString()
        }
        break
      }

      // 属性数据相关
      case 'attributes_dataset': {
        const attributesResponse = await getAttributeDataSet({ device_id: config.value.deviceId })
        data = {
          attributes: attributesResponse?.data || [],
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'attributes_key': {
        const attributesKeyResponse = await getAttributeDatasKey({
          device_id: config.value.deviceId,
          key: config.value.metricsId
        })
        data = {
          value: attributesKeyResponse?.data?.value,
          timestamp: new Date().toISOString(),
          quality: 'good'
        }
        break
      }

      case 'attributes_pub': {
        const attributesPubData = {
          device_id: config.value.deviceId,
          key: config.value.metricsId,
          value: 'test_value'
        }
        const attributesPubResponse = await attributeDataPub(attributesPubData)
        data = {
          success: true,
          message: '属性数据发布成功',
          data: attributesPubResponse,
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'attributes_logs': {
        const attributesLogsResponse = await getAttributeDataSetLogs({
          device_id: config.value.deviceId
        })
        data = {
          logs: attributesLogsResponse?.data || [],
          timestamp: new Date().toISOString()
        }
        break
      }

      // 事件数据相关
      case 'event_dataset': {
        const eventResponse = await getEventDataSet({
          device_id: config.value.deviceId
        })
        data = {
          events: eventResponse?.data || [],
          timestamp: new Date().toISOString()
        }
        break
      }

      // 命令数据相关
      case 'command_pub': {
        const commandPubData = {
          device_id: config.value.deviceId,
          key: config.value.metricsId,
          value: 'test_command'
        }
        const commandPubResponse = await commandDataPub(commandPubData)
        data = {
          success: true,
          message: '命令数据发布成功',
          data: commandPubResponse,
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'command_logs': {
        const commandLogsResponse = await getCommandDataSetLogs({
          device_id: config.value.deviceId
        })
        data = {
          logs: commandLogsResponse?.data || [],
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'command_custom': {
        const customCommandsResponse = await deviceCustomCommandsIdList(config.value.deviceId)
        data = {
          commands: customCommandsResponse?.data || [],
          timestamp: new Date().toISOString()
        }
        break
      }

      // 设备信息相关
      case 'device_detail': {
        const deviceDetailResponse = await deviceDetail(config.value.deviceId)
        data = {
          device: deviceDetailResponse?.data,
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'device_connect': {
        const deviceConnectResponse = await getDeviceConnectInfo({
          device_id: config.value.deviceId
        })
        data = {
          connectInfo: deviceConnectResponse?.data,
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'device_alarm_status': {
        const alarmStatusResponse = await deviceAlarmStatus({
          device_id: config.value.deviceId
        })
        data = {
          alarmStatus: alarmStatusResponse?.data,
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'device_alarm_history': {
        const alarmHistoryResponse = await deviceAlarmHistory({
          device_id: config.value.deviceId
        })
        data = {
          alarmHistory: alarmHistoryResponse?.data,
          timestamp: new Date().toISOString()
        }
        break
      }

      // 模拟数据相关
      case 'simulation_get': {
        const simulationGetResponse = await getSimulation({
          device_id: config.value.deviceId
        })
        data = {
          simulation: simulationGetResponse?.data,
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'simulation_send': {
        const simulationSendData = {
          device_id: config.value.deviceId,
          key: config.value.metricsId,
          value: Math.random() * 100
        }
        const simulationSendResponse = await sendSimulation(simulationSendData)
        data = {
          success: true,
          message: '模拟数据发送成功',
          data: simulationSendResponse,
          timestamp: new Date().toISOString()
        }
        break
      }

      default:
        throw new Error('不支持的API类型')
    }

    sampleData.value = data
    console.log('数据获取成功:', data)
  } catch (error) {
    console.error('获取数据失败:', error)
    config.value.errorMessage = `获取数据失败: ${error}`
  } finally {
    isLoadingData.value = false
  }
}

// 更新配置
const updateConfig = () => {
  emit('update:modelValue', { ...config.value })
}

// 监听外部变化
watch(
  () => props.modelValue,
  newValue => {
    config.value = { ...config.value, ...newValue }
  },
  { deep: true }
)

// 组件挂载时初始化
onMounted(() => {
  getDeviceList()
})

// WebSocket 连接管理
const ws = ref<WebSocket | null>(null)

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

const clearRealtimeData = () => {
  realtimeData.value = null
}

const toggleWebSocketConnection = () => {
  if (websocketStatus.value.type === 'info') {
    connectWebSocket()
  } else {
    disconnectWebSocket()
  }
}

const connectWebSocket = () => {
  if (ws.value) {
    websocketStatus.value.text = '已连接'
    websocketStatus.value.type = 'success'
    return
  }

  // 使用默认的 WebSocket URL 或从配置中获取
  const wsUrl = config.value.websocketUrl || 'ws://localhost:8080/ws'

  websocketStatus.value.text = '连接中...'
  websocketStatus.value.type = 'info'

  ws.value = new WebSocket(wsUrl)

  ws.value.onopen = () => {
    websocketStatus.value.text = '已连接'
    websocketStatus.value.type = 'success'
    console.log('WebSocket 连接成功')
  }

  ws.value.onerror = error => {
    websocketStatus.value.text = '连接失败'
    websocketStatus.value.type = 'error'
    console.error('WebSocket 连接失败:', error)
  }

  ws.value.onmessage = event => {
    try {
      const message = JSON.parse(event.data)
      if (message.type === 'realtime_data') {
        realtimeData.value = message
      }
    } catch (e) {
      console.error('WebSocket 消息解析失败:', e)
    }
  }

  ws.value.onclose = () => {
    websocketStatus.value.text = '已断开'
    websocketStatus.value.type = 'info'
    ws.value = null
    console.log('WebSocket 连接已关闭')
  }
}

const disconnectWebSocket = () => {
  if (ws.value) {
    ws.value.close()
    websocketStatus.value.text = '已断开'
    websocketStatus.value.type = 'info'
    ws.value = null
    console.log('WebSocket 连接已断开')
  }
}

// 实时数据获取
const getRealtimeData = async () => {
  if (!config.value.deviceId || !config.value.metricsId) {
    return
  }

  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket 未连接，无法获取实时数据')
    return
  }

  const message = {
    type: 'get_realtime_data',
    device_id: config.value.deviceId,
    key: config.value.metricsId
  }

  ws.value.send(JSON.stringify(message))
}

// 实时数据订阅
const subscribeRealtimeData = async () => {
  if (!config.value.deviceId || !config.value.metricsId) {
    return
  }

  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    console.warn('WebSocket 未连接，无法订阅实时数据')
    return
  }

  const message = {
    type: 'subscribe_realtime_data',
    device_id: config.value.deviceId,
    key: config.value.metricsId,
    topic: config.value.websocketTopic || `/device/${config.value.deviceId}/telemetry`
  }

  ws.value.send(JSON.stringify(message))
}

// 实时数据取消订阅
const unsubscribeRealtimeData = async () => {
  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    return
  }

  const message = {
    type: 'unsubscribe_realtime_data',
    device_id: config.value.deviceId,
    key: config.value.metricsId
  }

  ws.value.send(JSON.stringify(message))
}

// 轮询实时数据
const pollRealtimeData = () => {
  if (config.value.pollingType === 'websocket') {
    subscribeRealtimeData()
  } else {
    getRealtimeData()
  }
}

// 轮询配置
const pollingConfig = computed(() => {
  if (config.value.pollingType === 'websocket') {
    return {
      type: 'websocket',
      interval: config.value.refreshInterval || 5000,
      topic: config.value.websocketTopic || `/device/${config.value.deviceId}/telemetry`
    }
  } else {
    return {
      type: 'timer',
      interval: config.value.refreshInterval || 5000,
      timeRange: config.value.timeRange || '1h',
      aggregateFunction: config.value.aggregateFunction || 'avg'
    }
  }
})

// 轮询启动
const startPolling = () => {
  if (config.value.pollingType === 'websocket') {
    subscribeRealtimeData()
  } else {
    getRealtimeData()
  }

  const interval = pollingConfig.value.interval
  if (interval > 0) {
    const timer = setInterval(() => {
      if (config.value.pollingType === 'websocket') {
        subscribeRealtimeData()
      } else {
        getRealtimeData()
      }
    }, interval)
    return timer
  }
  return null
}

// 轮询停止
const stopPolling = (timer: any) => {
  if (timer) {
    clearInterval(timer)
  }
}

// 轮询管理
watch(
  pollingConfig,
  (newVal, oldVal) => {
    if (newVal.interval !== oldVal.interval) {
      stopPolling(pollingTimer.value)
      pollingTimer.value = startPolling()
    }
  },
  { deep: true }
)

const pollingTimer = ref<any>(null)

// 组件卸载时清理
onUnmounted(() => {
  stopPolling(pollingTimer.value)
  disconnectWebSocket()
})
</script>

<style scoped>
.device-data-source-config {
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
}

.data-fetch-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fetch-tip {
  color: #666;
  font-size: 12px;
}

.data-preview {
  max-height: 200px;
  overflow-y: auto;
}

.data-preview pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.realtime-data {
  max-height: 200px;
  overflow-y: auto;
}

.realtime-data .data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.realtime-data .data-content {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
</style>
