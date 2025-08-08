<template>
  <div class="telemetry-api-form">
    <BaseApiForm
      ref="baseFormRef"
      v-model="formData"
      :rules="formRules"
      submit-text="获取数据"
      :show-test-button="true"
      :can-submit="canSubmit"
      @submit="handleSubmit"
      @test="handleTest"
    >
      <template #form-content="{ formData, updateForm }">
        <!-- API类型选择 -->
        <n-form-item label="API类型" required>
          <n-select
            v-model:value="selectedApiType"
            :options="apiTypeOptions"
            placeholder="选择API类型"
            @update:value="onApiTypeChange"
          />
        </n-form-item>

        <!-- 设备选择 -->
        <DeviceSelector v-model="formData.deviceId" @device-change="onDeviceChange" />

        <!-- 当前值参数 -->
        <template v-if="selectedApiType === 'telemetry_current'">
          <n-form-item label="指标键" required>
            <n-input
              v-model:value="formData.keys"
              placeholder="输入指标键，多个用逗号分隔"
              @update:value="value => updateForm('keys', value)"
            />
            <template #feedback>
              <span class="form-tip">例如：temperature,humidity,pressure</span>
            </template>
          </n-form-item>
        </template>

        <!-- 历史值参数 -->
        <template v-if="selectedApiType === 'telemetry_history'">
          <n-form-item label="指标键" required>
            <n-input
              v-model:value="formData.key"
              placeholder="输入指标键"
              @update:value="value => updateForm('key', value)"
            />
          </n-form-item>

          <n-form-item label="时间范围" required>
            <n-select
              v-model:value="formData.time_range"
              :options="timeRangeOptions"
              placeholder="选择时间范围"
              @update:value="value => updateForm('time_range', value)"
            />
          </n-form-item>

          <n-form-item label="聚合函数" required>
            <n-select
              v-model:value="formData.aggregate_function"
              :options="aggregateFunctionOptions"
              placeholder="选择聚合函数"
              @update:value="value => updateForm('aggregate_function', value)"
            />
          </n-form-item>
        </template>

        <!-- 发布参数 -->
        <template v-if="selectedApiType === 'telemetry_pub'">
          <n-form-item label="指标键" required>
            <n-input
              v-model:value="formData.key"
              placeholder="输入指标键"
              @update:value="value => updateForm('key', value)"
            />
          </n-form-item>

          <n-form-item label="数据值" required>
            <n-input
              v-model:value="formData.value"
              placeholder="输入数据值"
              @update:value="value => updateForm('value', value)"
            />
            <template #feedback>
              <span class="form-tip">支持数字、字符串、布尔值等</span>
            </template>
          </n-form-item>
        </template>

        <!-- 日志参数 -->
        <template v-if="selectedApiType === 'telemetry_logs'">
          <n-form-item label="指标键">
            <n-input
              v-model:value="formData.key"
              placeholder="输入指标键（可选）"
              @update:value="value => updateForm('key', value)"
            />
            <template #feedback>
              <span class="form-tip">留空查询所有指标的日志</span>
            </template>
          </n-form-item>
        </template>

        <!-- 轮询配置 -->
        <template v-if="supportsPolling">
          <PollingConfig
            v-model="pollingConfig"
            :can-control="canSubmit"
            @polling-toggle="onPollingToggle"
            @force-update="handleForceUpdate"
          />
        </template>
      </template>
    </BaseApiForm>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NFormItem, NSelect, NInput } from 'naive-ui'
import BaseApiForm from './BaseApiForm.vue'
import DeviceSelector from './DeviceSelector.vue'
import PollingConfig from './PollingConfig.vue'
import {
  telemetryDataCurrentKeys,
  telemetryDataHistoryList,
  telemetryDataPub,
  getTelemetryLogList
} from '@/service/api/device'
import { formatApiResponse } from '../utils/api-helpers'
import { ApiType } from '../types/api-types'
import type { PollingConfig as PollingConfigType } from '../types/api-types'

interface Props {
  modelValue?: Record<string, any>
}

interface Emits {
  'update:modelValue': [value: Record<string, any>]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const baseFormRef = ref<any>(null)
const selectedApiType = ref<ApiType>(ApiType.TELEMETRY_CURRENT)
const formData = ref<Record<string, any>>({
  deviceId: '',
  keys: '',
  key: '',
  time_range: '1h',
  aggregate_function: 'avg',
  value: '',
  ...props.modelValue
})

const pollingConfig = ref<PollingConfigType>({
  enabled: false,
  interval: 5000,
  status: 'stopped'
})

// API类型选项
const apiTypeOptions = [
  { label: '获取当前值', value: ApiType.TELEMETRY_CURRENT },
  { label: '获取历史值', value: ApiType.TELEMETRY_HISTORY },
  { label: '发布数据', value: ApiType.TELEMETRY_PUB },
  { label: '查看日志', value: ApiType.TELEMETRY_LOGS }
]

// 时间范围选项
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

// 聚合函数选项
const aggregateFunctionOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' }
]

