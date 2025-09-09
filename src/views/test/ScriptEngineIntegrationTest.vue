<!--
  Script Engine 集成测试页面
  展示统一脚本系统和编辑器的功能
-->
<template>
  <div class="script-engine-test-container">
    <n-space vertical size="large">
      <!-- 页面标题 -->
      <div class="test-header">
        <n-page-header :title="t('scriptEngineTest.title')" :subtitle="t('scriptEngineTest.subtitle')">
          <template #avatar>
            <n-avatar>
              <n-icon><CodeOutline /></n-icon>
            </n-avatar>
          </template>
        </n-page-header>
      </div>

      <!-- 功能演示标签页 -->
      <n-tabs type="line" animated>
        <!-- 数据获取器测试 -->
        <n-tab-pane name="data-fetcher" :tab="t('scriptEngineTest.dataFetcher')">
          <n-card title="数据获取器脚本测试" size="small">
            <n-space vertical size="medium">
              <n-alert type="info" title="说明" show-icon>
                测试脚本数据源的获取功能，使用安全的 script-engine 执行环境。
              </n-alert>

              <ScriptEditor
                v-model:code="fetcherScript"
                script-type="data-fetcher"
                :context-params="['context', 'deviceId']"
                :allow-execution="true"
                :show-execution-result="true"
                :execution-context="{ deviceId: 'test_device_001' }"
                @execute="handleFetcherExecute"
                @syntax-change="handleSyntaxChange"
                @security-change="handleSecurityChange"
              />

              <n-space>
                <n-button type="primary" :loading="testingFetcher" @click="testDataFetcher">
                  <template #icon>
                    <n-icon><PlayOutline /></n-icon>
                  </template>
                  测试数据获取器
                </n-button>

                <n-button secondary @click="loadFetcherTemplate">
                  <template #icon>
                    <n-icon><DocumentTextOutline /></n-icon>
                  </template>
                  加载模拟数据模板
                </n-button>
              </n-space>

              <div v-if="fetcherResult" class="result-display">
                <n-divider title-placement="left">执行结果</n-divider>
                <n-code :code="JSON.stringify(fetcherResult, null, 2)" language="json" />
              </div>
            </n-space>
          </n-card>
        </n-tab-pane>

        <!-- 数据处理器测试 -->
        <n-tab-pane name="data-processor" :tab="t('scriptEngineTest.dataProcessor')">
          <n-card title="数据处理器脚本测试" size="small">
            <n-space vertical size="medium">
              <n-alert type="info" title="说明" show-icon>
                测试数据处理脚本，对输入数据进行过滤、转换和计算处理。
              </n-alert>

              <!-- 输入数据配置 -->
              <n-form inline>
                <n-form-item label="测试数据:">
                  <n-input
                    v-model:value="processorInputData"
                    type="textarea"
                    :rows="3"
                    placeholder='{"temperature": 25.5, "humidity": 60, "pressure": 1013.2}'
                    style="min-width: 400px"
                  />
                </n-form-item>
              </n-form>

              <ScriptEditor
                v-model:code="processorScript"
                script-type="data-processor"
                :context-params="['data']"
                :allow-execution="true"
                :show-execution-result="true"
                :execution-context="getProcessorContext()"
                @execute="handleProcessorExecute"
              />

              <n-space>
                <n-button type="primary" :loading="testingProcessor" @click="testDataProcessor">
                  <template #icon>
                    <n-icon><PlayOutline /></n-icon>
                  </template>
                  测试数据处理器
                </n-button>

                <n-button secondary @click="loadProcessorTemplate">
                  <template #icon>
                    <n-icon><CalculatorOutline /></n-icon>
                  </template>
                  加载数值计算模板
                </n-button>
              </n-space>

              <div v-if="processorResult" class="result-display">
                <n-divider title-placement="left">处理结果</n-divider>
                <n-code :code="JSON.stringify(processorResult, null, 2)" language="json" />
              </div>
            </n-space>
          </n-card>
        </n-tab-pane>

        <!-- 数据合并器测试 -->
        <n-tab-pane name="data-merger" :tab="t('scriptEngineTest.dataMerger')">
          <n-card title="数据合并器脚本测试" size="small">
            <n-space vertical size="medium">
              <n-alert type="info" title="说明" show-icon>
                测试数据合并脚本，将多个数据项合并成最终的数据源结果。
              </n-alert>

              <!-- 输入数据项配置 -->
              <n-form inline>
                <n-form-item label="数据项列表:">
                  <n-input
                    v-model:value="mergerInputItems"
                    type="textarea"
                    :rows="4"
                    placeholder='[{"name": "A", "value": 10}, {"name": "B", "value": 20}]'
                    style="min-width: 400px"
                  />
                </n-form-item>
              </n-form>

              <ScriptEditor
                v-model:code="mergerScript"
                script-type="data-merger"
                :context-params="['items']"
                :allow-execution="true"
                :show-execution-result="true"
                :execution-context="getMergerContext()"
                @execute="handleMergerExecute"
              />

              <n-space>
                <n-button type="primary" :loading="testingMerger" @click="testDataMerger">
                  <template #icon>
                    <n-icon><PlayOutline /></n-icon>
                  </template>
                  测试数据合并器
                </n-button>

                <n-button secondary @click="loadMergerTemplate">
                  <template #icon>
                    <n-icon><GitMergeOutline /></n-icon>
                  </template>
                  加载智能合并模板
                </n-button>
              </n-space>

              <div v-if="mergerResult" class="result-display">
                <n-divider title-placement="left">合并结果</n-divider>
                <n-code :code="JSON.stringify(mergerResult, null, 2)" language="json" />
              </div>
            </n-space>
          </n-card>
        </n-tab-pane>

        <!-- 模板库浏览 -->
        <n-tab-pane name="templates" :tab="t('scriptEngineTest.templates')">
          <n-card title="内置脚本模板库" size="small">
            <n-space vertical size="medium">
              <n-alert type="success" title="模板库统计" show-icon>
                <div>
                  共加载 {{ templateStats.total }} 个内置模板， 成功 {{ templateStats.success }} 个， 失败
                  {{ templateStats.error }} 个
                </div>
                <div style="margin-top: 8px">
                  <n-space>
                    <n-tag
                      v-for="(count, category) in templateStats.categories"
                      :key="category"
                      size="small"
                      type="info"
                    >
                      {{ category }}: {{ count }}
                    </n-tag>
                  </n-space>
                </div>
              </n-alert>

              <n-data-table :columns="templateColumns" :data="templates" :pagination="{ pageSize: 10 }" size="small" />
            </n-space>
          </n-card>
        </n-tab-pane>

        <!-- 性能监控 -->
        <n-tab-pane name="performance" :tab="t('scriptEngineTest.performance')">
          <n-card title="脚本执行性能监控" size="small">
            <n-space vertical size="medium">
              <n-alert type="info" title="性能统计" show-icon>
                监控脚本执行的性能指标，包括执行时间、成功率、并发数等。
              </n-alert>

              <n-descriptions bordered :column="2" size="small">
                <n-descriptions-item label="总执行次数">
                  {{ executionStats.totalExecutions }}
                </n-descriptions-item>
                <n-descriptions-item label="成功执行次数">
                  {{ executionStats.successfulExecutions }}
                </n-descriptions-item>
                <n-descriptions-item label="失败执行次数">
                  {{ executionStats.failedExecutions }}
                </n-descriptions-item>
                <n-descriptions-item label="成功率">{{ getSuccessRate() }}%</n-descriptions-item>
                <n-descriptions-item label="平均执行时间">
                  {{ executionStats.averageExecutionTime.toFixed(2) }}ms
                </n-descriptions-item>
                <n-descriptions-item label="最长执行时间">{{ executionStats.maxExecutionTime }}ms</n-descriptions-item>
                <n-descriptions-item label="当前并发执行数">
                  {{ executionStats.currentConcurrentExecutions }}
                </n-descriptions-item>
                <n-descriptions-item label="引擎状态">
                  <n-tag type="success">正常运行</n-tag>
                </n-descriptions-item>
              </n-descriptions>

              <n-space>
                <n-button @click="refreshStats">
                  <template #icon>
                    <n-icon><RefreshOutline /></n-icon>
                  </template>
                  刷新统计
                </n-button>

                <n-button secondary @click="exportEngineState">
                  <template #icon>
                    <n-icon><DownloadOutline /></n-icon>
                  </template>
                  导出引擎状态
                </n-button>
              </n-space>
            </n-space>
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * Script Engine 集成测试页面
 * 演示统一脚本系统的各项功能
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import {
  CodeOutline,
  PlayOutline,
  DocumentTextOutline,
  CalculatorOutline,
  GitMergeOutline,
  RefreshOutline,
  DownloadOutline
} from '@vicons/ionicons5'

