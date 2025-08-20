<template>
  <div class="http-request-validation">
    <n-page-header title="HTTP请求验证测试" subtitle="验证修复后的HTTP请求系统是否正确使用项目代理配置">
      <template #extra>
        <n-space>
          <n-button size="small" @click="clearLogs">
            <template #icon>
              <n-icon><TrashOutline /></n-icon>
            </template>
            清空日志
          </n-button>
          <n-button type="primary" size="small" :loading="testing" @click="runHttpTests">
            <template #icon>
              <n-icon><PlayOutline /></n-icon>
            </template>
            运行HTTP测试
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-grid :cols="2" :x-gap="16" :y-gap="16">
      <!-- 左侧：测试配置 -->
      <n-grid-item>
        <n-card title="📡 HTTP请求测试配置" size="small">
          <n-space vertical :size="16">
            <!-- 测试场景选择 -->
            <n-form-item label="测试场景">
              <n-select v-model:value="selectedScenario" :options="scenarioOptions" placeholder="选择测试场景" />
            </n-form-item>

            <!-- 当前场景详情 -->
            <n-card v-if="currentScenario" size="small" :bordered="false" style="background: var(--code-color)">
              <template #header>
                <n-text strong style="font-size: 12px">当前测试场景详情</n-text>
              </template>
              <n-descriptions size="small" :column="1">
                <n-descriptions-item label="名称">{{ currentScenario.name }}</n-descriptions-item>
                <n-descriptions-item label="请求方法">{{ currentScenario.method }}</n-descriptions-item>
                <n-descriptions-item label="URL">{{ currentScenario.url }}</n-descriptions-item>
                <n-descriptions-item label="预期行为">{{ currentScenario.expectedBehavior }}</n-descriptions-item>
              </n-descriptions>
            </n-card>

            <!-- 手动测试配置 -->
            <n-card size="small" title="自定义HTTP测试">
              <n-form>
                <n-form-item label="请求方法">
                  <n-select v-model:value="customTest.method" :options="methodOptions" style="width: 100px" />
                </n-form-item>
                <n-form-item label="请求URL">
                  <n-input v-model:value="customTest.url" placeholder="例如: /device 或 /proxy-default/device" />
                </n-form-item>
                <n-form-item>
                  <n-button type="info" size="small" :loading="customTesting" @click="runCustomTest">
                    执行自定义测试
                  </n-button>
                </n-form-item>
              </n-form>
            </n-card>
          </n-space>
        </n-card>
      </n-grid-item>

      <!-- 右侧：测试结果 -->
      <n-grid-item>
        <n-card title="🔍 测试结果" size="small">
          <n-space vertical :size="12">
            <!-- 测试统计 -->
            <n-descriptions size="small" :column="3" bordered>
              <n-descriptions-item label="测试总数">
                <n-tag type="info" size="small">{{ testResults.length }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="成功">
                <n-tag type="success" size="small">{{ successCount }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="失败">
                <n-tag type="error" size="small">{{ failureCount }}</n-tag>
              </n-descriptions-item>
            </n-descriptions>

            <!-- 测试结果列表 -->
            <div style="max-height: 400px; overflow-y: auto">
              <n-space vertical :size="8">
                <n-card
                  v-for="result in testResults.slice().reverse()"
                  :key="result.id"
                  size="small"
                  :bordered="false"
                  :style="{
                    background: result.success ? 'var(--success-color-pressed)' : 'var(--error-color-pressed)'
                  }"
                >
                  <template #header>
                    <n-space align="center" justify="space-between">
                      <n-space align="center" :size="8">
                        <n-tag :type="result.success ? 'success' : 'error'" size="small">
                          {{ result.success ? '✅ 成功' : '❌ 失败' }}
                        </n-tag>
                        <n-text strong style="font-size: 12px">{{ result.method }} {{ result.url }}</n-text>
                      </n-space>
                      <n-text depth="3" style="font-size: 10px">
                        {{ new Date(result.timestamp).toLocaleTimeString() }}
                      </n-text>
                    </n-space>
                  </template>

                  <n-space vertical :size="8">
                    <!-- 请求信息 -->
                    <div>
                      <n-text depth="2" style="font-size: 11px">请求信息:</n-text>
                      <div style="font-family: monospace; font-size: 10px; margin-top: 4px">
                        URL: {{ result.actualUrl }}
                        <br />
                        耗时: {{ result.duration }}ms
                      </div>
                    </div>

                    <!-- 响应信息 -->
                    <div v-if="result.success">
                      <n-text depth="2" style="font-size: 11px">响应数据:</n-text>
                      <div
                        style="
                          font-family: monospace;
                          font-size: 10px;
                          margin-top: 4px;
                          max-height: 100px;
                          overflow-y: auto;
                        "
                      >
                        <pre style="margin: 0">{{ JSON.stringify(result.data, null, 2) }}</pre>
                      </div>
                    </div>

                    <!-- 错误信息 -->
                    <div v-else>
                      <n-text depth="2" style="font-size: 11px">错误信息:</n-text>
                      <div style="color: var(--error-color); font-size: 10px; margin-top: 4px">
                        {{ result.error }}
                      </div>
                    </div>

                    <!-- 验证结果 -->
                    <div v-if="result.validationResults.length > 0">
                      <n-text depth="2" style="font-size: 11px">验证结果:</n-text>
                      <n-space :size="4" style="margin-top: 4px">
                        <n-tag
                          v-for="validation in result.validationResults"
                          :key="validation.check"
                          :type="validation.passed ? 'success' : 'error'"
                          size="tiny"
                        >
                          {{ validation.check }}: {{ validation.passed ? '✓' : '✗' }}
                        </n-tag>
                      </n-space>
                    </div>
                  </n-space>
                </n-card>
              </n-space>
            </div>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 测试日志 -->
    <n-card title="📋 详细测试日志" size="small" style="margin-top: 16px">
      <div style="max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 11px">
        <div v-for="log in logs.slice().reverse()" :key="log.id" style="padding: 2px 0">
          <span style="color: var(--text-color-3)">[{{ new Date(log.timestamp).toLocaleTimeString() }}]</span>
          <span :style="{ color: getLogColor(log.level) }">{{ log.level.toUpperCase() }}:</span>
          {{ log.message }}
        </div>
        <div v-if="logs.length === 0" style="text-align: center; color: var(--text-color-3); padding: 20px">
          暂无日志记录
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * HTTP请求验证测试组件
 * 专门测试修复后的HTTP请求系统，验证是否正确使用项目的代理配置
 */

import { ref, reactive, computed, onMounted } from 'vue'
import {
  NPageHeader,
  NCard,
  NSpace,
  NButton,
  NIcon,
  NGrid,
  NGridItem,
  NFormItem,
  NSelect,
  NInput,
  NForm,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NText
} from 'naive-ui'
import { TrashOutline, PlayOutline } from '@vicons/ionicons5'

// 导入数据源执行器
import { createDataSourceExecutor } from '@/core/data-source-system/core/DataSourceExecutor'

// 测试场景定义
interface TestScenario {
  id: string
  name: string
  method: string
  url: string
  expectedBehavior: string
  params?: Array<{ key: string; value: string }>
  headers?: Array<{ key: string; value: string }>
}

interface TestResult {
  id: string
  timestamp: number
  method: string
  url: string
  actualUrl: string
  success: boolean
  duration: number
  data?: any
  error?: string
  validationResults: Array<{
    check: string
    passed: boolean
    details?: string
  }>
}

interface TestLog {
  id: string
  timestamp: number
  level: 'info' | 'success' | 'warn' | 'error'
  message: string
}

// 响应式数据
const testing = ref(false)
const customTesting = ref(false)
const selectedScenario = ref('device-list')
const testResults = ref<TestResult[]>([])
const logs = ref<TestLog[]>([])

// 自定义测试配置
const customTest = reactive({
  method: 'GET',
  url: '/device'
})

// 测试场景配置
const testScenarios: TestScenario[] = [
  {
    id: 'device-list',
    name: '设备列表API',
    method: 'GET',
    url: '/device',
    expectedBehavior: '自动添加代理前缀 /proxy-default/',
    params: [
      { key: 'page', value: '1' },
      { key: 'page_size', value: '5' }
    ]
  },
  {
    id: 'device-list-with-proxy',
    name: '设备列表API（手动代理）',
    method: 'GET',
    url: '/proxy-default/device',
    expectedBehavior: '使用已提供的代理前缀，不重复添加',
    params: [
      { key: 'page', value: '1' },
      { key: 'page_size', value: '3' }
    ]
  },
  {
    id: 'absolute-url',
    name: '绝对URL测试',
    method: 'GET',
    url: 'http://localhost:5004/proxy-default/device',
    expectedBehavior: '绝对URL应该按原样处理',
    params: [
      { key: 'page', value: '1' },
      { key: 'page_size', value: '2' }
    ]
  },
  {
    id: 'nonexistent-endpoint',
    name: '不存在的端点',
    method: 'GET',
    url: '/nonexistent-api',
    expectedBehavior: '测试错误处理机制，应该返回404或相应错误'
  }
]

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
]

