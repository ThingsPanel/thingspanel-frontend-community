<template>
  <div class="config-driven-data-source-test">
    <div class="demo-header">
      <n-icon><SettingsOutline /></n-icon>
      <span>配置驱动数据源测试</span>
      <n-tag size="small" :type="hasConfiguration ? 'success' : 'default'">
        {{ hasConfiguration ? '已配置' : '未配置' }}
      </n-tag>
    </div>

    <div class="demo-content">
      <!-- 配置状态显示 -->
      <div v-if="hasConfiguration" class="config-display">
        <n-space vertical :size="16">
          <!-- 数据源配置信息 -->
          <n-card size="small" title="数据源配置">
            <n-space vertical :size="8">
              <div class="config-item">
                <span class="label">配置的数据源数量:</span>
                <n-tag type="info">{{ configuredDataSources.length }}</n-tag>
              </div>
              <div v-for="(dataSource, index) in configuredDataSources" :key="index" class="data-source-item">
                <n-card size="small" :title="`数据源 ${index + 1}: ${dataSource.key}`">
                  <div class="data-source-content">
                    <div class="data-source-meta">
                      <span class="meta-label">类型:</span>
                      <n-tag size="small">{{ dataSource.type || 'JSON' }}</n-tag>
                    </div>
                    <div v-if="dataSource.data" class="data-preview">
                      <span class="meta-label">数据预览:</span>
                      <n-code
                        :code="formatDataPreview(dataSource.data)"
                        language="json"
                        :show-line-numbers="false"
                        style="max-height: 100px; overflow-y: auto; font-size: 11px"
                      />
                    </div>
                  </div>
                </n-card>
              </div>
            </n-space>
          </n-card>

          <!-- 动态配置测试 -->
          <n-card size="small" title="动态配置测试">
            <n-space vertical :size="12">
              <div class="test-item">
                <n-text strong>测试按钮示例</n-text>
                <n-space size="small">
                  <n-button size="small" @click="loadSampleConfiguration">加载示例配置</n-button>
                  <n-button size="small" @click="clearConfiguration">清除配置</n-button>
                  <n-button size="small" @click="refreshData">刷新数据</n-button>
                </n-space>
              </div>

              <!-- 测试结果展示 -->
              <div v-if="testResults.length > 0" class="test-results">
                <n-text strong>测试结果:</n-text>
                <div class="results-list">
                  <div v-for="(result, index) in testResults" :key="index" class="result-item">
                    <n-tag :type="result.type" size="small">{{ result.message }}</n-tag>
                    <n-text depth="3" style="font-size: 11px">{{ result.timestamp }}</n-text>
                  </div>
                </div>
              </div>
            </n-space>
          </n-card>
        </n-space>
      </div>

      <!-- 未配置状态 -->
      <div v-else class="no-config">
        <n-empty description="暂无配置数据" size="small">
          <template #extra>
            <n-space vertical align="center" :size="8">
              <n-text depth="3" style="font-size: 11px">💡 这是一个配置驱动数据源的测试组件</n-text>
              <n-button size="small" @click="loadSampleConfiguration">加载示例配置</n-button>
            </n-space>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 配置驱动数据源测试组件
 * 用于测试和展示配置驱动的数据源系统功能
 */

import { ref, computed, watch } from 'vue'
import { NIcon, NTag, NEmpty, NSpace, NCard, NText, NCode, NButton, useMessage } from 'naive-ui'
import { SettingsOutline } from '@vicons/ionicons5'

interface DataSourceConfig {
  key: string
  type?: string
  data?: any
  metadata?: Record<string, any>
}

interface TestResult {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  timestamp: string
}

interface Props {
  configuration?: {
    dataSources?: DataSourceConfig[]
    settings?: Record<string, any>
  }
}

const props = withDefaults(defineProps<Props>(), {
  configuration: undefined
})

const message = useMessage()
const testResults = ref<TestResult[]>([])
const internalConfiguration = ref<{
  dataSources?: DataSourceConfig[]
  settings?: Record<string, any>
}>({})

// 计算属性
const hasConfiguration = computed(() => {
  const config = props.configuration || internalConfiguration.value
  return config && config.dataSources && config.dataSources.length > 0
})

const configuredDataSources = computed(() => {
  const config = props.configuration || internalConfiguration.value
  return config?.dataSources || []
})

// 监听配置变化
watch(
  () => props.configuration,
  newConfig => {
    if (newConfig) {
      console.log('🔄 [ConfigDrivenDataSourceTest] 配置更新:', newConfig)
      addTestResult('info', '接收到新的配置数据')
    }
  },
  { deep: true }
)

// 工具方法
const formatDataPreview = (data: any): string => {
  try {
    if (typeof data === 'string') {
      // 如果是字符串，尝试解析为 JSON
      try {
        const parsed = JSON.parse(data)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return data
      }
    }
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return String(data)
  }
}

const addTestResult = (type: TestResult['type'], message: string) => {
  testResults.value.unshift({
    type,
    message,
    timestamp: new Date().toLocaleTimeString()
  })

  // 限制结果数量
  if (testResults.value.length > 10) {
    testResults.value = testResults.value.slice(0, 10)
  }
}

// 测试方法
const loadSampleConfiguration = () => {
  const sampleConfig = {
    dataSources: [
      {
        key: 'objectData',
        type: 'json',
        data: {
          name: '示例对象数据',
          value: 42,
          status: 'active',
          metadata: {
            createdAt: new Date().toISOString(),
            version: '1.0.0'
          }
        }
      },
      {
        key: 'arrayData',
        type: 'json',
        data: [
          { id: 1, name: '项目A', progress: 75 },
          { id: 2, name: '项目B', progress: 45 },
          { id: 3, name: '项目C', progress: 90 }
        ]
      }
    ],
    settings: {
      autoRefresh: true,
      refreshInterval: 5000,
      enableCache: true
    }
  }

  internalConfiguration.value = sampleConfig
  addTestResult('success', '示例配置加载成功')
  message.success('示例配置已加载')
}

const clearConfiguration = () => {
  internalConfiguration.value = {}
  testResults.value = []
  addTestResult('info', '配置已清除')
  message.info('配置已清除')
}

const refreshData = () => {
  addTestResult('info', '数据刷新请求')
  message.info('数据刷新完成')
}
</script>

<style scoped>
.config-driven-data-source-test {
  width: 100%;
  height: 100%;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.demo-content {
  flex: 1;
  overflow-y: auto;
}

.config-display {
  height: 100%;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label,
.meta-label {
  font-weight: 500;
  color: var(--text-color-2);
  min-width: 80px;
}

.data-source-item {
  width: 100%;
}

.data-source-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-source-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.data-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.test-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 150px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 8px;
  background: var(--hover-color);
  border-radius: 4px;
}

.no-config {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
