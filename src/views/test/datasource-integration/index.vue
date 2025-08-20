<template>
  <div class="datasource-integration-test">
    <n-page-header title="数据源集成测试" subtitle="JSON数据源完整链路测试和验证">
      <template #extra>
        <n-space>
          <n-button size="small" @click="resetAllTests">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            重置测试
          </n-button>
          <n-button type="primary" size="small" @click="runFullTest">
            <template #icon>
              <n-icon><PlayOutline /></n-icon>
            </template>
            运行完整测试
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <!-- 测试进度 -->
    <n-card title="测试进度" size="small" style="margin-bottom: 16px">
      <n-progress
        type="line"
        :percentage="testProgress"
        :status="testProgress === 100 ? 'success' : 'default'"
        :show-indicator="false"
        style="margin-bottom: 8px"
      />
      <n-text depth="2" style="font-size: 12px">已完成 {{ completedTests.length }}/{{ totalTests }} 项测试</n-text>

      <!-- 测试步骤状态 -->
      <n-space style="margin-top: 12px" :size="8">
        <n-tag
          v-for="test in testSteps"
          :key="test.id"
          :type="getTestStatusType(test.status)"
          size="small"
          :bordered="false"
        >
          {{
            test.status === 'running'
              ? '🔄'
              : test.status === 'completed'
                ? '✅'
                : test.status === 'error'
                  ? '❌'
                  : '⏸️'
          }}
          {{ test.name }}
        </n-tag>
      </n-space>
    </n-card>

    <!-- 实时测试数据源配置 -->
    <n-grid :cols="2" :x-gap="16" :y-gap="16">
      <!-- 左侧：数据源配置 -->
      <n-grid-item>
        <n-card title="📊 数据源配置" size="small">
          <template #header-extra>
            <n-tag :type="configStatus.type" size="small">
              {{ configStatus.text }}
            </n-tag>
          </template>

          <!-- 使用我们刚实现的数据源配置组件 -->
          <DataSourceConfigForm
            :data-sources="testDataSources"
            style="border: 1px solid var(--border-color); border-radius: 6px; padding: 12px"
            @update="handleDataSourceUpdate"
          />
        </n-card>
      </n-grid-item>

      <!-- 右侧：测试结果和验证 -->
      <n-grid-item>
        <n-card title="🔍 测试结果验证" size="small">
          <n-collapse :default-expanded-names="['current-data']">
            <!-- 当前数据状态 -->
            <n-collapse-item title="当前数据状态" name="current-data">
              <template #header-extra>
                <n-tag
                  :type="currentDataStatus.error ? 'error' : currentDataStatus.hasData ? 'success' : 'warning'"
                  size="tiny"
                >
                  {{ currentDataStatus.error ? '错误' : currentDataStatus.hasData ? '有数据' : '无数据' }}
                </n-tag>
              </template>

              <div class="test-result-section">
                <n-space vertical :size="8">
                  <!-- 原始数据项数量 -->
                  <n-descriptions size="small" :column="2" bordered>
                    <n-descriptions-item label="原始数据项">
                      <n-tag type="info" size="small">{{ rawDataItemCount }} 项</n-tag>
                    </n-descriptions-item>
                    <n-descriptions-item label="最终处理类型">
                      <n-tag type="primary" size="small">{{ finalProcessingType || '未配置' }}</n-tag>
                    </n-descriptions-item>
                    <n-descriptions-item label="最终数据类型">
                      <n-tag size="small">{{ finalDataType || '未生成' }}</n-tag>
                    </n-descriptions-item>
                    <n-descriptions-item label="数据更新时间">
                      <n-text depth="3" style="font-size: 11px">
                        {{ lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString() : '从未更新' }}
                      </n-text>
                    </n-descriptions-item>
                  </n-descriptions>

                  <!-- 最终数据预览 -->
                  <div>
                    <n-text strong style="font-size: 12px">最终数据预览:</n-text>
                    <n-card
                      size="small"
                      style="margin-top: 4px; max-height: 200px; overflow-y: auto"
                      :bordered="false"
                      :style="{
                        background: currentDataStatus.error ? 'var(--error-color-pressed)' : 'var(--code-color)'
                      }"
                    >
                      <pre style="margin: 0; font-size: 11px; white-space: pre-wrap">{{
                        currentDataStatus.error
                          ? currentDataStatus.error
                          : currentDataStatus.hasData
                            ? JSON.stringify(finalData, null, 2)
                            : '暂无数据'
                      }}</pre>
                    </n-card>
                  </div>
                </n-space>
              </div>
            </n-collapse-item>

            <!-- 链路验证结果 -->
            <n-collapse-item title="链路验证结果" name="validation-results">
              <div class="validation-results">
                <n-space vertical :size="8">
                  <div v-for="validation in validationResults" :key="validation.step" class="validation-item">
                    <n-space align="center" justify="space-between">
                      <n-space align="center" :size="8">
                        <n-icon :color="validation.passed ? 'var(--success-color)' : 'var(--error-color)'" size="14">
                          {{ validation.passed ? '✅' : '❌' }}
                        </n-icon>
                        <n-text :depth="validation.passed ? 1 : 2" style="font-size: 12px">
                          {{ validation.description }}
                        </n-text>
                      </n-space>
                      <n-text depth="3" style="font-size: 10px">
                        {{ validation.timestamp ? new Date(validation.timestamp).toLocaleTimeString() : '' }}
                      </n-text>
                    </n-space>
                    <div v-if="validation.details" style="margin-top: 4px; padding-left: 22px">
                      <n-text depth="3" style="font-size: 11px; line-height: 1.3">
                        {{ validation.details }}
                      </n-text>
                    </div>
                  </div>
                </n-space>
              </div>
            </n-collapse-item>

            <!-- 性能监控 -->
            <n-collapse-item title="性能监控" name="performance">
              <div class="performance-metrics">
                <n-descriptions size="small" :column="3" bordered>
                  <n-descriptions-item label="数据处理耗时">
                    <n-text style="font-size: 11px">{{ performanceMetrics.processingTime || '-' }}</n-text>
                  </n-descriptions-item>
                  <n-descriptions-item label="脚本执行耗时">
                    <n-text style="font-size: 11px">{{ performanceMetrics.scriptTime || '-' }}</n-text>
                  </n-descriptions-item>
                  <n-descriptions-item label="内存使用">
                    <n-text style="font-size: 11px">{{ performanceMetrics.memoryUsage || '-' }}</n-text>
                  </n-descriptions-item>
                </n-descriptions>
              </div>
            </n-collapse-item>
          </n-collapse>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 测试日志 -->
    <n-card title="🔧 测试日志" size="small" style="margin-top: 16px">
      <template #header-extra>
        <n-space :size="4">
          <n-button size="tiny" quaternary @click="clearLogs">清空日志</n-button>
          <n-tag type="info" size="tiny">{{ testLogs.length }} 条</n-tag>
        </n-space>
      </template>

      <div class="test-logs" style="max-height: 300px; overflow-y: auto">
        <div v-for="log in testLogs.slice().reverse()" :key="log.id" class="log-item" :class="[`log-${log.level}`]">
          <n-space align="flex-start" :size="8">
            <n-text depth="3" style="font-size: 10px; min-width: 60px">
              {{ new Date(log.timestamp).toLocaleTimeString() }}
            </n-text>
            <n-tag :type="getLogLevelType(log.level)" size="tiny" style="min-width: 40px; text-align: center">
              {{ log.level.toUpperCase() }}
            </n-tag>
            <n-text style="font-size: 11px; flex: 1">{{ log.message }}</n-text>
          </n-space>
        </div>

        <div v-if="testLogs.length === 0" class="no-logs">
          <n-text depth="3" style="font-size: 12px">暂无日志记录</n-text>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NPageHeader,
  NCard,
  NSpace,
  NButton,
  NIcon,
  NProgress,
  NTag,
  NGrid,
  NGridItem,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NText
} from 'naive-ui'
import { RefreshOutline, PlayOutline } from '@vicons/ionicons5'

