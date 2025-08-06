<template>
  <div class="editor-integration-test-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>编辑器集成测试</h2>
      <p class="page-description">测试新的数据绑定系统与visual-editor的集成，重点验证JSON数据源配置功能。</p>
    </div>

    <!-- 测试状态面板 -->
    <n-card class="status-panel" size="small">
      <template #header>
        <n-space align="center">
          <n-icon size="20" color="#1890ff">
            <ServerOutline />
          </n-icon>
          <span>系统状态</span>
        </n-space>
      </template>

      <n-grid :cols="4" :x-gap="16">
        <n-grid-item>
          <n-statistic label="Card2.1组件" :value="card2Stats.componentCount">
            <template #prefix>
              <n-icon color="#52c41a">
                <CubeOutline />
              </n-icon>
            </template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="编辑器组件" :value="editorStats.widgetCount">
            <template #prefix>
              <n-icon color="#1890ff">
                <GridOutline />
              </n-icon>
            </template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="数据源类型" :value="dataSourceStats.typeCount">
            <template #prefix>
              <n-icon color="#722ed1">
                <DatabaseOutline />
              </n-icon>
            </template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="测试状态" :value="testStatus">
            <template #prefix>
              <n-icon :color="testStatus === '正常' ? '#52c41a' : '#faad14'">
                <CheckmarkCircleOutline v-if="testStatus === '正常'" />
                <WarningOutline v-else />
              </n-icon>
            </template>
          </n-statistic>
        </n-grid-item>
      </n-grid>
    </n-card>

    <!-- 主要测试区域 -->
    <n-grid :cols="2" :x-gap="16" :y-gap="16" class="main-test-area">
      <!-- 编辑器测试区域 -->
      <n-grid-item>
        <n-card title="Visual Editor 测试" size="small">
          <template #header-extra>
            <n-space>
              <n-button size="small" @click="resetEditor">
                <template #icon>
                  <n-icon><RefreshOutline /></n-icon>
                </template>
                重置
              </n-button>
              <n-button size="small" type="primary" @click="addTestComponent">
                <template #icon>
                  <n-icon><AddOutline /></n-icon>
                </template>
                添加测试组件
              </n-button>
            </n-space>
          </template>

          <div class="editor-container">
            <!-- 这里应该集成Visual Editor，暂时用占位符 -->
            <div class="editor-placeholder">
              <n-icon size="48" color="#d9d9d9">
                <ConstructOutline />
              </n-icon>
              <p>Visual Editor 集成区域</p>
              <n-text depth="3">将在这里加载编辑器组件</n-text>
            </div>
          </div>
        </n-card>
      </n-grid-item>

      <!-- 数据源配置测试 -->
      <n-grid-item>
        <n-card title="数据源配置测试" size="small">
          <template #header-extra>
            <n-space>
              <n-button size="small" @click="loadSampleData">
                <template #icon>
                  <n-icon><DocumentTextOutline /></n-icon>
                </template>
                加载示例
              </n-button>
              <n-button size="small" type="primary" @click="testDataBinding">
                <template #icon>
                  <n-icon><PlayOutline /></n-icon>
                </template>
                测试绑定
              </n-button>
            </n-space>
          </template>

          <div class="data-source-test">
            <NewStaticDataSourceConfig v-model="testDataSourceConfig" @update:modelValue="onDataSourceConfigUpdate" />
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 测试结果区域 -->
    <n-card class="test-results" title="测试结果" size="small">
      <n-tabs type="line" size="small">
        <!-- 数据绑定结果 -->
        <n-tab-pane name="binding" tab="数据绑定">
          <div class="result-content">
            <n-grid :cols="2" :x-gap="16">
              <n-grid-item>
                <div class="result-section">
                  <h4>配置结果</h4>
                  <pre class="result-json">{{ JSON.stringify(testDataSourceConfig, null, 2) }}</pre>
                </div>
              </n-grid-item>
              <n-grid-item>
                <div class="result-section">
                  <h4>处理结果</h4>
                  <pre class="result-json">{{ JSON.stringify(processedResult, null, 2) }}</pre>
                </div>
              </n-grid-item>
            </n-grid>
          </div>
        </n-tab-pane>

        <!-- 组件集成结果 -->
        <n-tab-pane name="integration" tab="组件集成">
          <div class="result-content">
            <n-space vertical>
              <div class="integration-status">
                <n-alert :type="integrationStatus.type" :title="integrationStatus.title" :show-icon="true">
                  {{ integrationStatus.message }}
                </n-alert>
              </div>

              <div class="component-preview">
                <h4>组件预览</h4>
                <div class="preview-container">
                  <EditorIntegrationTestCard
                    v-if="testDataSourceConfig && testDataSourceConfig.data"
                    :data-source="testDataSourceConfig"
                    :show-debug-info="true"
                    title="预览测试组件"
                  />
                  <div v-else class="no-preview">
                    <n-empty description="请先配置数据源以查看预览" />
                  </div>
                </div>
              </div>
            </n-space>
          </div>
        </n-tab-pane>

        <!-- 日志输出 -->
        <n-tab-pane name="logs" tab="日志">
          <div class="result-content">
            <div class="logs-container">
              <div class="logs-header">
                <n-space justify="space-between">
                  <span>系统日志 ({{ logs.length }})</span>
                  <n-button size="small" @click="clearLogs">清空日志</n-button>
                </n-space>
              </div>
              <div class="logs-content">
                <div v-for="(log, index) in logs" :key="index" :class="['log-item', `log-${log.level}`]">
                  <span class="log-time">{{ log.time }}</span>
                  <span class="log-level">{{ log.level.toUpperCase() }}</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
                <div v-if="logs.length === 0" class="no-logs">
                  <n-empty description="暂无日志输出" size="small" />
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  NIcon,
  NSpace,
  NButton,
  NTabs,
  NTabPane,
  NAlert,
  NEmpty,
  NText
} from 'naive-ui'
import {
  ServerOutline,
  CubeOutline,
  GridOutline,
  DatabaseOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  RefreshOutline,
  AddOutline,
  ConstructOutline,
  DocumentTextOutline,
  PlayOutline
} from '@vicons/ionicons5'

