<template>
  <div class="api-tester">
    <n-card title="API测试" size="small">
      <template #header-extra>
        <n-tag :type="getStatusTagType()" size="small">
          {{ testStatus }}
        </n-tag>
      </template>

      <div class="tester-content">
        <div class="test-info">
          <div class="api-info-line">
            <span class="info-label">接口类型：</span>
            <span class="info-value">{{ getApiLabel() }}</span>
          </div>
          <div class="api-info-line">
            <span class="info-label">请求参数：</span>
            <span class="info-value">{{ getParametersText() }}</span>
          </div>
        </div>

        <div class="test-actions">
          <n-button type="primary" :loading="testing" :disabled="!canTest" @click="testApi">
            {{ testing ? '测试中...' : '测试API' }}
          </n-button>

          <n-button v-if="lastTestResult" text @click="clearResult">清除结果</n-button>
        </div>

        <!-- 测试结果 -->
        <div v-if="lastTestResult" class="test-result">
          <n-divider title-placement="left">测试结果</n-divider>

          <div class="result-header">
            <span class="result-status" :class="{ success: testSuccess, error: !testSuccess }">
              {{ testSuccess ? '✓ 测试成功' : '✗ 测试失败' }}
            </span>
            <span class="result-time">{{ testTime }}</span>
          </div>

          <div class="result-content">
            <pre v-if="testSuccess">{{ JSON.stringify(lastTestResult, null, 2) }}</pre>
            <div v-else class="error-message">
              <div class="error-title">错误信息：</div>
              <div class="error-detail">{{ errorMessage }}</div>
            </div>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NButton, NTag, NDivider } from 'naive-ui'
// 导入设备API函数
import {
  telemetryDataCurrentKeys,
  telemetryDataHistoryList,
  getAttributeDataSet,
  getAttributeDatasKey,
  telemetryDataPub,
  attributeDataPub,
  commandDataPub
} from '@/service/api/device'

interface Props {
  apiType?: string
  parameters?: Record<string, any>
}

interface Emits {
  'test-success': [data: any]
  'test-error': [error: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const testing = ref(false)
const testStatus = ref('等待测试')
const lastTestResult = ref<any>(null)
const testSuccess = ref(false)
const errorMessage = ref('')
const testTime = ref('')

// API类型标签映射
const apiLabels = {
  telemetryDataCurrentKeys: '遥测当前值',
  telemetryDataHistoryList: '遥测历史数据',
  getAttributeDataSet: '属性数据集',
  getAttributeDatasKey: '指定属性值',
  telemetryDataPub: '发送遥测数据',
  attributeDataPub: '发送属性数据',
  commandDataPub: '发送命令数据'
}

// 计算能否测试
const canTest = computed(() => {
  if (!props.apiType || !props.parameters) return false

  const params = props.parameters
  // 根据不同API类型检查必需参数
  switch (props.apiType) {
    case 'telemetryDataCurrentKeys':
      return params.device_id && params.keys
    case 'telemetryDataHistoryList':
      return params.device_id && params.key && params.time_range && params.aggregate_function && params.aggregate_window
    case 'getAttributeDataSet':
      return params.device_id
    case 'getAttributeDatasKey':
      return params.device_id && params.key
    case 'telemetryDataPub':
    case 'attributeDataPub':
    case 'commandDataPub':
      return params.device_id && params.key && params.value !== undefined && params.value !== ''
    default:
      return false
  }
})

// 获取API标签
const getApiLabel = () => {
  return apiLabels[props.apiType] || props.apiType || '未知'
}

// 获取参数文本
const getParametersText = () => {
  if (!props.parameters) return '无参数'

  const params = Object.entries(props.parameters)
    .filter(([key, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')

  return params || '参数不完整'
}

// 获取状态标签类型
const getStatusTagType = () => {
  switch (testStatus.value) {
    case '测试成功':
      return 'success'
    case '测试失败':
      return 'error'
    case '测试中...':
      return 'warning'
    default:
      return 'default'
  }
}

// 测试API
const testApi = async () => {
  if (!props.apiType || !props.parameters) return

  try {
    testing.value = true
    testStatus.value = '测试中...'

    console.log('🔧 ApiTester - 开始测试API:', props.apiType, props.parameters)

    let result: any = null

    // 根据API类型调用对应的函数
    switch (props.apiType) {
      case 'telemetryDataCurrentKeys':
        result = await telemetryDataCurrentKeys({
          device_id: props.parameters.device_id,
          keys: props.parameters.keys
        })
        break

      case 'telemetryDataHistoryList':
        result = await telemetryDataHistoryList({
          device_id: props.parameters.device_id,
          key: props.parameters.key,
          time_range: props.parameters.time_range,
          aggregate_function: props.parameters.aggregate_function,
          aggregate_window: props.parameters.aggregate_window
        })
        break

      case 'getAttributeDataSet':
        result = await getAttributeDataSet({
          device_id: props.parameters.device_id
        })
        break

      case 'getAttributeDatasKey':
        result = await getAttributeDatasKey({
          device_id: props.parameters.device_id,
          key: props.parameters.key
        })
        break

      case 'telemetryDataPub':
        result = await telemetryDataPub({
          device_id: props.parameters.device_id,
          key: props.parameters.key,
          value: props.parameters.value
        })
        break

      case 'attributeDataPub':
        result = await attributeDataPub({
          device_id: props.parameters.device_id,
          key: props.parameters.key,
          value: props.parameters.value
        })
        break

      case 'commandDataPub':
        result = await commandDataPub({
          device_id: props.parameters.device_id,
          key: props.parameters.key,
          value: props.parameters.value
        })
        break

      default:
        throw new Error(`不支持的API类型: ${props.apiType}`)
    }

    // 测试成功
    lastTestResult.value = result
    testSuccess.value = true
    testStatus.value = '测试成功'
    testTime.value = new Date().toLocaleTimeString()
    errorMessage.value = ''

    console.log('🔧 ApiTester - API测试成功:', result)
    emit('test-success', result)
  } catch (error: any) {
    // 测试失败
    console.error('🔧 ApiTester - API测试失败:', error)

    lastTestResult.value = null
    testSuccess.value = false
    testStatus.value = '测试失败'
    testTime.value = new Date().toLocaleTimeString()
    errorMessage.value = error.message || error.toString() || '未知错误'

    emit('test-error', error)
  } finally {
    testing.value = false
  }
}

// 清除结果
const clearResult = () => {
  lastTestResult.value = null
  testSuccess.value = false
  testStatus.value = '等待测试'
  errorMessage.value = ''
  testTime.value = ''
}
</script>

<style scoped>
.api-tester {
  margin-top: 16px;
}

.tester-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-info-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.info-value {
  color: #666;
  font-family: 'Courier New', monospace;
  background: #f8fafc;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.test-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.test-result {
  margin-top: 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-status {
  font-weight: 500;
}

.result-status.success {
  color: #059669;
}

.result-status.error {
  color: #dc2626;
}

.result-time {
  font-size: 12px;
  color: #888;
}

.result-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.result-content pre {
  margin: 0;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-message {
  color: #dc2626;
}

.error-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.error-detail {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #fef2f2;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #fecaca;
}
</style>
