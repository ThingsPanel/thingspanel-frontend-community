<template>
  <div class="attributes-api-form">
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

        <!-- 指定键值参数 -->
        <template v-if="selectedApiType === 'attributes_key'">
          <n-form-item label="属性键" required>
            <n-input
              v-model:value="formData.key"
              placeholder="输入属性键"
              @update:value="value => updateForm('key', value)"
            />
          </n-form-item>
        </template>

        <!-- 发布参数 -->
        <template v-if="selectedApiType === 'attributes_pub'">
          <n-form-item label="属性键" required>
            <n-input
              v-model:value="formData.key"
              placeholder="输入属性键"
              @update:value="value => updateForm('key', value)"
            />
          </n-form-item>

          <n-form-item label="属性值" required>
            <n-input
              v-model:value="formData.value"
              placeholder="输入属性值"
              @update:value="value => updateForm('value', value)"
            />
            <template #feedback>
              <span class="form-tip">支持字符串、数字、布尔值等</span>
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
  getAttributeDataSet,
  getAttributeDatasKey,
  attributeDataPub,
  getAttributeDataSetLogs
} from '@/service/api/device'
import { formatApiResponse } from '../utils/api-helpers'
import { ApiType } from '../types/api-types'
import type { PollingConfig as PollingConfigType } from '../types/api-types'

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
const selectedApiType = ref<ApiType>(props.apiType || 'attributes_dataset')
const formData = ref<Record<string, any>>({
  deviceId: '',
  key: '',
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
  { label: '获取数据集', value: 'attributes_dataset' },
  { label: '获取指定键值', value: 'attributes_key' },
  { label: '发布属性', value: 'attributes_pub' },
  { label: '查看日志', value: 'attributes_logs' }
]

// 表单验证规则
const formRules = computed(() => {
  const rules: any = {
    deviceId: [{ required: true, message: '请选择设备', trigger: 'change' }]
  }

  switch (selectedApiType.value) {
    case 'attributes_key':
      rules.key = [{ required: true, message: '请输入属性键', trigger: 'blur' }]
      break
    case 'attributes_pub':
      rules.key = [{ required: true, message: '请输入属性键', trigger: 'blur' }]
      rules.value = [{ required: true, message: '请输入属性值', trigger: 'blur' }]
      break
  }

  return rules
})

// 计算属性
const canSubmit = computed(() => {
  if (!formData.value.deviceId) return false

  switch (selectedApiType.value) {
    case 'attributes_dataset':
    case 'attributes_logs':
      return true
    case 'attributes_key':
      return !!formData.value.key
    case 'attributes_pub':
      return !!(formData.value.key && formData.value.value)
    default:
      return false
  }
})

const supportsPolling = computed(() => {
  // 只有获取数据的API支持轮询，发布数据不支持
  return selectedApiType.value !== 'attributes_pub'
})

// 事件处理
const onApiTypeChange = (apiType: ApiType) => {
  selectedApiType.value = apiType
  // 重置相关字段
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
    case 'attributes_dataset':
      return await getAttributeDataSet({ device_id: deviceId })

    case 'attributes_key':
      return await getAttributeDatasKey({
        device_id: deviceId,
        key: params.key
      })

    case 'attributes_pub':
      return await attributeDataPub({
        device_id: deviceId,
        key: params.key,
        value: params.value
      })

    case 'attributes_logs':
      return await getAttributeDataSetLogs({ device_id: deviceId })

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

    console.log('属性数据API调用成功:', formattedData)
  } catch (error) {
    console.error('属性数据API调用失败:', error)
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
.attributes-api-form {
  width: 100%;
}

.form-tip {
  font-size: 12px;
  color: #666;
}
</style>
