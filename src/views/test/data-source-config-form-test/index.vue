<template>
  <div class="config-form-test">
    <!-- 顶部场景选择 -->
    <n-card title="数据源配置表单测试" size="small" style="margin-bottom: 16px">
      <n-space justify="space-between" align="center">
        <n-space>
          <n-text strong>测试场景:</n-text>
          <n-button
            v-for="scenario in testScenarios"
            :key="scenario.id"
            :type="currentScenario === scenario.id ? 'primary' : 'default'"
            size="small"
            @click="loadScenario(scenario.id)"
          >
            {{ scenario.name }}
          </n-button>
        </n-space>
        <n-space>
          <n-button size="small" @click="showRequirementDetail = true">查看配置详情</n-button>
          <n-button size="small" type="primary" :disabled="!lastGeneratedConfig" @click="showConfigResult = true">
            查看生成的配置
          </n-button>
          <n-button size="small" @click="clearAll">清空所有</n-button>
        </n-space>
      </n-space>
    </n-card>

    <!-- 主要内容区：左右分栏 -->
    <n-grid :cols="2" :x-gap="16">
      <!-- 左侧：配置表单 -->
      <n-grid-item>
        <n-card title="📝 配置表单" size="small">
          <DataSourceConfigForm
            :selected-widget-id="currentConfig.selectedWidgetId"
            :data-sources="currentConfig.dataSources"
            @update="onConfigUpdate"
            @request-current-data="onRequestCurrentData"
          />
        </n-card>
      </n-grid-item>

      <!-- 右侧：执行器和触发器测试 -->
      <n-grid-item>
        <n-card title="⚡ 执行器和触发器测试" size="small">
          <n-space vertical>
            <!-- 配置状态 -->
            <div>
              <n-text strong>配置状态:</n-text>
              <n-space style="margin-top: 4px">
                <n-tag :type="lastGeneratedConfig ? 'success' : 'default'">
                  {{ lastGeneratedConfig ? '配置已生成' : '等待配置' }}
                </n-tag>
                <n-text depth="3" style="font-size: 12px">
                  {{ Object.keys(lastGeneratedConfig?.dataSourceBindings || {}).length || 0 }} 个数据源
                </n-text>
                <n-button
                  v-if="lastGeneratedConfig"
                  size="tiny"
                  type="info"
                  style="margin-left: 8px"
                  @click="showConfigResult = true"
                >
                  查看详细配置
                </n-button>
              </n-space>
            </div>

            <!-- 执行器测试按钮 -->
            <n-space>
              <n-button
                type="primary"
                :disabled="!lastGeneratedConfig"
                :loading="executing"
                size="small"
                @click="executeOnce"
              >
                单次执行
              </n-button>
              <n-button type="info" :disabled="!lastGeneratedConfig || isPolling" size="small" @click="startPolling">
                启动轮询
              </n-button>
              <n-button type="warning" :disabled="!isPolling" size="small" @click="stopPolling">停止轮询</n-button>
            </n-space>

            <!-- 轮询状态 -->
            <div v-if="isPolling">
              <n-text strong>轮询状态:</n-text>
              <n-space style="margin-top: 4px">
                <n-tag type="info">运行中</n-tag>
                <n-text depth="3" style="font-size: 12px">已更新 {{ pollingCount }} 次</n-text>
              </n-space>
            </div>

            <!-- 执行日志 -->
            <div>
              <n-text strong>执行日志:</n-text>
              <div class="log-container">
                <div v-for="(log, index) in executionLogs.slice(-5)" :key="index" class="log-item">
                  <n-text :type="log.type === 'error' ? 'error' : log.type === 'success' ? 'success' : 'default'">
                    [{{ log.time }}] {{ log.message }}
                  </n-text>
                </div>
              </div>
              <n-button size="tiny" style="margin-top: 4px" @click="clearLogs">清空日志</n-button>
            </div>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 底部：最终数据展示 -->
    <n-card title="📊 最终数据展示" size="small" style="margin-top: 16px">
      <n-space vertical>
        <!-- 数据状态 -->
        <n-space justify="space-between" align="center">
          <div>
            <n-text strong>数据状态:</n-text>
            <n-space style="margin-left: 8px">
              <n-tag :type="latestExecutionResult ? 'success' : 'default'">
                {{ latestExecutionResult ? '有数据' : '无数据' }}
              </n-tag>
              <n-text v-if="lastExecutionTime" depth="3" style="font-size: 12px">
                最后更新: {{ lastExecutionTime }}
              </n-text>
            </n-space>
          </div>
          <n-space>
            <n-button size="small" @click="refreshDisplay">刷新显示</n-button>
            <n-button size="small" :disabled="!latestExecutionResult" @click="exportData">导出数据</n-button>
          </n-space>
        </n-space>

        <!-- 数据内容 -->
        <div v-if="latestExecutionResult">
          <n-code
            :code="JSON.stringify(latestExecutionResult, null, 2)"
            language="json"
            :show-line-numbers="true"
            style="max-height: 300px; overflow-y: auto"
          />
        </div>
        <n-empty v-else description="暂无执行数据" size="small" />
      </n-space>
    </n-card>

    <!-- 需求详情弹窗 -->
    <n-modal v-model:show="showRequirementDetail" preset="dialog" title="配置详情" style="width: 700px">
      <n-code
        :code="JSON.stringify(currentConfig, null, 2)"
        language="json"
        :show-line-numbers="true"
        style="max-height: 500px; overflow-y: auto"
      />
      <template #action>
        <n-button @click="showRequirementDetail = false">关闭</n-button>
      </template>
    </n-modal>

    <!-- 配置结果弹窗 -->
    <n-modal v-model:show="showConfigResult" preset="dialog" title="生成的配置" style="width: 700px">
      <n-space vertical>
        <n-text>用户输入配置（可直接传给配置器）:</n-text>
        <n-code
          :code="lastGeneratedConfig ? JSON.stringify(lastGeneratedConfig, null, 2) : '暂无配置'"
          language="json"
          :show-line-numbers="true"
          style="max-height: 400px; overflow-y: auto"
        />
      </n-space>
      <template #action>
        <n-button @click="showConfigResult = false">关闭</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源配置表单测试页面
 * 按照原始表单接口进行1:1还原测试
 */

