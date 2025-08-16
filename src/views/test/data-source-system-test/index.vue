<template>
  <div class="data-source-system-test">
    <!-- 页面标题 -->
    <n-card title="简化数据源系统测试" size="large">
      <n-space vertical size="large">
        <!-- 系统状态概览 -->
        <n-card title="系统状态" size="small">
          <n-descriptions :columns="2" bordered>
            <n-descriptions-item label="总组件数">
              {{ systemStatus.totalComponents }}
            </n-descriptions-item>
            <n-descriptions-item label="活跃绑定">
              {{ systemStatus.activeBindings }}
            </n-descriptions-item>
            <n-descriptions-item label="轮询任务">
              {{ systemStatus.memoryUsage.pollingTasks }}
            </n-descriptions-item>
            <n-descriptions-item label="WebSocket连接">
              {{ systemStatus.memoryUsage.webSocketConnections }}
            </n-descriptions-item>
          </n-descriptions>

          <n-space style="margin-top: 12px">
            <n-button size="small" @click="refreshStatus">刷新状态</n-button>
            <n-button type="warning" size="small" @click="cleanupAll">清理所有</n-button>
          </n-space>
        </n-card>

        <!-- 测试区域 -->
        <n-grid :cols="2" :x-gap="16" :y-gap="16">
          <!-- 配置测试区 -->
          <n-grid-item>
            <n-card title="配置测试" size="small">
              <n-space vertical>
                <!-- 组件类型选择 -->
                <div>
                  <n-text strong>组件类型:</n-text>
                  <n-radio-group v-model:value="selectedComponentType" style="margin-top: 8px">
                    <n-space>
                      <n-radio value="visual-editor">Visual Editor</n-radio>
                      <n-radio value="card2.1">Card2.1</n-radio>
                      <n-radio value="standard">标准组件</n-radio>
                    </n-space>
                  </n-radio-group>
                </div>

                <!-- 数据源类型选择 -->
                <div>
                  <n-text strong>数据源类型:</n-text>
                  <n-select
                    v-model:value="selectedDataSourceType"
                    :options="dataSourceTypeOptions"
                    style="margin-top: 8px"
                  />
                </div>

                <!-- 数据内容输入 -->
                <div>
                  <n-text strong>数据内容:</n-text>
                  <n-input
                    v-model:value="dataContent"
                    type="textarea"
                    :rows="4"
                    placeholder="输入JSON数据或API地址"
                    style="margin-top: 8px"
                  />
                </div>

                <!-- 操作按钮 -->
                <n-space>
                  <n-button type="primary" :loading="loading" @click="generateConfig">生成配置</n-button>
                  <n-button type="success" :disabled="!hasConfig" @click="executeData">执行数据</n-button>
                  <n-button type="info" :disabled="!hasConfig" @click="startPolling">启动轮询</n-button>
                  <n-button type="warning" :disabled="!isPolling" @click="stopPolling">停止轮询</n-button>
                </n-space>
              </n-space>
            </n-card>
          </n-grid-item>

          <!-- 结果展示区 -->
          <n-grid-item>
            <n-card title="执行结果" size="small">
              <n-space vertical>
                <!-- 配置结果 -->
                <div v-if="generatedConfig">
                  <n-text strong>生成的配置:</n-text>
                  <n-code
                    :code="JSON.stringify(generatedConfig, null, 2)"
                    language="json"
                    :show-line-numbers="false"
                    style="font-size: 11px; margin-top: 4px; max-height: 150px; overflow-y: auto"
                  />
                </div>

                <!-- 执行结果 -->
                <div v-if="executionResult">
                  <n-text strong>执行结果:</n-text>
                  <n-code
                    :code="JSON.stringify(executionResult, null, 2)"
                    language="json"
                    :show-line-numbers="false"
                    style="font-size: 11px; margin-top: 4px; max-height: 200px; overflow-y: auto"
                  />
                </div>

                <!-- 适配结果 -->
                <div v-if="adaptedResult">
                  <n-text strong>适配后数据 ({{ selectedComponentType }}):</n-text>
                  <n-code
                    :code="JSON.stringify(adaptedResult, null, 2)"
                    language="json"
                    :show-line-numbers="false"
                    style="font-size: 11px; margin-top: 4px; max-height: 200px; overflow-y: auto"
                  />
                </div>
              </n-space>
            </n-card>
          </n-grid-item>
        </n-grid>

        <!-- 日志区域 -->
        <n-card title="执行日志" size="small">
          <div style="max-height: 200px; overflow-y: auto">
            <div
              v-for="(log, index) in logs"
              :key="index"
              style="font-family: monospace; font-size: 12px; margin: 2px 0"
            >
              <n-text :type="log.type === 'error' ? 'error' : log.type === 'success' ? 'success' : 'default'">
                [{{ log.time }}] {{ log.message }}
              </n-text>
            </div>
          </div>
          <n-button size="small" style="margin-top: 8px" @click="clearLogs">清空日志</n-button>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 简化数据源系统测试页面
 * 测试配置器 + 执行器的完整功能，验证组件适配
 */

import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NText,
  NCode,
  NGrid,
  NGridItem,
  NDescriptions,
  NDescriptionsItem,
  NRadioGroup,
  NRadio,
  NSelect,
  NInput
} from 'naive-ui'

// 导入简化数据源系统
import { dataSourceAPI } from '@/core/data-source-system'
import type { ComponentDataRequirement, UserDataSourceInput, SimpleDataSourceConfig } from '@/core/data-source-system'

// 响应式状态
const selectedComponentType = ref<'visual-editor' | 'card2.1' | 'standard'>('card2.1')
const selectedDataSourceType = ref<'static' | 'api' | 'websocket' | 'script'>('static')
const dataContent = ref(
  '{"name": "测试数据", "value": 42, "items": [{"id": 1, "title": "项目1"}, {"id": 2, "title": "项目2"}]}'
)
const loading = ref(false)

