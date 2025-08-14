<template>
  <div class="editor-integration-test">
    <!-- 页面头部 -->
    <div class="test-header">
      <n-page-header @back="$router.back()">
        <template #title>编辑器集成测试</template>
        <template #subtitle>Visual Editor 和数据过滤器功能集成测试</template>
      </n-page-header>
    </div>

    <!-- 主要内容区域 -->
    <div class="test-content">
      <!-- 左侧：Visual Editor -->
      <div class="editor-panel">
        <n-card title="Visual Editor" size="small">
          <PanelEditor
            v-model:selected-widget-id="selectedWidgetId"
            :widget-library="widgetLibrary"
            :show-toolbar="true"
            :show-widget-library="true"
            :editable="true"
            renderer-type="canvas"
            @widget-select="handleWidgetSelect"
            @widget-add="handleWidgetAdd"
            @widget-update="handleWidgetUpdate"
            @widget-delete="handleWidgetDelete"
          />
        </n-card>
      </div>

      <!-- 右侧：配置面板 -->
      <div class="config-panel">
        <n-card title="组件配置" size="small">
          <ConfigurationPanel
            :selected-widget="selectedWidget"
            :readonly="false"
            @multi-data-source-update="handleDataSourceUpdate"
          />
        </n-card>
      </div>
    </div>

    <!-- 底部：测试状态和日志 -->
    <div class="test-status">
      <n-card title="测试状态" size="small">
        <n-space vertical>
          <!-- 当前选中组件信息 -->
          <div v-if="selectedWidget" class="current-widget-info">
            <n-descriptions :column="3" size="small" bordered>
              <n-descriptions-item label="组件类型">
                {{ selectedWidget.type }}
              </n-descriptions-item>
              <n-descriptions-item label="组件名称">
                {{ getWidgetDisplayName(selectedWidget) }}
              </n-descriptions-item>
              <n-descriptions-item label="组件ID">
                {{ selectedWidget.id }}
              </n-descriptions-item>
            </n-descriptions>
          </div>

          <!-- 数据源状态 -->
          <div v-if="dataSourceStatus" class="data-source-status">
            <n-alert type="success" size="small">
              <template #header>数据源更新</template>
              <div>最后更新时间: {{ new Date(dataSourceStatus.lastUpdate).toLocaleString() }}</div>
              <div>数据源数量: {{ dataSourceStatus.count }}</div>
            </n-alert>
          </div>

          <!-- 测试日志 -->
          <div class="test-logs">
            <n-log 
              :log="testLogs.join('\n')" 
              :rows="8"
              language="log"
              trim
            />
          </div>
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 编辑器集成测试页面
 * 专门用于测试数据过滤器和 Visual Editor 集成功能
 */

import { ref, computed, onMounted } from 'vue'
import { 
  NCard, 
  NPageHeader, 
  NSpace, 
  NDescriptions, 
  NDescriptionsItem,
  NAlert,
  NLog
} from 'naive-ui'

// 导入编辑器组件
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'
import ConfigurationPanel from '@/components/visual-editor/configuration/ConfigurationPanel.vue'

// 导入类型
import type { VisualEditorWidget } from '@/components/visual-editor/types'

// 响应式状态
const selectedWidgetId = ref<string>('')
const selectedWidget = ref<VisualEditorWidget | null>(null)
const testLogs = ref<string[]>([])
const dataSourceStatus = ref<{
  lastUpdate: number
  count: number
} | null>(null)

// 添加测试日志
const addTestLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  testLogs.value.push(`[${timestamp}] ${message}`)
  
  // 保持最近的50条日志
  if (testLogs.value.length > 50) {
    testLogs.value = testLogs.value.slice(-50)
  }
}

// Widget Library 配置
const widgetLibrary = ref({
  showCategories: true,
  collapsible: true,
  searchable: true
})

// 获取组件显示名称
const getWidgetDisplayName = (widget: VisualEditorWidget) => {
  return widget.metadata?.card2Definition?.name || widget.type || 'Unknown Component'
}

// 事件处理器
const handleWidgetSelect = (widget: VisualEditorWidget | null) => {
  selectedWidget.value = widget
  if (widget) {
    addTestLog(`选中组件: ${getWidgetDisplayName(widget)} (${widget.id})`)
  } else {
    addTestLog('取消选中组件')
  }
}

const handleWidgetAdd = (widget: VisualEditorWidget) => {
  addTestLog(`添加组件: ${getWidgetDisplayName(widget)} (${widget.id})`)
}

const handleWidgetUpdate = (widget: VisualEditorWidget) => {
  addTestLog(`更新组件: ${getWidgetDisplayName(widget)} (${widget.id})`)
}

const handleWidgetDelete = (widgetId: string) => {
  addTestLog(`删除组件: ${widgetId}`)
}

const handleDataSourceUpdate = (widgetId: string, dataSources: Record<string, any>) => {
  addTestLog(`数据源更新: ${widgetId}, 数据源数量: ${Object.keys(dataSources).length}`)
  
  // 记录详细的数据源信息
  Object.entries(dataSources).forEach(([key, data]) => {
    const dataType = Array.isArray(data) ? 'array' : typeof data
    const dataSize = Array.isArray(data) ? data.length : (typeof data === 'object' && data ? Object.keys(data).length : 'N/A')
    addTestLog(`  - ${key}: ${dataType} (${dataSize}${Array.isArray(data) ? ' items' : ' fields'})`)
  })
  
  // 更新数据源状态
  dataSourceStatus.value = {
    lastUpdate: Date.now(),
    count: Object.keys(dataSources).length
  }
}

// 组件挂载时的初始化
onMounted(() => {
  addTestLog('编辑器集成测试页面已加载')
  addTestLog('可以从左侧组件库添加组件进行测试')
  addTestLog('重点测试带有数据源配置的组件（如：过滤数据展示、对象数据源示例等）')
})
</script>

<style scoped>
.editor-integration-test {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--body-color);
}

.test-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.test-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.editor-panel {
  height: 100%;
  overflow: hidden;
}

.editor-panel :deep(.n-card__content) {
  height: calc(100vh - 200px);
  padding: 0;
  overflow: hidden;
}

.config-panel {
  height: 100%;
  overflow: hidden;
}

.config-panel :deep(.n-card__content) {
  height: calc(100vh - 200px);
  overflow-y: auto;
}

.test-status {
  height: 300px;
  padding: 0 16px 16px;
  border-top: 1px solid var(--border-color);
}

.test-status :deep(.n-card__content) {
  height: 240px;
  overflow-y: auto;
}

.current-widget-info {
  margin-bottom: 12px;
}

.data-source-status {
  margin-bottom: 12px;
}

.test-logs {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .test-content {
    grid-template-columns: 1fr 300px;
  }
}

@media (max-width: 1200px) {
  .test-content {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 300px;
  }
  
  .config-panel :deep(.n-card__content) {
    height: 260px;
  }
}

@media (max-width: 768px) {
  .test-content {
    padding: 8px;
    gap: 8px;
  }
  
  .test-header {
    padding: 8px;
  }
  
  .test-status {
    padding: 0 8px 8px;
  }
}
</style>