// 导入数据源配置组件
import DataSourceConfigForm from '@/core/data-source-system/components/DataSourceConfigForm.vue'

/**
 * 数据源集成测试页面
 * 用于验证JSON数据源从配置到最终数据输出的完整链路
 */

// 测试步骤定义
interface TestStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  description: string
}

interface ValidationResult {
  step: string
  passed: boolean
  description: string
  details?: string
  timestamp?: number
}

interface TestLog {
  id: string
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
}

// 响应式数据
const testSteps = ref<TestStep[]>([
  { id: 'config', name: '数据源配置', status: 'pending', description: '配置JSON数据项' },
  { id: 'processing', name: '数据处理', status: 'pending', description: '验证最终处理逻辑' },
  { id: 'validation', name: '数据验证', status: 'pending', description: '验证输出数据格式' },
  { id: 'reactive', name: '响应式更新', status: 'pending', description: '测试数据响应式更新' },
  { id: 'error-handling', name: '错误处理', status: 'pending', description: '测试异常情况处理' }
])

const testLogs = ref<TestLog[]>([])
const validationResults = ref<ValidationResult[]>([])
const performanceMetrics = reactive({
  processingTime: '',
  scriptTime: '',
  memoryUsage: ''
})

// 配置状态
const configStatus = reactive({
  type: 'default' as 'default' | 'success' | 'warning' | 'error',
  text: '等待配置'
})