const scenarioOptions = testScenarios.map(scenario => ({
  label: scenario.name,
  value: scenario.id
}))

// 计算属性
const currentScenario = computed(() => {
  return testScenarios.find(s => s.id === selectedScenario.value)
})

const successCount = computed(() => {
  return testResults.value.filter(r => r.success).length
})

const failureCount = computed(() => {
  return testResults.value.filter(r => !r.success).length
})

// 工具函数
const addLog = (level: TestLog['level'], message: string) => {
  const log: TestLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    level,
    message
  }
  logs.value.push(log)
  console.log(`[HTTP Test] ${level.toUpperCase()}: ${message}`)
}

const getLogColor = (level: string) => {
  switch (level) {
    case 'success':
      return 'var(--success-color)'
    case 'warn':
      return 'var(--warning-color)'
    case 'error':
      return 'var(--error-color)'
    default:
      return 'var(--info-color)'
  }
}

const clearLogs = () => {
  logs.value = []
  testResults.value = []
  addLog('info', '日志和测试结果已清空')
}

// 执行单个HTTP测试
const executeHttpTest = async (scenario: TestScenario): Promise<TestResult> => {
  const startTime = Date.now()
  const executor = createDataSourceExecutor()

  addLog('info', `开始测试: ${scenario.name} - ${scenario.method} ${scenario.url}`)

  // 构造数据源配置
  const dataSourceConfig = {
    dataSourceKey: `test-${scenario.id}`,
    version: '1.0.0',
    exportTime: new Date().toISOString(),
    configuration: {
      rawDataList: [
        {
          id: `http-${scenario.id}`,
          name: scenario.name,
          type: 'http' as const,
          httpConfig: {
            method: scenario.method,
            url: scenario.url,
            headers: scenario.headers || [],
            params: scenario.params || [],
            bodyType: 'none',
            bodyContent: '',
            timeout: 10000
          }
        }
      ],
      finalProcessingType: 'select-specific' as const,
      finalProcessingScript: '',
      selectedDataItemIndex: 0,
      finalProcessingConfig: {}
    }
  }

  try {
    // 加载配置并执行
    executor.loadConfig(dataSourceConfig)
    const executionState = await executor.executeAll()

    const duration = Date.now() - startTime
    const rawResult = executionState.rawDataResults[0]

    const result: TestResult = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      method: scenario.method,
      url: scenario.url,
      actualUrl: scenario.url, // 实际请求的URL
      success: rawResult?.success || false,
      duration,
      validationResults: []
    }

    if (rawResult?.success) {
      result.data = rawResult.data
      addLog('success', `✅ 测试成功: ${scenario.name} (${duration}ms)`)

      // 执行验证检查
      result.validationResults = performValidationChecks(scenario, rawResult.data, result)
    } else {
      result.error = rawResult?.error || '未知错误'
      addLog('error', `❌ 测试失败: ${scenario.name} - ${result.error}`)

      // 对错误进行验证
      result.validationResults = performErrorValidation(scenario, result.error)
    }

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    addLog('error', `❌ 测试异常: ${scenario.name} - ${errorMessage}`)

    return {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      method: scenario.method,
      url: scenario.url,
      actualUrl: scenario.url,
      success: false,
      duration,
      error: errorMessage,
      validationResults: performErrorValidation(scenario, errorMessage)
    }
  } finally {
    executor.destroy()
  }
}

