<template>
  <div class="http-data-source-config">
    <n-form :model="config" label-placement="left" label-width="auto">
      <!-- 请求方法 -->
      <n-form-item label="请求方法">
        <n-select
          v-model:value="config.method"
          :options="methodOptions"
          placeholder="选择请求方法"
          @update:value="updateConfig"
        />
      </n-form-item>

      <!-- URL -->
      <n-form-item label="请求地址">
        <n-input v-model:value="config.url" placeholder="请输入完整的 URL" @update:value="updateConfig" />
      </n-form-item>

      <!-- 请求头 -->
      <n-form-item label="请求头">
        <div class="headers-container">
          <div v-for="(header, index) in config.headers" :key="index" class="header-item">
            <n-input
              v-model:value="header.key"
              placeholder="Header 名称"
              style="width: 40%"
              @update:value="updateConfig"
            />
            <n-input
              v-model:value="header.value"
              placeholder="Header 值"
              style="width: 40%"
              @update:value="updateConfig"
            />
            <n-button size="small" style="width: 15%" @click="removeHeader(index)">删除</n-button>
          </div>
          <n-button size="small" @click="addHeader">添加请求头</n-button>
        </div>
      </n-form-item>

      <!-- 请求体 (POST) -->
      <n-form-item v-if="config.method === 'POST'" label="请求体">
        <n-input
          v-model:value="config.body"
          type="textarea"
          placeholder="请输入 JSON 格式的请求体"
          :rows="4"
          @update:value="updateConfig"
        />
      </n-form-item>

      <!-- 刷新间隔 -->
      <n-form-item label="刷新间隔 (秒)">
        <n-input-number
          v-model:value="config.refreshInterval"
          :min="0"
          :max="3600"
          placeholder="0 表示不自动刷新"
          @update:value="updateConfig"
        />
      </n-form-item>

      <!-- 测试按钮 -->
      <n-form-item>
        <n-button type="primary" :loading="isTesting" @click="testRequest">测试请求</n-button>
      </n-form-item>
    </n-form>

    <!-- 测试结果 -->
    <div v-if="testResult" class="test-result">
      <h4>测试结果:</h4>
      <n-alert
        :type="testResult.success ? 'success' : 'error'"
        :title="testResult.success ? '请求成功' : '请求失败'"
        :description="testResult.message"
      />
      <div v-if="testResult.data" class="response-data">
        <h5>响应数据:</h5>
        <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
      </div>
    </div>

    <!-- 数据预览 -->
    <div v-if="resolvedValue !== undefined" class="data-preview">
      <h4>数据预览:</h4>
      <n-alert type="info" title="解析结果">
        <template #description>
          <div>当前路径: {{ config.dataPath || '根数据' }}</div>
          <div>解析值: {{ resolvedValue }}</div>
        </template>
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NInputNumber, NButton, NAlert } from 'naive-ui'
import type { HttpDataSource } from '../../types/data-source'
import { dataPathResolver } from '../../utils/data-path-resolver'

interface Props {
  modelValue: HttpDataSource
}

interface Emits {
  (e: 'update:modelValue', value: HttpDataSource): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 配置数据
const config = ref<HttpDataSource>({
  type: 'http',
  name: 'HTTP数据源',
  enabled: true,
  method: 'GET',
  url: '',
  headers: [],
  body: '',
  refreshInterval: 0,
  dataPath: '',
  ...props.modelValue
})

// 测试状态
const isTesting = ref(false)
const testResult = ref<{
  success: boolean
  message: string
  data?: any
} | null>(null)

// 请求方法选项
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
]

// 解析值
const resolvedValue = computed(() => {
  if (!testResult.value?.data) return undefined
  return dataPathResolver.resolve(testResult.value.data, config.value.dataPath)
})

// 更新配置
const updateConfig = () => {
  emit('update:modelValue', { ...config.value })
}

// 添加请求头
const addHeader = () => {
  config.value.headers.push({ key: '', value: '' })
  updateConfig()
}

// 删除请求头
const removeHeader = (index: number) => {
  config.value.headers.splice(index, 1)
  updateConfig()
}

// 测试请求
const testRequest = async () => {
  if (!config.value.url) {
    testResult.value = {
      success: false,
      message: '请输入请求地址'
    }
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    // 构建请求头
    const headers: Record<string, string> = {}
    config.value.headers.forEach(header => {
      if (header.key && header.value) {
        headers[header.key] = header.value
      }
    })

    // 构建请求选项
    const options: RequestInit = {
      method: config.value.method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    // 添加请求体
    if (config.value.method !== 'GET' && config.value.body) {
      try {
        options.body = JSON.stringify(JSON.parse(config.value.body))
      } catch (error) {
        testResult.value = {
          success: false,
          message: '请求体 JSON 格式错误'
        }
        return
      }
    }

    // 发起请求
    const response = await fetch(config.value.url, options)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    testResult.value = {
      success: true,
      message: `请求成功 (${response.status})`,
      data
    }

    console.log('🔧 HttpDataSourceConfig - 测试请求成功:', {
      url: config.value.url,
      method: config.value.method,
      data
    })
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '请求失败'
    }

    console.error('🔧 HttpDataSourceConfig - 测试请求失败:', error)
  } finally {
    isTesting.value = false
  }
}

// 监听配置变化
watch(
  () => props.modelValue,
  newValue => {
    config.value = { ...config.value, ...newValue }
  },
  { deep: true }
)
</script>

<style scoped>
.http-data-source-config {
  padding: 16px;
}

.headers-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.test-result {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fafafa;
}

.response-data {
  margin-top: 12px;
}

.response-data pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.data-preview {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
}
</style>