// 导入 ScriptEditor 组件和 script-engine
import { ScriptEditor } from '@/core/script-engine/components'
import { defaultScriptEngine } from '@/core/script-engine'
import type { ScriptExecutionResult } from '@/core/script-engine/types'

// 国际化和消息
const { t } = useI18n()
const message = useMessage()

// 脚本代码状态
const fetcherScript = ref(`// 生成模拟设备数据
const deviceId = context.deviceId || 'device_001'
const timestamp = Date.now()

return {
  deviceId: deviceId,
  timestamp: timestamp,
  data: {
    temperature: Math.round((Math.random() * 40 + 10) * 100) / 100,
    humidity: Math.round((Math.random() * 60 + 30) * 100) / 100,
    pressure: Math.round((Math.random() * 200 + 900) * 100) / 100,
    battery: Math.round(Math.random() * 100),
    status: Math.random() > 0.1 ? 'online' : 'offline'
  },
  quality: Math.random() > 0.05 ? 'good' : 'poor'
}`)

const processorScript = ref(`// 数值计算处理
if (!data || typeof data !== 'object') {
  return { error: '数据格式不正确' }
}

const numericFields = Object.keys(data).filter(key => 
  typeof data[key] === 'number' && !isNaN(data[key])
)

if (numericFields.length === 0) {
  return { error: '未找到数值字段' }
}

return {
  original: data,
  processed: {
    sum: numericFields.reduce((sum, key) => sum + data[key], 0),
    average: numericFields.reduce((sum, key) => sum + data[key], 0) / numericFields.length,
    max: Math.max(...numericFields.map(key => data[key])),
    min: Math.min(...numericFields.map(key => data[key])),
    count: numericFields.length
  },
  fields: numericFields,
  timestamp: Date.now()
}`)

