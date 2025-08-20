<template>
  <div class="executor-test">
    <n-card title="数据源执行器完整测试">
      <template #header-extra>
        <n-tag type="info">执行器 + 触发器 集成测试</n-tag>
      </template>

      <n-space vertical :size="24">
        <!-- 执行器状态 -->
        <n-card size="small" title="执行器状态">
          <n-descriptions :columns="3" size="small">
            <n-descriptions-item label="配置状态">
              <n-tag :type="executorState.isConfigured ? 'success' : 'warning'">
                {{ executorState.isConfigured ? '已配置' : '未配置' }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="执行状态">
              <n-tag :type="executorState.state.isExecuting ? 'info' : 'default'">
                {{ executorState.state.isExecuting ? '执行中' : '空闲' }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="执行次数">
              {{ executorState.state.executionCount }}
            </n-descriptions-item>
            <n-descriptions-item label="最后执行时间">
              {{
                executorState.state.lastExecuteTime
                  ? new Date(executorState.state.lastExecuteTime).toLocaleString()
                  : '从未执行'
              }}
            </n-descriptions-item>
            <n-descriptions-item label="最后错误">
              <span v-if="executorState.state.lastError" style="color: var(--error-color)">
                {{ executorState.state.lastError }}
              </span>
              <span v-else style="color: var(--success-color)">无</span>
            </n-descriptions-item>
            <n-descriptions-item label="最终结果状态">
              <n-tag :type="executorState.state.finalProcessingSuccess ? 'success' : 'error'">
                {{ executorState.state.finalProcessingSuccess ? '成功' : '失败' }}
              </n-tag>
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- 触发器状态 -->
        <n-card size="small" title="触发器状态">
          <n-space vertical :size="12">
            <div v-if="triggerStates.length === 0">
              <n-empty description="暂无触发器" />
            </div>
            <div v-else>
              <n-data-table :columns="triggerColumns" :data="triggerStates" size="small" :pagination="false" />
            </div>

            <!-- 添加触发器 -->
            <n-space>
              <n-button type="primary" size="small" @click="addTimerTrigger">添加定时器 (5秒)</n-button>
              <n-button type="info" size="small" @click="addEventTrigger">添加事件触发器</n-button>
              <n-button type="error" size="small" @click="clearAllTriggers">清除所有触发器</n-button>
            </n-space>
          </n-space>
        </n-card>

        <!-- 测试配置 -->
        <n-card size="small" title="测试配置">
          <n-space vertical :size="12">
            <n-form :model="testConfig" size="small">
              <n-form-item label="测试场景">
                <n-select v-model:value="testConfig.scenario" :options="scenarioOptions" />
              </n-form-item>
              <n-form-item label="错误容忍">
                <n-switch v-model:value="testConfig.errorTolerant" />
              </n-form-item>
            </n-form>

            <n-space>
              <n-button type="primary" @click="loadTestConfig">加载测试配置</n-button>
              <n-button type="success" :loading="executing" @click="executeManually">手动执行</n-button>
              <n-button type="info" @click="triggerAllManually">触发所有触发器</n-button>
              <n-button type="warning" @click="resetExecutor">重置执行器</n-button>
            </n-space>
          </n-space>
        </n-card>

        <!-- 执行结果 -->
        <n-card v-if="executorState.state.rawDataResults.length > 0" size="small" title="执行结果">
          <n-space vertical :size="16">
            <!-- 原始数据结果 -->
            <div>
              <n-text strong>原始数据结果 ({{ executorState.state.rawDataResults.length }} 个):</n-text>
              <n-space vertical :size="8" style="margin-top: 8px">
                <n-card
                  v-for="result in executorState.state.rawDataResults"
                  :key="result.id"
                  size="small"
                  style="background: var(--code-color)"
                >
                  <template #header>
                    <n-space align="center">
                      <n-tag :type="result.success ? 'success' : 'error'" size="small">
                        {{ result.success ? '成功' : '失败' }}
                      </n-tag>
                      <span style="font-size: 12px">{{ result.name || result.id }}</span>
                      <span style="font-size: 10px; color: var(--text-color-3)">
                        {{ new Date(result.timestamp).toLocaleTimeString() }}
                      </span>
                    </n-space>
                  </template>

                  <div v-if="result.success">
                    <pre style="margin: 0; font-size: 10px; max-height: 100px; overflow-y: auto">{{
                      JSON.stringify(result.data, null, 2)
                    }}</pre>
                  </div>
                  <div v-else style="color: var(--error-color); font-size: 12px">错误: {{ result.error }}</div>
                </n-card>
              </n-space>
            </div>

            <!-- 最终结果 -->
            <div v-if="executorState.state.finalResult !== null">
              <n-text strong>最终处理结果:</n-text>
              <n-card size="small" style="background: var(--code-color); margin-top: 8px">
                <pre style="margin: 0; font-size: 11px; max-height: 200px; overflow-y: auto">{{
                  JSON.stringify(executorState.state.finalResult, null, 2)
                }}</pre>
              </n-card>
            </div>
          </n-space>
        </n-card>

        <!-- 日志输出 -->
        <n-card size="small" title="执行日志">
          <div
            ref="logContainer"
            style="
              height: 200px;
              overflow-y: auto;
              font-family: monospace;
              font-size: 12px;
              background: var(--code-color);
              padding: 8px;
              border-radius: 4px;
            "
          >
            <div v-for="(log, index) in logs" :key="index" :style="{ color: getLogColor(log.level) }">
              [{{ new Date(log.timestamp).toLocaleTimeString() }}] {{ log.level.toUpperCase() }}: {{ log.message }}
            </div>
          </div>
          <n-space style="margin-top: 8px">
            <n-button size="small" @click="clearLogs">清空日志</n-button>
          </n-space>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源执行器完整测试组件
 * 测试执行器和触发器的集成功能
 */
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, h } from 'vue'
import { createDataSourceExecutor } from '../core/DataSourceExecutor'
import { createDataSourceTrigger } from '../core/DataSourceTrigger'
import type {
  DataSourceConfig,
  ExecutionState,
  TriggerState,
  TriggerConfig,
  ReactiveExecutorState
} from '../types/execution'

// 执行器和触发器实例
const executor = createDataSourceExecutor()
const trigger = createDataSourceTrigger()

// 响应式状态
const executorState = reactive<ReactiveExecutorState>({
  config: null,
  state: {
    isExecuting: false,
    lastExecuteTime: null,
    lastError: null,
    executionCount: 0,
    rawDataResults: [],
    finalResult: null,
    finalProcessingSuccess: false
  },
  isConfigured: false,
  canExecute: false,
  hasErrors: false,
  metrics: {
    executionTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
})

const triggerStates = ref<TriggerState[]>([])
const executing = ref(false)
const logs = ref<Array<{ timestamp: string; level: string; message: string }>>([])
const logContainer = ref<HTMLElement>()

// 测试配置
const testConfig = reactive({
  scenario: 'http-json-mixed',
  errorTolerant: true
})

const scenarioOptions = [
  { label: 'HTTP + JSON 混合', value: 'http-json-mixed' },
  { label: '纯 JSON 数据', value: 'json-only' },
  { label: 'HTTP 请求失败测试', value: 'http-error' },
  { label: '复杂脚本处理', value: 'complex-script' }
]

// 触发器表格列定义
const triggerColumns = [
  { title: 'ID', key: 'id', width: 120 },
  { title: '类型', key: 'type', width: 100 },
  {
    title: '状态',
    key: 'isActive',
    width: 80,
    render: (row: TriggerState) => {
      return h(
        'n-tag',
        {
          type: row.isActive ? 'success' : 'default',
          size: 'small'
        },
        row.isActive ? '活动' : '停止'
      )
    }
  },
  { title: '触发次数', key: 'triggerCount', width: 100 },
  { title: '错误次数', key: 'errorCount', width: 100 },
  {
    title: '最后触发',
    key: 'lastTriggerTime',
    render: (row: TriggerState) => {
      return row.lastTriggerTime ? new Date(row.lastTriggerTime).toLocaleTimeString() : '从未触发'
    }
  }
]

/**
 * 添加日志
 */
const addLog = (level: string, message: string) => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    level,
    message
  })

  // 自动滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