import { ref, reactive, computed } from 'vue'
import { NCard, NSpace, NButton, NText, NCode, NModal, NGrid, NGridItem, NTag, NEmpty } from 'naive-ui'

import DataSourceConfigForm from '@/core/data-source-system/components/DataSourceConfigForm.vue'
import { dataSourceAPI } from '@/core/data-source-system'

// 测试场景定义 - 🔥 按照原始表单的接口定义
const testScenarios = [
  {
    id: 'simple',
    name: '简单对象数据',
    config: {
      selectedWidgetId: 'simple-text-widget',
      dataSources: [
        {
          key: 'textData',
          name: '文本数据',
          description: '简单的文本数据源',
          fieldMappings: {
            textData: {
              targetField: 'textData',
              defaultValue: { title: '示例标题', content: '示例内容' },
              type: 'object'
            }
          },
          fieldsToMap: [{ key: 'textData', targetProperty: 'objectData' }]
        }
      ]
    }
  },
  {
    id: 'array',
    name: '数组数据',
    config: {
      selectedWidgetId: 'list-widget',
      dataSources: [
        {
          key: 'listData',
          name: '列表数据',
          description: '数组形式的列表数据',
          fieldMappings: {
            listData: {
              targetField: 'listData',
              defaultValue: [
                { id: 1, name: '项目1', status: '激活' },
                { id: 2, name: '项目2', status: '待处理' }
              ],
              type: 'array'
            }
          },
          fieldsToMap: [{ key: 'listData', targetProperty: 'arrayData' }]
        }
      ]
    }
  },
  {
    id: 'multiple',
    name: '多数据源',
    config: {
      selectedWidgetId: 'dashboard-widget',
      dataSources: [
        {
          key: 'chartData',
          name: '图表数据',
          description: '图表显示用的数据',
          fieldMappings: {
            chartData: {
              targetField: 'chartData',
              defaultValue: [
                { x: '一月', y: 100 },
                { x: '二月', y: 150 },
                { x: '三月', y: 120 }
              ],
              type: 'array'
            }
          },
          fieldsToMap: [{ key: 'chartData', targetProperty: 'chartArrayData' }]
        },
        {
          key: 'summaryData',
          name: '汇总数据',
          description: '统计汇总信息',
          fieldMappings: {
            summaryData: {
              targetField: 'summaryData',
              defaultValue: { total: 370, average: 123.33 },
              type: 'object'
            }
          },
          fieldsToMap: [{ key: 'summaryData', targetProperty: 'summaryObjectData' }]
        }
      ]
    }
  }
]