const mergerScript = ref(`// 智能对象合并
if (!Array.isArray(items) || items.length === 0) {
  return {}
}

const result = {}
const metadata = {
  sources: items.length,
  conflicts: [],
  mergedFields: []
}

items.forEach((item, index) => {
  if (!item || typeof item !== 'object') return
  
  Object.keys(item).forEach(key => {
    const value = item[key]
    
    if (result[key] === undefined) {
      result[key] = value
      metadata.mergedFields.push(key)
    } else if (result[key] !== value) {
      metadata.conflicts.push({
        field: key,
        values: [result[key], value],
        sources: [\`item_\${index-1}\`, \`item_\${index}\`]
      })
      
      if (typeof result[key] === 'number' && typeof value === 'number') {
        result[key] = (result[key] + value) / 2
      } else {
        result[key] = value
      }
    }
  })
})

return {
  ...result,
  _metadata: metadata,
  _mergeInfo: {
    timestamp: Date.now(),
    strategy: 'intelligent',
    itemsProcessed: items.length
  }
}`)

// 输入数据状态
const processorInputData = ref('{"temperature": 25.5, "humidity": 60, "pressure": 1013.2}')
const mergerInputItems = ref(
  '[{"name": "设备A", "value": 10, "status": "online"}, {"name": "设备B", "value": 20, "status": "offline"}]'
)

// 测试状态
const testingFetcher = ref(false)
const testingProcessor = ref(false)
const testingMerger = ref(false)

// 结果状态
const fetcherResult = ref<any>()
const processorResult = ref<any>()
const mergerResult = ref<any>()

// 性能统计
const executionStats = reactive({
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  averageExecutionTime: 0,
  maxExecutionTime: 0,
  minExecutionTime: 0,
  currentConcurrentExecutions: 0
})

// 模板统计
const templateStats = reactive({
  total: 0,
  success: 0,
  error: 0,
  categories: {}
})

// 模板列表
const templates = ref<any[]>([])

// 模板表格列配置
const templateColumns = [
  {
    title: '模板名称',
    key: 'name',
    width: 200
  },
  {
    title: '分类',
    key: 'category',
    width: 120,
    render(row: any) {
      return h('n-tag', { size: 'small', type: 'info' }, row.category)
    }
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '参数数量',
    key: 'parameters',
    width: 100,
    render(row: any) {
      return row.parameters?.length || 0
    }
  },
  {
    title: '系统模板',
    key: 'isSystem',
    width: 100,
    render(row: any) {
      return h(
        'n-tag',
        {
          size: 'small',
          type: row.isSystem ? 'success' : 'default'
        },
        row.isSystem ? '是' : '否'
      )
    }
  }
]

// 计算属性
const getProcessorContext = () => {
  try {
    return { data: JSON.parse(processorInputData.value) }
  } catch {
    return { data: {} }
  }
}

const getMergerContext = () => {
  try {
    return { items: JSON.parse(mergerInputItems.value) }
  } catch {
    return { items: [] }
  }
}

const getSuccessRate = () => {
  if (executionStats.totalExecutions === 0) return 0
  return Math.round((executionStats.successfulExecutions / executionStats.totalExecutions) * 100)
}