/**
 * 获取日志颜色
 */
const getLogColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'error':
      return 'var(--error-color)'
    case 'warn':
      return 'var(--warning-color)'
    case 'info':
      return 'var(--info-color)'
    case 'success':
      return 'var(--success-color)'
    default:
      return 'var(--text-color)'
  }
}

/**
 * 清空日志
 */
const clearLogs = () => {
  logs.value = []
  addLog('info', '日志已清空')
}

/**
 * 生成测试配置
 */
const generateTestConfig = (scenario: string): DataSourceConfig => {
  const baseConfig = {
    dataSourceKey: `test-${scenario}`,
    version: '1.0.0',
    exportTime: new Date().toISOString(),
    configuration: {
      rawDataList: [],
      finalProcessingType: 'merge-object' as const,
      finalProcessingScript: '',
      selectedDataItemIndex: 0,
      finalProcessingConfig: {}
    }
  }

  switch (scenario) {
    case 'http-json-mixed':
      baseConfig.configuration.rawDataList = [
        {
          id: 'json-1',
          name: 'JSON用户数据',
          type: 'json' as const,
          data: {
            users: [
              { id: 1, name: '张三', age: 25 },
              { id: 2, name: '李四', age: 30 }
            ]
          }
        },
        {
          id: 'http-1',
          name: 'HTTP设备数据',
          type: 'http' as const,
          httpConfig: {
            method: 'GET',
            url: '/proxy-default/device',
            headers: [],
            params: [
              { key: 'page', value: '1' },
              { key: 'page_size', value: '5' }
            ],
            bodyType: 'none',
            bodyContent: '',
            timeout: 10000
          }
        }
      ]
      baseConfig.configuration.finalProcessingType = 'merge-object'
      break

    case 'json-only':
      baseConfig.configuration.rawDataList = [
        {
          id: 'json-1',
          name: 'JSON数据1',
          type: 'json' as const,
          data: { part1: { value: 100, status: 'ok' } }
        },
        {
          id: 'json-2',
          name: 'JSON数据2',
          type: 'json' as const,
          data: { part2: { value: 200, status: 'good' } }
        }
      ]
      break

    case 'http-error':
      baseConfig.configuration.rawDataList = [
        {
          id: 'http-error',
          name: '错误HTTP请求',
          type: 'http' as const,
          httpConfig: {
            method: 'GET',
            url: '/nonexistent-endpoint',
            headers: [],
            params: [],
            bodyType: 'none',
            bodyContent: '',
            timeout: 5000
          }
        }
      ]
      break

    case 'complex-script':
      baseConfig.configuration.rawDataList = [
        {
          id: 'data-for-script',
          name: '脚本处理数据',
          type: 'json' as const,
          data: {
            numbers: [1, 2, 3, 4, 5],
            text: 'hello world'
          }
        }
      ]
      baseConfig.configuration.finalProcessingType = 'custom-script'
      baseConfig.configuration.finalProcessingScript = `
        // 复杂脚本处理示例
        const data = rawDataList[0]
        if (!data || !data.numbers) {
          return { error: '数据格式错误' }
        }
        
        const sum = data.numbers.reduce((a, b) => a + b, 0)
        const avg = sum / data.numbers.length
        
        return {
          originalData: data,
          statistics: {
            sum: sum,
            average: avg,
            count: data.numbers.length,
            max: Math.max(...data.numbers),
            min: Math.min(...data.numbers)
          },
          processedText: data.text.toUpperCase(),
          timestamp: new Date().toISOString()
        }
      `
      break
  }

  return baseConfig
}

