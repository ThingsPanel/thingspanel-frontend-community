<template>
  <div class="device-data-source-test">
    <h2>设备数据源测试</h2>
    
    <n-card title="设备数据源配置" class="config-card">
      <n-form :model="dataSource" label-placement="left" label-width="auto">
        <!-- 启用开关 -->
        <n-form-item label="启用数据源">
          <n-switch v-model:value="dataSource.enabled" />
        </n-form-item>

        <!-- 数据源类型 -->
        <n-form-item label="数据源类型">
          <n-select
            v-model:value="dataSource.type"
            :options="dataSourceTypeOptions"
            placeholder="选择数据源类型"
          />
        </n-form-item>

        <!-- 数据源名称 -->
        <n-form-item label="数据源名称">
          <n-input
            v-model:value="dataSource.name"
            placeholder="请输入数据源名称"
          />
        </n-form-item>

        <!-- 设备数据源配置 -->
        <template v-if="dataSource.type === 'device'">
          <n-form-item label="设备">
            <n-select
              v-model:value="dataSource.deviceId"
              :options="deviceOptions"
              placeholder="选择设备"
              filterable
              :loading="isLoadingDevices"
              @update:value="onDeviceChange"
            />
          </n-form-item>

          <n-form-item label="数据类型">
            <n-select
              v-model:value="dataSource.metricsType"
              :options="metricsTypeOptions"
              placeholder="选择数据类型"
            />
          </n-form-item>

          <n-form-item label="指标">
            <n-select
              v-model:value="dataSource.metricsId"
              :options="metricsOptions"
              placeholder="选择指标"
              filterable
              :loading="isLoadingMetrics"
              :show="dataSource.metricsShow"
              :render-option="metricsOptionRender"
              @update:show="onMetricsDropdownShow"
              @update:value="onMetricsChange"
            />
          </n-form-item>

          <n-form-item label="指标名称">
            <n-input
              v-model:value="dataSource.metricsName"
              placeholder="指标显示名称"
            />
          </n-form-item>

          <n-form-item label="聚合函数">
            <n-select
              v-model:value="dataSource.aggregateFunction"
              :options="aggregateOptions"
              placeholder="选择聚合函数"
            />
          </n-form-item>

          <n-form-item label="时间范围">
            <n-select
              v-model:value="dataSource.timeRange"
              :options="timeRangeOptions"
              placeholder="选择时间范围"
            />
          </n-form-item>

          <n-form-item label="刷新间隔 (秒)">
            <n-input-number
              v-model:value="dataSource.refreshInterval"
              :min="0"
              :max="3600"
              placeholder="0 表示不自动刷新"
            />
          </n-form-item>
        </template>

        <!-- 测试按钮 -->
        <n-form-item>
          <n-button
            type="primary"
            :loading="isTesting"
            :disabled="!dataSource.deviceId || !dataSource.metricsId"
            @click="testDataSource"
          >
            测试数据源
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 测试结果 -->
    <n-card v-if="testResult" title="测试结果" class="result-card">
      <n-alert
        :type="testResult.success ? 'success' : 'error'"
        :title="testResult.success ? '测试成功' : '测试失败'"
        :description="testResult.message"
      />
      
      <div v-if="testResult.data" class="response-data">
        <h4>响应数据:</h4>
        <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
      </div>
    </n-card>

    <!-- 组件预览 -->
    <n-card title="组件预览" class="preview-card">
      <div class="component-preview">
        <DigitIndicatorCard
          :properties="componentProps"
          :metadata="{ dataSource: dataSource }"
        />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { NCard, NForm, NFormItem, NInput, NSelect, NInputNumber, NButton, NSwitch, NAlert } from 'naive-ui'
import DigitIndicatorCard from '../../../card2.1/components/digit-indicator/DigitIndicatorCard.vue'
import type { DeviceDataSource } from '../types/data-source'
import { DataSourceType } from '../types/data-source'
import { dataSourceManager } from '../core/data-source-manager'
import { deviceListForPanel, deviceMetricsList } from '@/service/api'

// 数据源配置
const dataSource = ref<DeviceDataSource>({
  type: DataSourceType.DEVICE,
  name: '设备数据源',
  enabled: true,
  deviceId: '',
  metricsId: '',
  metricsType: 'telemetry',
  metricsName: '',
  aggregateFunction: 'avg',
  timeRange: 'last_1h',
  refreshInterval: 0,
  metricsOptions: [],
  metricsOptionsFetched: false,
  metricsShow: false
})

// 测试状态
const isTesting = ref(false)
const isLoadingDevices = ref(false)
const isLoadingMetrics = ref(false)
const testResult = ref<{
  success: boolean
  message: string
  data?: any
} | null>(null)

// 组件属性
const componentProps = ref({
  title: '设备数据测试',
  unit: '',
  color: '#1890ff',
  fontSize: 24
})

// 数据源类型选项
const dataSourceTypeOptions = [
  {
    label: '设备数据',
    value: DataSourceType.DEVICE,
    description: '从设备获取实时数据'
  }
]

// 设备选项
const deviceOptions = ref<Array<{ label: string; value: string; name?: string }>>([])

// 指标选项
const metricsOptions = ref<any[]>([])

// 选项配置
const metricsTypeOptions = [
  { label: '遥测数据', value: 'telemetry' },
  { label: '属性数据', value: 'attributes' },
  { label: '事件数据', value: 'event' },
  { label: '命令数据', value: 'command' }
]

const aggregateOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' }
]

const timeRangeOptions = [
  { label: '最近5分钟', value: 'last_5m' },
  { label: '最近15分钟', value: 'last_15m' },
  { label: '最近30分钟', value: 'last_30m' },
  { label: '最近1小时', value: 'last_1h' },
  { label: '最近3小时', value: 'last_3h' },
  { label: '最近6小时', value: 'last_6h' },
  { label: '最近12小时', value: 'last_12h' },
  { label: '最近24小时', value: 'last_24h' },
  { label: '最近3天', value: 'last_3d' },
  { label: '最近7天', value: 'last_7d' }
]

// 获取设备列表
const getDeviceList = async () => {
  isLoadingDevices.value = true
  try {
    const res = await deviceListForPanel({})
    deviceOptions.value = (res.data || []).map((device: any) => ({
      label: device.name,
      value: device.id,
      name: device.name
    }))
    console.log('🔧 DeviceDataSourceTest - 设备列表加载成功:', deviceOptions.value)
  } catch (error) {
    console.error('🔧 DeviceDataSourceTest - 设备列表加载失败:', error)
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
    console.log('🔧 DeviceDataSourceTest - 指标列表加载成功:', metricsOptions.value)
  } catch (error) {
    console.error('🔧 DeviceDataSourceTest - 指标列表加载失败:', error)
    metricsOptions.value = []
  } finally {
    isLoadingMetrics.value = false
  }
}

// 设备选择变化
const onDeviceChange = async (deviceId: string) => {
  dataSource.value.deviceId = deviceId
  dataSource.value.metricsId = ''
  dataSource.value.metricsName = ''
  dataSource.value.metricsOptions = []
  dataSource.value.metricsOptionsFetched = false
  
  if (deviceId) {
    await getMetricsList(deviceId)
  }
}

// 指标下拉框显示/隐藏
const onMetricsDropdownShow = async (show: boolean) => {
  dataSource.value.metricsShow = show
  
  if (show && dataSource.value.deviceId && !dataSource.value.metricsOptionsFetched) {
    await getMetricsList(dataSource.value.deviceId)
    dataSource.value.metricsOptionsFetched = true
  }
}

// 指标选择变化
const onMetricsChange = (metricsId: string) => {
  dataSource.value.metricsId = metricsId
  
  // 根据选择的指标更新指标名称
  const selectedMetric = metricsOptions.value.find((option: any) => 
    option.options?.some((opt: any) => opt.key === metricsId)
  )
  
  if (selectedMetric) {
    const metric = selectedMetric.options.find((opt: any) => opt.key === metricsId)
    if (metric) {
      dataSource.value.metricsName = metric.label || metric.key
      dataSource.value.metricsType = selectedMetric.data_source_type
      dataSource.value.metricsDataType = metric.data_type
    }
  }
}

// 指标选项渲染
const metricsOptionRender = (info: any) => {
  // 使用 h 函数创建虚拟节点
  return h('div', { class: 'border-b border-#d9d9d9 p-x-10px p-y-15px' }, [
    h('div', { class: 'm-b-5px' }, [
      h('span', { style: 'font-size: 16px;color:#999' }, info?.option?.data_source_type)
    ]),
    ...(info?.option?.options?.map((it: any) => {
      if (!it.label) return null
      
      return h('div', {
        class: 'm-b-2px',
        onClick: () => {
          dataSource.value.metricsId = it.key
          dataSource.value.metricsName = it.label || ''
          dataSource.value.metricsType = info?.option?.data_source_type
          dataSource.value.metricsDataType = it.data_type
          dataSource.value.metricsShow = false
        }
      }, [
        it.label ? h('div', { class: 'flex items-center gap-5px' }, [
          h('div', { class: 'flex flex-1 items-center gap-5px' }, [
            h('span', it.label),
            h('span', { class: 'color-#cccc' }, `(${it.key})`)
          ]),
          h('span', { class: 'text-#999' }, it.data_type)
        ]) : h('div', { class: 'flex items-center gap-5px' }, [
          h('span', { class: 'flex-1' }, it.key),
          h('span', { class: 'text-#999' }, it.data_type)
        ])
      ])
    }) || [])
  ])
}

// 测试数据源
const testDataSource = async () => {
  if (!dataSource.value.deviceId || !dataSource.value.metricsId) {
    testResult.value = {
      success: false,
      message: '请先选择设备和指标'
    }
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    // 使用数据源管理器测试
    const value = await dataSourceManager.getValue(dataSource.value)
    
    testResult.value = {
      success: true,
      message: '设备数据源测试成功',
      data: value.rawData
    }

    console.log('🔧 DeviceDataSourceTest - 测试成功:', {
      value: value.value,
      rawData: value.rawData,
      metadata: value.metadata
    })

  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '测试失败'
    }
    
    console.error('🔧 DeviceDataSourceTest - 测试失败:', error)
  } finally {
    isTesting.value = false
  }
}

// 初始化时加载设备列表
getDeviceList()
</script>

<style scoped>
.device-data-source-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.config-card,
.result-card,
.preview-card {
  margin-bottom: 20px;
}

.response-data {
  margin-top: 16px;
}

.response-data pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.component-preview {
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}
</style> 