// 表单验证规则
const formRules = computed(() => {
  const rules: any = {
    deviceId: [{ required: true, message: '请选择设备', trigger: 'change' }]
  }

  switch (selectedApiType.value) {
    case ApiType.TELEMETRY_CURRENT:
      rules.keys = [{ required: true, message: '请输入指标键', trigger: 'blur' }]
      break
    case ApiType.TELEMETRY_HISTORY:
      rules.key = [{ required: true, message: '请输入指标键', trigger: 'blur' }]
      rules.time_range = [{ required: true, message: '请选择时间范围', trigger: 'change' }]
      rules.aggregate_function = [{ required: true, message: '请选择聚合函数', trigger: 'change' }]
      break
    case ApiType.TELEMETRY_PUB:
      rules.key = [{ required: true, message: '请输入指标键', trigger: 'blur' }]
      rules.value = [{ required: true, message: '请输入数据值', trigger: 'blur' }]
      break
  }

  return rules
})

// 计算属性
const canSubmit = computed(() => {
  if (!formData.value.deviceId) return false

  switch (selectedApiType.value) {
    case ApiType.TELEMETRY_CURRENT:
      return !!formData.value.keys
    case ApiType.TELEMETRY_HISTORY:
      return !!(formData.value.key && formData.value.time_range && formData.value.aggregate_function)
    case ApiType.TELEMETRY_PUB:
      return !!(formData.value.key && formData.value.value)
    case ApiType.TELEMETRY_LOGS:
      return true // 日志查询可选参数
    default:
      return false
  }
})

const supportsPolling = computed(() => {
  // 只有获取数据的API支持轮询，发布数据不支持
  return selectedApiType.value !== ApiType.TELEMETRY_PUB
})

// 事件处理
const onApiTypeChange = (apiType: ApiType) => {
  selectedApiType.value = apiType
  // 重置相关字段
  formData.value.keys = ''
  formData.value.key = ''
  formData.value.value = ''
  updateForm()
}

const onDeviceChange = (device: any) => {
  formData.value.deviceId = device?.id || ''
  updateForm()
}

const onPollingToggle = (enabled: boolean) => {
  pollingConfig.value.enabled = enabled
  updateForm()
}

const handleForceUpdate = () => {
  handleSubmit(formData.value)
}

// API调用函数
const callApi = async (data: Record<string, any>) => {
  const { deviceId, ...params } = data

  switch (selectedApiType.value) {
    case ApiType.TELEMETRY_CURRENT:
      return await telemetryDataCurrentKeys({
        device_id: deviceId,
        keys: params.keys
      })

    case ApiType.TELEMETRY_HISTORY:
      return await telemetryDataHistoryList({
        device_id: deviceId,
        key: params.key,
        time_range: params.time_range,
        aggregate_function: params.aggregate_function
      })

    case ApiType.TELEMETRY_PUB:
      return await telemetryDataPub({
        device_id: deviceId,
        key: params.key,
        value: params.value
      })

    case ApiType.TELEMETRY_LOGS: {
      const logParams: any = { device_id: deviceId }
      if (params.key) {
        logParams.key = params.key
      }
      return await getTelemetryLogList(logParams)
    }

    default:
      throw new Error('不支持的API类型')
  }
}

// 提交处理
const handleSubmit = async (data: Record<string, any>) => {
  try {
    const response = await callApi(data)
    const formattedData = formatApiResponse(response, selectedApiType.value)

    baseFormRef.value?.setResponseData(formattedData)
    baseFormRef.value?.setSuccessMessage('数据获取成功')

    // 更新轮询状态
    if (pollingConfig.value.enabled) {
      pollingConfig.value.setLastUpdate(new Date().toISOString())
      pollingConfig.value.incrementRequestCount()
    }

    console.log('遥测数据API调用成功:', formattedData)
  } catch (error) {
    console.error('遥测数据API调用失败:', error)
    baseFormRef.value?.setErrorMessage(`API调用失败: ${error}`)

    if (pollingConfig.value.enabled) {
      pollingConfig.value.setStatus('error')
      pollingConfig.value.setErrorMessage(`API调用失败: ${error}`)
    }
  }
}

// 测试处理
const handleTest = async (data: Record<string, any>) => {
  await handleSubmit(data)
}

// 更新表单
const updateForm = () => {
  emit('update:modelValue', { ...formData.value })
}

// 监听外部数据变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      formData.value = { ...formData.value, ...newValue }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.telemetry-api-form {
  width: 100%;
}

.form-tip {
  font-size: 12px;
  color: #666;
}
</style>
