<template>
  <div class="event-api-form">
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
import { NFormItem, NSelect } from 'naive-ui'
import BaseApiForm from './BaseApiForm.vue'
import DeviceSelector from './DeviceSelector.vue'
import PollingConfig from './PollingConfig.vue'
import { getEventDataSet } from '@/service/api/device'
import { formatApiResponse } from '../utils/api-helpers'
import type { ApiType, PollingConfig as PollingConfigType } from '../types/api-types'

interface Props {
  modelValue?: Record<string, any>
  apiType?: ApiType
}

interface Emits {
  'update:modelValue': [value: Record<string, any>]
  'data-fetched': [data: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const baseFormRef = ref<any>(null)
const selectedApiType = ref<ApiType>(props.apiType || 'event_dataset')
const formData = ref<Record<string, any>>({
  deviceId: '',
  ...props.modelValue
})

const pollingConfig = ref<PollingConfigType>({
  enabled: false,
  interval: 5000,
  status: 'stopped'
})

// API类型选项
const apiTypeOptions = [{ label: '事件数据集', value: 'event_dataset' }]

// 表单验证规则
const formRules = computed(() => {
  return {
    deviceId: [{ required: true, message: '请选择设备', trigger: 'change' }]
  }
})

// 计算属性
const canSubmit = computed(() => {
  return !!formData.value.deviceId
})

const supportsPolling = computed(() => {
  // 事件数据API支持轮询
  return true
})

// 事件处理
const onApiTypeChange = (apiType: ApiType) => {
  selectedApiType.value = apiType
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
  const { deviceId } = data

  switch (selectedApiType.value) {
    case 'event_dataset':
      return await getEventDataSet({ device_id: deviceId })

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

    // 触发数据获取事件
    emit('data-fetched', formattedData)

    console.log('事件数据API调用成功:', formattedData)
  } catch (error) {
    console.error('事件数据API调用失败:', error)
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

// 监听API类型变化
watch(
  () => props.apiType,
  newApiType => {
    if (newApiType) {
      selectedApiType.value = newApiType
    }
  }
)
</script>

<style scoped>
.event-api-form {
  width: 100%;
}
</style>