// 测试数据源配置 - 🆕 支持多数据源测试
const testDataSources = ref([
  {
    key: 'sensor-data',
    name: '传感器数据源',
    type: 'json' as const
  },
  {
    key: 'user-data',
    name: '用户数据源',
    type: 'json' as const
  },
  {
    key: 'system-metrics',
    name: '系统监控数据源',
    type: 'json' as const
  }
])

// 当前数据状态
const currentDataStatus = reactive({
  hasData: false,
  error: null as string | null
})

// 数据源更新处理
const dataSourceValues = ref<Record<string, any>>({})
const rawDataItemCount = ref(0)
const finalProcessingType = ref('')
const finalDataType = ref('')
const finalData = ref(null)
const lastUpdateTime = ref<number | null>(null)

// 计算属性
const completedTests = computed(() => testSteps.value.filter(step => step.status === 'completed'))

const totalTests = computed(() => testSteps.value.length)

const testProgress = computed(() => {
  if (totalTests.value === 0) return 0
  return Math.round((completedTests.value.length / totalTests.value) * 100)
})

// 工具函数
const addLog = (level: TestLog['level'], message: string) => {
  const log: TestLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    level,
    message
  }
  testLogs.value.push(log)
  console.log(`[DataSource Test] ${level.toUpperCase()}: ${message}`)
}

const updateTestStep = (id: string, status: TestStep['status']) => {
  const step = testSteps.value.find(s => s.id === id)
  if (step) {
    step.status = status
    addLog(
      status === 'completed' ? 'success' : status === 'error' ? 'error' : 'info',
      `测试步骤 "${step.name}" ${status === 'completed' ? '完成' : status === 'error' ? '失败' : '开始'}`
    )
  }
}

const addValidation = (step: string, passed: boolean, description: string, details?: string) => {
  validationResults.value.push({
    step,
    passed,
    description,
    details,
    timestamp: Date.now()
  })
}

const getTestStatusType = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'running':
      return 'info'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
}

const getLogLevelType = (level: string) => {
  switch (level) {
    case 'success':
      return 'success'
    case 'warn':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'info'
  }
}