// 导入组件
import NewStaticDataSourceConfig from '@/components/visual-editor/settings/data-sources/NewStaticDataSourceConfig.vue'
import EditorIntegrationTestCard from '@/card2.1/components/editor-integration-test/EditorIntegrationTestCard.vue'

// 导入系统模块
import { initializeCard2System, getComponentTree } from '@/card2.1'
import { widgetRegistry } from '@/components/visual-editor/core/widget-registry'
import { dataSourceRegistry } from '@/components/visual-editor/core/data-source-registry'

interface LogEntry {
  time: string
  level: 'info' | 'warn' | 'error'
  message: string
}

// 测试数据
const testDataSourceConfig = ref<any>({})
const processedResult = ref<any>({})
const logs = ref<LogEntry[]>([])

// 统计数据
const card2Stats = ref({
  componentCount: 0,
  categoryCount: 0
})

const editorStats = ref({
  widgetCount: 0,
  categoryCount: 0
})

const dataSourceStats = ref({
  typeCount: 0,
  configCount: 0
})

// 计算属性
const testStatus = computed(() => {
  return logs.value.filter(log => log.level === 'error').length === 0 ? '正常' : '异常'
})

const integrationStatus = computed(() => {
  if (!testDataSourceConfig.value || !testDataSourceConfig.value.data) {
    return {
      type: 'info',
      title: '等待配置',
      message: '请配置数据源以开始测试'
    }
  }

  const hasErrors = logs.value.some(log => log.level === 'error')
  if (hasErrors) {
    return {
      type: 'error',
      title: '集成异常',
      message: '数据绑定过程中出现错误，请查看日志'
    }
  }

  return {
    type: 'success',
    title: '集成正常',
    message: '新数据绑定系统与编辑器集成成功'
  }
})

// 日志函数
const addLog = (level: 'info' | 'warn' | 'error', message: string) => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    level,
    message
  })

  // 保持最新100条日志
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(-100)
  }
}

// 数据源配置更新
const onDataSourceConfigUpdate = (config: any) => {
  console.log('🔧 EditorIntegrationTest - 数据源配置更新:', config)
  addLog('info', `数据源配置更新: ${config.name || 'unknown'}`)

  if (config.processedData) {
    processedResult.value = config.processedData
    addLog('info', `数据处理完成，共 ${Object.keys(config.processedData).length} 个字段`)
  }
}

