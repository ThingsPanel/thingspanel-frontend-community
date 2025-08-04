<template>
  <div class="http-data-source-test">
    <h2>HTTP 数据源测试</h2>
    
    <n-card title="HTTP 数据源配置" class="config-card">
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

        <!-- HTTP 配置 -->
        <template v-if="dataSource.type === 'http'">
          <n-form-item label="请求方法">
            <n-select
              v-model:value="dataSource.method"
              :options="methodOptions"
              placeholder="选择请求方法"
            />
          </n-form-item>

          <n-form-item label="请求地址">
            <n-input
              v-model:value="dataSource.url"
              placeholder="请输入完整的 URL"
            />
          </n-form-item>

          <n-form-item label="请求头">
            <div class="headers-container">
              <div
                v-for="(header, index) in dataSource.headers"
                :key="index"
                class="header-item"
              >
                <n-input
                  v-model:value="header.key"
                  placeholder="Header 名称"
                  style="width: 40%"
                />
                <n-input
                  v-model:value="header.value"
                  placeholder="Header 值"
                  style="width: 40%"
                />
                <n-button
                  size="small"
                  style="width: 15%"
                  @click="removeHeader(index)"
                >
                  删除
                </n-button>
              </div>
              <n-button size="small" @click="addHeader">
                添加请求头
              </n-button>
            </div>
          </n-form-item>

          <n-form-item v-if="dataSource.method === 'POST'" label="请求体">
            <n-input
              v-model:value="dataSource.body"
              type="textarea"
              placeholder="请输入 JSON 格式的请求体"
              :rows="4"
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

        <!-- 数据路径 -->
        <n-form-item label="数据路径">
          <n-select
            v-model:value="dataSource.dataPath"
            :options="availablePaths"
            placeholder="选择数据路径"
            filterable
          />
        </n-form-item>

        <!-- 测试按钮 -->
        <n-form-item>
          <n-button
            type="primary"
            :loading="isTesting"
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
import { ref, computed, watch } from 'vue'
import { NCard, NForm, NFormItem, NInput, NSelect, NInputNumber, NButton, NSwitch, NAlert } from 'naive-ui'
import DigitIndicatorCard from '../../../card2.1/components/digit-indicator/DigitIndicatorCard.vue'
import type { HttpDataSource } from '../types/data-source'
import { DataSourceType } from '../types/data-source'
import { dataSourceManager } from '../core/data-source-manager'
import { dataPathResolver } from '../utils/data-path-resolver'

// 数据源配置
const dataSource = ref<HttpDataSource>({
  type: DataSourceType.HTTP,
  name: 'HTTP数据源',
  enabled: true,
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/posts/1',
  headers: [],
  body: '',
  refreshInterval: 0,
  dataPath: ''
})

// 测试状态
const isTesting = ref(false)
const testResult = ref<{
  success: boolean
  message: string
  data?: any
} | null>(null)

// 组件属性
const componentProps = ref({
  title: 'HTTP数据测试',
  unit: '',
  color: '#1890ff',
  fontSize: 24
})

// 数据源类型选项
const dataSourceTypeOptions = [
  {
    label: 'HTTP请求',
    value: DataSourceType.HTTP,
    description: '通过HTTP请求获取数据'
  }
]

// 请求方法选项
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
]

// 可用路径
const availablePaths = computed(() => {
  if (!testResult.value?.data) return []
  
  const paths = dataPathResolver.getAvailablePaths(testResult.value.data)
  return paths.map(path => ({
    label: path || '根数据',
    value: path
  }))
})

// 添加请求头
const addHeader = () => {
  dataSource.value.headers.push({ key: '', value: '' })
}

// 删除请求头
const removeHeader = (index: number) => {
  dataSource.value.headers.splice(index, 1)
}

// 测试数据源
const testDataSource = async () => {
  if (!dataSource.value.url) {
    testResult.value = {
      success: false,
      message: '请输入请求地址'
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
      message: '数据源测试成功',
      data: value.rawData
    }

    console.log('🔧 HttpDataSourceTest - 测试成功:', {
      value: value.value,
      rawData: value.rawData,
      metadata: value.metadata
    })

  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '测试失败'
    }
    
    console.error('🔧 HttpDataSourceTest - 测试失败:', error)
  } finally {
    isTesting.value = false
  }
}

// 监听数据路径变化
watch(() => dataSource.value.dataPath, (newPath) => {
  if (testResult.value?.data) {
    const resolvedValue = dataPathResolver.resolve(testResult.value.data, newPath)
    console.log('🔧 HttpDataSourceTest - 数据路径变化:', {
      path: newPath,
      resolvedValue
    })
  }
})
</script>

<style scoped>
.http-data-source-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.config-card,
.result-card,
.preview-card {
  margin-bottom: 20px;
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