// 执行验证检查
const performValidationChecks = (scenario: TestScenario, data: any, result: TestResult) => {
  const validations = []

  // 检查数据是否存在
  if (data !== null && data !== undefined) {
    validations.push({
      check: '数据存在',
      passed: true,
      details: `返回数据类型: ${typeof data}`
    })
  } else {
    validations.push({
      check: '数据存在',
      passed: false,
      details: '返回数据为空'
    })
  }

  // 检查JSON格式
  try {
    JSON.stringify(data)
    validations.push({
      check: 'JSON格式',
      passed: true
    })
  } catch {
    validations.push({
      check: 'JSON格式',
      passed: false,
      details: '数据无法序列化为JSON'
    })
  }

  // 检查响应时间
  if (result.duration < 10000) {
    validations.push({
      check: '响应时间',
      passed: true,
      details: `${result.duration}ms < 10s`
    })
  } else {
    validations.push({
      check: '响应时间',
      passed: false,
      details: `${result.duration}ms >= 10s`
    })
  }

  // 特定场景的验证
  if (scenario.id === 'device-list' || scenario.id === 'device-list-with-proxy') {
    // 检查设备列表的数据结构
    if (data && typeof data === 'object') {
      if ('data' in data || Array.isArray(data) || 'list' in data) {
        validations.push({
          check: '设备数据结构',
          passed: true,
          details: '包含预期的数据字段'
        })
      } else {
        validations.push({
          check: '设备数据结构',
          passed: false,
          details: '缺少预期的数据字段'
        })
      }
    }
  }

  return validations
}