// 响应式状态
const currentScenario = ref('simple')
const currentConfig = ref(testScenarios[0].config)
const initialConfig = ref({})

// 配置结果
const lastGeneratedConfig = ref<any>(null)
const lastConfigTime = ref('')

// 弹窗状态
const showRequirementDetail = ref(false)
const showConfigResult = ref(false)

// 执行器状态
const executing = ref(false)
const isPolling = ref(false)
const pollingCount = ref(0)
const currentPollingId = ref<string | null>(null)

// 执行结果
const latestExecutionResult = ref<any>(null)
const lastExecutionTime = ref('')

// 日志
const executionLogs = ref<Array<{ time: string; message: string; type: string }>>([])

/**
 * 添加执行日志
 */
const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  executionLogs.value.push({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })

  // 保持日志数量
  if (executionLogs.value.length > 50) {
    executionLogs.value.splice(0, 10)
  }
}

/**
 * 清空日志
 */
const clearLogs = () => {
  executionLogs.value = []
}

/**
 * 加载测试场景
 */
const loadScenario = (scenarioId: string) => {
  const scenario = testScenarios.find(s => s.id === scenarioId)
  if (scenario) {
    currentScenario.value = scenarioId
    currentConfig.value = scenario.config
    initialConfig.value = {}

    // 清理状态
    lastGeneratedConfig.value = null
    latestExecutionResult.value = null
    stopPolling()

    addLog(`切换到测试场景: ${scenario.name}`)
  }
}

/**
 * 清空所有状态
 */
const clearAll = () => {
  lastGeneratedConfig.value = null
  latestExecutionResult.value = null
  lastExecutionTime.value = ''
  stopPolling()
  clearLogs()
  addLog('所有状态已清空')
}

/**
 * 配置更新处理
 */
const onConfigUpdate = (config: any) => {
  console.log('🔧 [TestPage] 收到配置更新:', config)

  lastGeneratedConfig.value = config
  lastConfigTime.value = new Date().toLocaleString()

  const dataSourceCount = config.dataSourceBindings ? Object.keys(config.dataSourceBindings).length : 0
  addLog(`配置已更新，包含 ${dataSourceCount} 个数据源绑定`, 'success')

  // 🔥 新增：显示增强配置信息
  if (config.dataSourceBindings) {
    Object.keys(config.dataSourceBindings).forEach(key => {
      const binding = config.dataSourceBindings[key]
      if (binding.enhancedConfig) {
        const rawDataCount = binding.enhancedConfig.rawDataList?.length || 0
        if (rawDataCount > 0) {
          addLog(`数据源 ${key}: ${rawDataCount} 个原始数据项`, 'info')
        }
      }
    })
  }
}

/**
 * 请求当前数据处理
 */
const onRequestCurrentData = (widgetId: string) => {
  addLog(`请求当前运行时数据: ${widgetId}`, 'info')
  // TODO: 实现获取当前运行时数据的逻辑
}