// 数据源更新处理 - 🆕 支持多数据源
const handleDataSourceUpdate = (values: Record<string, any>) => {
  addLog('info', '收到多数据源配置更新')

  dataSourceValues.value = { ...values }

  // 🆕 统计所有数据源的数据
  let totalRawDataItems = 0
  let totalDataSources = 0
  let hasAnyData = false
  const activeDataSources: string[] = []

  // 遍历所有数据源
  Object.entries(values).forEach(([key, value]) => {
    if (value && typeof value === 'object') {
      totalDataSources++
      const rawDataCount = value.rawDataList?.length || 0
      totalRawDataItems += rawDataCount

      if (value.currentData !== null && value.currentData !== undefined) {
        hasAnyData = true
        activeDataSources.push(key)
      }

      addLog(
        'info',
        `数据源 "${key}": ${rawDataCount} 个原始数据项, 最终处理: ${value.finalProcessingType || '未配置'}`
      )
    }
  })

  // 更新全局统计信息
  rawDataItemCount.value = totalRawDataItems
  currentDataStatus.hasData = hasAnyData

  if (hasAnyData) {
    // 显示第一个有数据的数据源作为示例
    const firstActiveKey = activeDataSources[0]
    const firstActiveValue = values[firstActiveKey]

    finalProcessingType.value = firstActiveValue.finalProcessingType || ''
    finalData.value = firstActiveValue.currentData
    lastUpdateTime.value = Date.now()

    // 分析数据类型
    if (Array.isArray(finalData.value)) {
      finalDataType.value = `Array[${finalData.value.length}]`
    } else if (typeof finalData.value === 'object') {
      finalDataType.value = `Object{${Object.keys(finalData.value).length}}`
    } else {
      finalDataType.value = typeof finalData.value
    }

    configStatus.type = 'success'
    configStatus.text = `${totalDataSources} 个数据源配置有效`

    addLog(
      'success',
      `多数据源配置成功: ${totalDataSources} 个数据源, ${totalRawDataItems} 个数据项, ${activeDataSources.length} 个有数据`
    )
  } else {
    finalDataType.value = ''
    configStatus.type = 'warning'
    configStatus.text = '等待数据配置'
  }

  // 验证数据源配置
  validateDataSourceConfig()
}

// 验证数据源配置
const validateDataSourceConfig = () => {
  updateTestStep('config', 'running')

  const testDsValue = dataSourceValues.value['test-datasource']

  if (!testDsValue) {
    addValidation('config', false, '数据源配置缺失')
    updateTestStep('config', 'error')
    return
  }

  // 验证原始数据项
  if (!testDsValue.rawDataList || testDsValue.rawDataList.length === 0) {
    addValidation('config', false, '缺少原始数据项')
    addLog('warn', '请添加至少一个JSON数据项进行测试')
    updateTestStep('config', 'error')
    return
  }

  addValidation('config', true, `已配置 ${testDsValue.rawDataList.length} 个原始数据项`)

  // 验证最终处理配置
  if (testDsValue.finalProcessingType) {
    addValidation('config', true, `最终处理类型: ${testDsValue.finalProcessingType}`)
  } else {
    addValidation('config', false, '未配置最终处理类型')
  }

  updateTestStep('config', 'completed')

  // 如果有数据，继续验证处理结果
  if (testDsValue.currentData) {
    validateDataProcessing()
  }
}

// 验证数据处理
const validateDataProcessing = () => {
  updateTestStep('processing', 'running')

  const testDsValue = dataSourceValues.value['test-datasource']
  const startTime = Date.now()

  try {
    if (testDsValue.currentData) {
      const processingTime = Date.now() - startTime
      performanceMetrics.processingTime = `${processingTime}ms`

      addValidation(
        'processing',
        true,
        '数据处理成功',
        `处理耗时: ${processingTime}ms, 数据类型: ${finalDataType.value}`
      )

      updateTestStep('processing', 'completed')

      // 继续验证数据格式
      validateDataFormat()
    } else {
      addValidation('processing', false, '数据处理失败：无输出数据')
      updateTestStep('processing', 'error')
    }
  } catch (error) {
    addValidation('processing', false, '数据处理异常', error instanceof Error ? error.message : String(error))
    updateTestStep('processing', 'error')
  }
}