// 事件处理函数
function handleFetcherExecute(result: ScriptExecutionResult) {
  console.log('数据获取器执行结果:', result)
  fetcherResult.value = result
}

function handleProcessorExecute(result: ScriptExecutionResult) {
  console.log('数据处理器执行结果:', result)
  processorResult.value = result
}

function handleMergerExecute(result: ScriptExecutionResult) {
  console.log('数据合并器执行结果:', result)
  mergerResult.value = result
}

function handleSyntaxChange(valid: boolean, error?: string) {
  if (!valid && error) {
    message.error(`语法错误: ${error}`)
  }
}

function handleSecurityChange(safe: boolean, issues?: string[]) {
  if (!safe && issues) {
    message.warning(`安全警告: ${issues.join(', ')}`)
  }
}

// 测试方法
async function testDataFetcher() {
  testingFetcher.value = true
  try {
    const result = await defaultScriptEngine.execute(fetcherScript.value, { deviceId: 'test_device_001' })
    fetcherResult.value = result
    message.success('数据获取器测试完成')
  } catch (error) {
    message.error('数据获取器测试失败')
    console.error(error)
  } finally {
    testingFetcher.value = false
  }
}

async function testDataProcessor() {
  testingProcessor.value = true
  try {
    const result = await defaultScriptEngine.execute(processorScript.value, getProcessorContext())
    processorResult.value = result
    message.success('数据处理器测试完成')
  } catch (error) {
    message.error('数据处理器测试失败')
    console.error(error)
  } finally {
    testingProcessor.value = false
  }
}

async function testDataMerger() {
  testingMerger.value = true
  try {
    const result = await defaultScriptEngine.execute(mergerScript.value, getMergerContext())
    mergerResult.value = result
    message.success('数据合并器测试完成')
  } catch (error) {
    message.error('数据合并器测试失败')
    console.error(error)
  } finally {
    testingMerger.value = false
  }
}

// 模板加载方法
function loadFetcherTemplate() {
  const template = defaultScriptEngine.templateManager.getTemplate('模拟设备数据')
  if (template) {
    fetcherScript.value = template.code
    message.success('模板加载成功')
  } else {
    message.warning('未找到指定模板')
  }
}

function loadProcessorTemplate() {
  const template = defaultScriptEngine.templateManager.getTemplate('数值计算处理')
  if (template) {
    processorScript.value = template.code
    message.success('模板加载成功')
  } else {
    message.warning('未找到指定模板')
  }
}

function loadMergerTemplate() {
  const template = defaultScriptEngine.templateManager.getTemplate('智能对象合并')
  if (template) {
    mergerScript.value = template.code
    message.success('模板加载成功')
  } else {
    message.warning('未找到指定模板')
  }
}

// 统计和导出方法
function refreshStats() {
  const stats = defaultScriptEngine.getExecutionStats()
  Object.assign(executionStats, stats.executor)
  message.success('统计数据已刷新')
}

function exportEngineState() {
  try {
    const state = defaultScriptEngine.exportState()
    const dataStr = JSON.stringify(state, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `script-engine-state-${Date.now()}.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    message.success('引擎状态导出成功')
  } catch (error) {
    message.error('引擎状态导出失败')
    console.error(error)
  }
}

// 初始化
onMounted(() => {
  // 加载模板列表
  templates.value = defaultScriptEngine.templateManager.getAllTemplates()

  // 获取模板统计（这里模拟统计数据，实际应该从引擎获取）
  Object.assign(templateStats, {
    total: templates.value.length,
    success: templates.value.length,
    error: 0,
    categories: {
      'data-generation': templates.value.filter(t => t.category === 'data-generation').length,
      'data-processing': templates.value.filter(t => t.category === 'data-processing').length,
      'api-integration': templates.value.filter(t => t.category === 'api-integration').length,
      'time-series': templates.value.filter(t => t.category === 'time-series').length,
      transformation: templates.value.filter(t => t.category === 'transformation').length,
      validation: templates.value.filter(t => t.category === 'validation').length,
      utility: templates.value.filter(t => t.category === 'utility').length
    }
  })

  // 初始化统计数据
  refreshStats()
})
</script>

<style scoped>
.script-engine-test-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  margin-bottom: 24px;
}

.result-display {
  margin-top: 16px;
  padding: 12px;
  background: var(--code-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

/* 深色主题适配 */
[data-theme='dark'] .result-display {
  background: var(--code-color);
  border-color: var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .script-engine-test-container {
    padding: 16px;
  }
}
</style>