/**
 * 加载测试配置
 */
const loadTestConfig = () => {
  try {
    const config = generateTestConfig(testConfig.scenario)

    addLog('info', `加载测试配置: ${testConfig.scenario}`)

    // 加载到执行器
    executor.loadConfig(config)

    // 设置错误处理策略
    executor.setErrorHandlingStrategy({
      tolerant: testConfig.errorTolerant,
      retryPolicy: {
        enabled: false,
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true
      }
    })

    // 更新状态
    executorState.config = config
    executorState.isConfigured = true
    executorState.canExecute = true

    addLog('success', '测试配置加载成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addLog('error', `配置加载失败: ${message}`)
  }
}

/**
 * 手动执行
 */
const executeManually = async () => {
  if (!executorState.isConfigured) {
    addLog('warn', '请先加载配置')
    return
  }

  executing.value = true
  addLog('info', '开始手动执行数据源')

  try {
    const state = await executor.executeAll()
    Object.assign(executorState.state, state)
    addLog('success', '手动执行完成')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addLog('error', `手动执行失败: ${message}`)
  } finally {
    executing.value = false
  }
}

/**
 * 添加定时器触发器
 */
const addTimerTrigger = () => {
  const config: TriggerConfig = {
    id: `timer-${Date.now()}`,
    name: '5秒定时器',
    type: 'timer',
    enabled: true,
    timerConfig: {
      interval: 5000,
      immediate: false,
      enabled: true
    }
  }

  trigger.addTrigger(config)
  addLog('info', `添加定时器触发器: ${config.id}`)
  updateTriggerStates()
}

/**
 * 添加事件触发器
 */
const addEventTrigger = () => {
  const config: TriggerConfig = {
    id: `event-${Date.now()}`,
    name: '测试事件触发器',
    type: 'event',
    enabled: true,
    eventConfig: {
      eventName: 'test-event',
      debounceTime: 500,
      enabled: true
    }
  }

  trigger.addTrigger(config)
  addLog('info', `添加事件触发器: ${config.id}`)
  updateTriggerStates()
}

/**
 * 清除所有触发器
 */
const clearAllTriggers = () => {
  trigger.disableAllTriggers()
  triggerStates.value.forEach(state => {
    trigger.removeTrigger(state.id)
  })
  updateTriggerStates()
  addLog('info', '所有触发器已清除')
}

/**
 * 触发所有触发器
 */
const triggerAllManually = async () => {
  addLog('info', '手动触发所有触发器')
  await trigger.trigger()
}

/**
 * 重置执行器
 */
const resetExecutor = () => {
  executorState.config = null
  executorState.isConfigured = false
  executorState.canExecute = false
  Object.assign(executorState.state, {
    isExecuting: false,
    lastExecuteTime: null,
    lastError: null,
    executionCount: 0,
    rawDataResults: [],
    finalResult: null,
    finalProcessingSuccess: false
  })
  addLog('info', '执行器已重置')
}

/**
 * 更新触发器状态
 */
const updateTriggerStates = () => {
  triggerStates.value = trigger.getTriggerStates()
}

// 生命周期
onMounted(() => {
  addLog('info', '数据源执行器测试组件已加载')

  // 监听触发器事件
  trigger.on('trigger-event', (event: any) => {
    addLog('info', `触发器事件: ${event.type} - ${event.triggerId}`)
    updateTriggerStates()
  })

  // 监听执行事件
  trigger.on('execute-data-source', async (data: any) => {
    if (executorState.isConfigured) {
      addLog('info', `触发器 ${data.triggerId} 触发数据源执行`)
      try {
        const state = await executor.executeAll()
        Object.assign(executorState.state, state)
        addLog('success', '触发器触发的执行完成')
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        addLog('error', `触发器触发的执行失败: ${message}`)
      }
    } else {
      addLog('warn', '触发器触发但执行器未配置')
    }
  })
})

onUnmounted(() => {
  executor.destroy()
  trigger.destroy()
  addLog('info', '执行器测试组件已卸载')
})
</script>

<style scoped>
.executor-test {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