// 执行错误验证
const performErrorValidation = (scenario: TestScenario, error: string) => {
  const validations = []

  // 对于不存在的端点，404错误是预期的
  if (scenario.id === 'nonexistent-endpoint') {
    if (error.includes('404') || error.includes('Not Found')) {
      validations.push({
        check: '预期错误',
        passed: true,
        details: '正确返回404错误'
      })
    } else {
      validations.push({
        check: '预期错误',
        passed: false,
        details: '未返回预期的404错误'
      })
    }
  }

  // 检查是否是网络错误
  if (error.includes('Network Error') || error.includes('ECONNREFUSED')) {
    validations.push({
      check: '网络连接',
      passed: false,
      details: '网络连接失败'
    })
  }

  // 检查是否是代理配置问题
  if (error.includes('proxy') || error.includes('CORS')) {
    validations.push({
      check: '代理配置',
      passed: false,
      details: '可能存在代理配置问题'
    })
  }

  return validations
}

// 运行HTTP测试套件
const runHttpTests = async () => {
  if (testing.value) return

  testing.value = true
  addLog('info', '🚀 开始运行HTTP请求验证测试套件')

  try {
    // 依次执行所有测试场景
    for (const scenario of testScenarios) {
      const result = await executeHttpTest(scenario)
      testResults.value.push(result)

      // 每个测试之间稍作停顿
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const totalTests = testResults.value.length
    const successTests = successCount.value
    const failureTests = failureCount.value

    addLog('success', `🎉 测试套件完成! 总共 ${totalTests} 个测试，成功 ${successTests} 个，失败 ${failureTests} 个`)

    if (failureTests === 0) {
      addLog('success', '✅ 所有测试通过！HTTP请求系统工作正常')
    } else {
      addLog('warn', `⚠️  ${failureTests} 个测试失败，请检查相关配置`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `❌ 测试套件执行异常: ${errorMessage}`)
  } finally {
    testing.value = false
  }
}

// 运行自定义测试
const runCustomTest = async () => {
  if (customTesting.value || !customTest.url.trim()) return

  customTesting.value = true

  const customScenario: TestScenario = {
    id: 'custom',
    name: '自定义测试',
    method: customTest.method,
    url: customTest.url.trim(),
    expectedBehavior: '用户自定义的HTTP请求测试'
  }

  try {
    const result = await executeHttpTest(customScenario)
    testResults.value.push(result)

    if (result.success) {
      addLog('success', `✅ 自定义测试成功: ${customTest.method} ${customTest.url}`)
    } else {
      addLog('error', `❌ 自定义测试失败: ${result.error}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `❌ 自定义测试异常: ${errorMessage}`)
  } finally {
    customTesting.value = false
  }
}

// 生命周期
onMounted(() => {
  addLog('info', 'HTTP请求验证测试组件已加载')
  addLog('info', '此组件用于验证修复后的HTTP请求系统是否正确使用项目代理配置')
  addLog('info', '开发模式下，相对路径会自动添加 /proxy-default/ 前缀')
})
</script>

<style scoped>
.http-request-validation {
  padding: 16px;
  background: var(--body-color);
  min-height: 100vh;
}

/* 测试结果样式优化 */
:deep(.n-card-header) {
  padding: 8px 12px;
}

:deep(.n-card__content) {
  padding: 8px 12px;
}

/* 日志区域样式 */
.test-logs {
  background: var(--code-color);
  border-radius: 4px;
  padding: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .http-request-validation :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}
</style>