/**
 * 单次执行数据
 */
const executeOnce = async () => {
  if (!lastGeneratedConfig.value) return

  executing.value = true
  addLog('开始单次执行...')

  try {
    // 1. 模拟数据源配置
    addLog('模拟配置数据源...', 'info')

    // 2. 模拟数据获取 - 使用测试场景的默认数据
    const mockResult = {}
    currentConfig.value.dataSources.forEach(ds => {
      if (ds.fieldMappings) {
        const mapping = Object.values(ds.fieldMappings)[0] as any
        if (mapping?.defaultValue) {
          mockResult[ds.key] = mapping.defaultValue
        }
      }
    })

    const result = mockResult

    // 3. 保存结果
    latestExecutionResult.value = result
    lastExecutionTime.value = new Date().toLocaleString()

    addLog('✅ 单次执行成功', 'success')
  } catch (error) {
    addLog(`❌ 执行失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
  } finally {
    executing.value = false
  }
}

/**
 * 启动轮询
 */
const startPolling = async () => {
  if (!lastGeneratedConfig.value || isPolling.value) return

  addLog('启动轮询...')

  try {
    // 模拟配置数据源
    addLog('模拟配置数据源用于轮询...', 'info')

    // 模拟轮询 - 使用定时器模拟数据更新
    const pollingId = setInterval(() => {
      pollingCount.value++

      // 生成模拟数据
      const mockData = {}
      currentConfig.value.dataSources.forEach(ds => {
        if (ds.fieldMappings) {
          const mapping = Object.values(ds.fieldMappings)[0] as any
          if (mapping?.defaultValue) {
            // 为数值类型添加一些随机变化
            let value = mapping.defaultValue
            if (Array.isArray(value)) {
              value = value.map(item => {
                if (typeof item === 'object' && item.y && typeof item.y === 'number') {
                  return { ...item, y: item.y + Math.floor(Math.random() * 20) - 10 }
                }
                return item
              })
            } else if (typeof value === 'object' && value.total && typeof value.total === 'number') {
              value = { ...value, total: value.total + Math.floor(Math.random() * 100) - 50 }
            }
            mockData[ds.key] = value
          }
        }
      })

      latestExecutionResult.value = mockData
      lastExecutionTime.value = new Date().toLocaleString()
      addLog(`📊 轮询更新 #${pollingCount.value}`, 'success')
    }, 3000)

    currentPollingId.value = pollingId
    isPolling.value = true
    pollingCount.value = 0

    addLog('✅ 轮询已启动', 'success')
  } catch (error) {
    addLog(`❌ 启动轮询失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
  }
}

/**
 * 停止轮询
 */
const stopPolling = () => {
  if (!isPolling.value || !currentPollingId.value) return

  try {
    if (currentPollingId.value) {
      clearInterval(currentPollingId.value)
    }
    isPolling.value = false
    currentPollingId.value = null

    addLog('⏹️ 轮询已停止', 'success')
  } catch (error) {
    addLog(`❌ 停止轮询失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
  }
}

/**
 * 刷新显示
 */
const refreshDisplay = () => {
  addLog('显示已刷新')
}

/**
 * 导出数据
 */
const exportData = () => {
  if (!latestExecutionResult.value) return

  const blob = new Blob([JSON.stringify(latestExecutionResult.value, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `execution_result_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)

  addLog('数据已导出')
}

// 初始化
addLog('数据源配置表单测试页面已加载')
addLog('请选择测试场景，配置数据源，然后测试完整流程')
</script>

<style scoped>
.config-form-test {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.log-container {
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-top: 4px;
}

.log-item {
  font-family: monospace;
  font-size: 11px;
  line-height: 1.4;
  margin: 1px 0;
}

/* 滚动条美化 */
.log-container::-webkit-scrollbar {
  width: 4px;
}

.log-container::-webkit-scrollbar-track {
  background: var(--card-color);
}

.log-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}
</style>