// 结果状态
const generatedConfig = ref<SimpleDataSourceConfig | null>(null)
const executionResult = ref<any>(null)
const adaptedResult = ref<any>(null)
const currentPollingId = ref<string | null>(null)

// 系统状态
const systemStatus = ref({
  totalComponents: 0,
  activeBindings: 0,
  memoryUsage: {
    pollingTasks: 0,
    webSocketConnections: 0
  }
})

// 日志
const logs = ref<Array<{ time: string; message: string; type: string }>>([])

// 计算属性
const hasConfig = computed(() => !!generatedConfig.value)
const isPolling = computed(() => !!currentPollingId.value)

// 数据源类型选项
const dataSourceTypeOptions = [
  { label: '静态数据', value: 'static' },
  { label: 'API接口', value: 'api' },
  { label: 'WebSocket', value: 'websocket' },
  { label: 'JavaScript脚本', value: 'script' }
]

/**
 * 添加日志
 */
const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })

  // 保持日志数量在合理范围
  if (logs.value.length > 50) {
    logs.value.splice(0, 10)
  }
}

/**
 * 清空日志
 */
const clearLogs = () => {
  logs.value = []
}

/**
 * 生成测试组件需求
 */
const generateTestRequirement = (): ComponentDataRequirement => {
  const componentId = `test-${selectedComponentType.value}-${Date.now()}`

  return {
    componentId,
    componentName: `测试${selectedComponentType.value}组件`,
    dataSources: [
      {
        id: 'primaryData',
        name: '主要数据源',
        structureType: 'object',
        fields: [
          { name: 'name', type: 'string', required: true, description: '名称' },
          { name: 'value', type: 'number', required: true, description: '数值' }
        ],
        required: true
      }
    ]
  }
}

/**
 * 生成用户输入配置
 */
const generateUserInput = (): UserDataSourceInput[] => {
  const baseInput: UserDataSourceInput = {
    dataSourceId: 'primaryData',
    type: selectedDataSourceType.value,
    config: {}
  }

  switch (selectedDataSourceType.value) {
    case 'static':
      baseInput.config = { data: dataContent.value }
      break
    case 'api':
      baseInput.config = {
        url: dataContent.value || 'https://api.example.com/data',
        method: 'GET',
        timeout: 10000
      }
      break
    case 'websocket':
      baseInput.config = {
        url: dataContent.value || 'wss://example.com/ws',
        reconnectInterval: 5000
      }
      break
    case 'script':
      baseInput.config = {
        script: dataContent.value || 'return { name: "脚本生成", value: Math.random() * 100 }',
        context: {}
      }
      break
  }

  return [baseInput]
}

/**
 * 生成配置
 */
const generateConfig = async () => {
  loading.value = true
  addLog('开始生成配置...')

  try {
    const requirement = generateTestRequirement()
    const userInputs = generateUserInput()

    addLog(`组件类型: ${selectedComponentType.value}`)
    addLog(`数据源类型: ${selectedDataSourceType.value}`)

    // 配置组件
    const config = await dataSourceAPI.configure(requirement.componentId, requirement, userInputs)

    generatedConfig.value = config
    addLog('配置生成成功!', 'success')
  } catch (error) {
    addLog(`配置生成失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    console.error('配置生成失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 执行数据
 */
const executeData = async () => {
  if (!generatedConfig.value) return

  addLog('开始执行数据源...')

  try {
    const result = await dataSourceAPI.execute(generatedConfig.value.componentId)

    executionResult.value = result
    adaptedResult.value = result

    addLog('数据执行成功!', 'success')
  } catch (error) {
    addLog(`数据执行失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    console.error('数据执行失败:', error)
  }
}

/**
 * 启动轮询
 */
const startPolling = async () => {
  if (!generatedConfig.value) return

  addLog('启动轮询数据绑定...')

  try {
    const pollingId = dataSourceAPI.start(generatedConfig.value.componentId, adaptedData => {
      adaptedResult.value = adaptedData
      addLog('数据已更新', 'success')
    })

    currentPollingId.value = pollingId
    addLog(`轮询已启动: ${pollingId}`, 'success')
  } catch (error) {
    addLog(`启动轮询失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    console.error('启动轮询失败:', error)
  }
}

/**
 * 停止轮询
 */
const stopPolling = () => {
  if (!generatedConfig.value || !currentPollingId.value) return

  addLog('停止轮询数据绑定...')

  try {
    dataSourceAPI.stop(generatedConfig.value.componentId)
    currentPollingId.value = null
    addLog('轮询已停止', 'success')
  } catch (error) {
    addLog(`停止轮询失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    console.error('停止轮询失败:', error)
  }
}

/**
 * 刷新系统状态
 */
const refreshStatus = () => {
  systemStatus.value = dataSourceAPI.status()
  addLog('系统状态已刷新')
}

/**
 * 清理所有
 */
const cleanupAll = () => {
  dataSourceAPI.cleanup()

  // 重置本地状态
  generatedConfig.value = null
  executionResult.value = null
  adaptedResult.value = null
  currentPollingId.value = null

  refreshStatus()
  addLog('所有数据已清理', 'success')
}

// 生命周期
onMounted(() => {
  addLog('数据源系统测试页面已加载')
  refreshStatus()

  // 定期刷新状态
  const statusInterval = setInterval(refreshStatus, 5000)

  onUnmounted(() => {
    clearInterval(statusInterval)
    // 页面卸载时清理资源
    if (currentPollingId.value) {
      stopPolling()
    }
  })
})
</script>

<style scoped>
.data-source-system-test {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