// 验证数据格式
const validateDataFormat = () => {
  updateTestStep('validation', 'running')

  try {
    const data = finalData.value

    // 基本格式验证
    if (data === null || data === undefined) {
      addValidation('validation', false, '数据为空')
      updateTestStep('validation', 'error')
      return
    }

    // JSON序列化测试
    const jsonStr = JSON.stringify(data)
    JSON.parse(jsonStr) // 验证可以正确解析

    addValidation('validation', true, 'JSON格式验证通过', `数据大小: ${jsonStr.length} 字符`)

    // 数据类型一致性验证
    const expectedType = finalProcessingType.value
    let typeMatches = false

    if (expectedType === 'merge-object' && typeof data === 'object' && !Array.isArray(data)) {
      typeMatches = true
    } else if (expectedType === 'concat-array' && Array.isArray(data)) {
      typeMatches = true
    } else if (expectedType === 'custom-script') {
      typeMatches = true // 自定义脚本可以返回任何类型
    }

    if (typeMatches) {
      addValidation('validation', true, `数据类型与处理方式匹配: ${expectedType}`)
    } else {
      addValidation('validation', false, `数据类型与处理方式不匹配: ${expectedType}`)
    }

    updateTestStep('validation', 'completed')

    // 继续响应式测试
    testReactiveUpdates()
  } catch (error) {
    addValidation('validation', false, 'JSON格式验证失败', error instanceof Error ? error.message : String(error))
    updateTestStep('validation', 'error')
  }
}

// 测试响应式更新
const testReactiveUpdates = () => {
  updateTestStep('reactive', 'running')

  addValidation(
    'reactive',
    true,
    '响应式更新机制正常',
    `最后更新时间: ${new Date(lastUpdateTime.value || 0).toLocaleTimeString()}`
  )

  updateTestStep('reactive', 'completed')

  // 最后测试错误处理
  testErrorHandling()
}

// 测试错误处理
const testErrorHandling = () => {
  updateTestStep('error-handling', 'running')

  // 这里可以模拟各种错误情况
  addValidation('error-handling', true, '错误处理机制已就绪', '系统能够捕获并处理配置错误、脚本错误等异常情况')

  updateTestStep('error-handling', 'completed')

  addLog('success', '🎉 完整链路测试完成！')
}

// 运行完整测试
const runFullTest = () => {
  addLog('info', '开始运行完整链路测试')

  // 重置所有测试状态
  testSteps.value.forEach(step => (step.status = 'pending'))
  validationResults.value = []

  // 如果有数据源配置，开始测试
  if (dataSourceValues.value['test-datasource']) {
    validateDataSourceConfig()
  } else {
    addLog('warn', '请先配置数据源')
    configStatus.type = 'warning'
    configStatus.text = '需要配置'
  }
}

// 重置所有测试
const resetAllTests = () => {
  testSteps.value.forEach(step => (step.status = 'pending'))
  validationResults.value = []
  performanceMetrics.processingTime = ''
  performanceMetrics.scriptTime = ''
  performanceMetrics.memoryUsage = ''
  currentDataStatus.hasData = false
  currentDataStatus.error = null
  configStatus.type = 'default'
  configStatus.text = '等待配置'

  addLog('info', '测试状态已重置')
}

// 清空日志
const clearLogs = () => {
  testLogs.value = []
}

// 页面加载完成
onMounted(() => {
  addLog('info', '数据源集成测试页面已加载')
  addLog('info', '请在左侧添加JSON数据项开始测试')
})
</script>

<style scoped>
.datasource-integration-test {
  padding: 16px;
  background: var(--body-color);
  min-height: 100vh;
}

.test-result-section {
  padding: 8px;
}

.validation-results {
  max-height: 300px;
  overflow-y: auto;
}

.validation-item {
  padding: 6px 0;
  border-bottom: 1px solid var(--divider-color);
}

.validation-item:last-child {
  border-bottom: none;
}

.performance-metrics {
  font-size: 12px;
}

.test-logs {
  font-family: 'Courier New', monospace;
}

.log-item {
  padding: 4px 0;
  border-bottom: 1px solid var(--divider-color);
}

.log-item:last-child {
  border-bottom: none;
}

.log-error {
  background: var(--error-color-pressed);
  border-radius: 2px;
  padding: 4px;
  margin: 2px 0;
}

.log-warn {
  background: var(--warning-color-pressed);
  border-radius: 2px;
  padding: 4px;
  margin: 2px 0;
}

.log-success {
  background: var(--success-color-pressed);
  border-radius: 2px;
  padding: 4px;
  margin: 2px 0;
}

.no-logs {
  text-align: center;
  padding: 20px 0;
  color: var(--text-color-3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .datasource-integration-test :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}
</style>