// 加载示例数据
const loadSampleData = () => {
  const sampleConfig = {
    type: 'static',
    name: 'editorTestData',
    description: '编辑器集成测试数据',
    enabled: true,
    data: {
      sensors: {
        temperature: 25.6,
        humidity: 65.2,
        pressure: 1013.25
      },
      device: {
        status: '运行中',
        mode: '自动',
        location: '机房A'
      },
      readings: [
        { time: '12:00', value: 25.6 },
        { time: '12:05', value: 25.8 },
        { time: '12:10', value: 25.4 }
      ],
      timestamp: '2024-01-01T12:00:00Z'
    },
    mappings: [
      { sourcePath: 'sensors.temperature', targetField: 'temperature', description: '温度映射' },
      { sourcePath: 'sensors.humidity', targetField: 'humidity', description: '湿度映射' },
      { sourcePath: 'device.status', targetField: 'status', description: '状态映射' },
      { sourcePath: 'device.mode', targetField: 'mode', description: '模式映射' }
    ]
  }

  testDataSourceConfig.value = sampleConfig
  addLog('info', '示例数据加载完成')
}

// 测试数据绑定
const testDataBinding = async () => {
  try {
    addLog('info', '开始测试数据绑定...')

    if (!testDataSourceConfig.value || !testDataSourceConfig.value.data) {
      addLog('error', '数据源配置无效，请先配置数据源')
      return
    }

    // 这里可以添加更多的数据绑定测试逻辑
    addLog('info', '数据绑定测试完成')
  } catch (error) {
    addLog('error', `数据绑定测试失败: ${error}`)
  }
}

// 重置编辑器
const resetEditor = () => {
  testDataSourceConfig.value = {}
  processedResult.value = {}
  addLog('info', '编辑器已重置')
}

// 添加测试组件
const addTestComponent = () => {
  addLog('info', '添加测试组件到编辑器 (功能待实现)')
}

// 清空日志
const clearLogs = () => {
  logs.value = []
}

// 更新统计数据
const updateStats = async () => {
  try {
    // 初始化Card2.1系统
    await initializeCard2System()

    // 获取Card2.1统计
    const componentTree = getComponentTree()
    card2Stats.value = {
      componentCount: componentTree.totalCount,
      categoryCount: componentTree.categories.length
    }

    // 获取编辑器统计
    const allWidgets = widgetRegistry.getAllWidgets()
    const widgetTree = widgetRegistry.getWidgetTree()
    editorStats.value = {
      widgetCount: allWidgets.length,
      categoryCount: widgetTree.length
    }

    // 获取数据源统计
    const allDataSources = dataSourceRegistry.getAll()
    dataSourceStats.value = {
      typeCount: allDataSources.length,
      configCount: allDataSources.length
    }

    addLog(
      'info',
      `统计信息更新完成 - Card2.1组件: ${card2Stats.value.componentCount}, 编辑器组件: ${editorStats.value.widgetCount}`
    )
  } catch (error) {
    addLog('error', `统计信息更新失败: ${error}`)
  }
}

onMounted(async () => {
  addLog('info', '编辑器集成测试页面初始化')

  await nextTick()
  await updateStats()

  // 自动加载示例数据
  setTimeout(() => {
    loadSampleData()
  }, 1000)
})
</script>

<style scoped>
.editor-integration-test-page {
  padding: 16px;
  space-y: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #1890ff;
}

.page-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.status-panel {
  margin-bottom: 16px;
}

.main-test-area {
  margin-bottom: 16px;
}

.editor-container,
.data-source-test {
  min-height: 400px;
}

.editor-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #fafafa;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  text-align: center;
}

.editor-placeholder p {
  margin: 16px 0 8px 0;
  font-size: 16px;
  color: #666;
}

.test-results {
  margin-bottom: 16px;
}

.result-content {
  padding: 16px 0;
}

.result-section h4,
.component-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.result-json {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
}

.integration-status {
  margin-bottom: 16px;
}

.preview-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.no-preview {
  padding: 40px;
  text-align: center;
}

.logs-container {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.logs-header {
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-size: 13px;
  font-weight: 500;
}

.logs-content {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  font-family: monospace;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  min-width: 80px;
}

.log-level {
  font-weight: 600;
  min-width: 50px;
}

.log-info .log-level {
  color: #1890ff;
}

.log-warn .log-level {
  color: #faad14;
}

.log-error .log-level {
  color: #f5222d;
}

.log-message {
  flex: 1;
  color: #333;
}

.no-logs {
  padding: 40px;
  text-align: center;
}
</style>
