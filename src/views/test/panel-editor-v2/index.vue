<script setup lang="ts">
/**
 * PanelEditorV2 测试页面
 * 用于验证基于 PanelLayout 的新编辑器功能
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NSpace, NButton, NSwitch, NSelect, NInputNumber, NDivider } from 'naive-ui'
import PanelEditorV2 from '@/components/visual-editor/PanelEditorV2.vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import type { RendererType } from '@/components/visual-editor/types/renderer'

const appStore = useAppStore()

onMounted(() => {
  // appStore.setFullContent(true)
})

onUnmounted(() => {
  // appStore.setFullContent(false)
})

const route = useRoute()
const panel_id = (route.query.id as string) || '72da0887-52f9-b546-27ce-e4c06ea07ca7'

// 测试配置状态
const testConfig = ref({
  panelId: panel_id,
  showToolbar: true,
  showPageHeader: true,
  enableHeaderArea: true,
  enableToolbarArea: true,
  enableFooterArea: true, // 🔥 默认打开底部状态栏
  customLayoutClass: '',
  defaultRenderer: 'gridstack' as RendererType // 🔥 新增：默认渲染器设置
})

// 布局预设选项
const layoutPresets = [
  { label: '完整编辑器', value: 'full' },
  { label: '纯净编辑器', value: 'clean' },
  { label: '仅工具栏', value: 'toolbar-only' },
  { label: '仅标题栏', value: 'header-only' },
  { label: '最小化', value: 'minimal' }
]

// 🔥 渲染器选项
const rendererOptions = [
  { label: 'GridStack 渲染器', value: 'gridstack' },
  { label: 'Canvas 渲染器', value: 'canvas' }
]

// 应用布局预设
const applyPreset = (preset: string) => {
  switch (preset) {
    case 'full':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: true,
        showPageHeader: true,
        enableHeaderArea: true,
        enableToolbarArea: true,
        enableFooterArea: true
      }
      break
    case 'clean':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: false,
        showPageHeader: false,
        enableHeaderArea: false,
        enableToolbarArea: false,
        enableFooterArea: false
      }
      break
    case 'toolbar-only':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: true,
        showPageHeader: false,
        enableHeaderArea: false,
        enableToolbarArea: true,
        enableFooterArea: false
      }
      break
    case 'header-only':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: false,
        showPageHeader: true,
        enableHeaderArea: true,
        enableToolbarArea: false,
        enableFooterArea: false
      }
      break
    case 'minimal':
      testConfig.value = {
        ...testConfig.value,
        showToolbar: false,
        showPageHeader: false,
        enableHeaderArea: false,
        enableToolbarArea: false,
        enableFooterArea: true
      }
      break
  }
}

// 🔥 编辑器状态跟踪
const editorState = ref({
  isReady: false,
  selectedNodeId: '',
  totalWidgets: 0,
  isLoading: true,
  lastAction: '',
  hasError: false,
  errorMessage: ''
})

// 编辑器事件处理
const handleStateManagerReady = (stateManager: any) => {
  try {
    console.log('V2 State Manager Ready:', stateManager)
    editorState.value.isReady = true
    editorState.value.isLoading = false
    editorState.value.totalWidgets = stateManager?.nodes?.length || 0
    editorState.value.lastAction = '编辑器已就绪'
    editorState.value.hasError = false
    editorState.value.errorMessage = ''
  } catch (error) {
    editorState.value.hasError = true
    editorState.value.errorMessage = `状态管理器初始化失败: ${error}`
    editorState.value.isLoading = false
  }
}

const handleWidgetAdded = (widget: any) => {
  try {
    console.log('V2 Widget Added:', widget)
    editorState.value.totalWidgets++
    editorState.value.lastAction = `添加组件: ${widget.type}`
  } catch (error) {
    editorState.value.hasError = true
    editorState.value.errorMessage = `组件添加失败: ${error}`
  }
}

const handleNodeSelect = (nodeId: string) => {
  try {
    console.log('V2 Node Selected:', nodeId)
    editorState.value.selectedNodeId = nodeId
    editorState.value.lastAction = nodeId ? `选中组件: ${nodeId}` : '取消选中'
  } catch (error) {
    editorState.value.hasError = true
    editorState.value.errorMessage = `组件选择失败: ${error}`
  }
}

const handleEditorReady = (editor: any) => {
  try {
    console.log('V2 Editor Ready:', editor)
    editorState.value.lastAction = '编辑器核心已初始化'
  } catch (error) {
    editorState.value.hasError = true
    editorState.value.errorMessage = `编辑器初始化失败: ${error}`
  }
}
</script>

<template>
  <div class="test-page">
    <!-- 测试控制面板 -->
    <NCard class="control-panel" title="PanelEditorV2 测试控制台" size="small">
      <NSpace vertical>

        <!-- 🔥 超紧凑控制行 -->
        <div class="compact-controls">
          <NSpace size="small" align="center">
            <span class="mini-label">预设:</span>
            <NSelect :options="layoutPresets" size="small" style="width: 100px" @update:value="applyPreset" />
            
            <NDivider vertical />
            
            <span class="mini-label">渲染器:</span>
            <NSelect v-model:value="testConfig.defaultRenderer" :options="rendererOptions" size="small" style="width: 90px" />
            
            <NDivider vertical />
            
            <span class="mini-label">工具栏</span>
            <NSwitch v-model:value="testConfig.showToolbar" size="small" />
            
            <span class="mini-label">标题</span>
            <NSwitch v-model:value="testConfig.showPageHeader" size="small" />
            
            <span class="mini-label">底栏</span>
            <NSwitch v-model:value="testConfig.enableFooterArea" size="small" />
          </NSpace>
        </div>

        <div class="status-info">
          <NSpace justify="space-between" align="center">
            <NSpace size="small">
              <span class="status-tag new">V2</span>
              <span class="status-tag">PanelLayout</span>
              <span :class="['status-tag', { ready: editorState.isReady, loading: editorState.isLoading, error: editorState.hasError }]">
                {{ editorState.isLoading ? '加载中' : editorState.isReady ? '就绪' : editorState.hasError ? '错误' : '未就绪' }}
              </span>
            </NSpace>
            <NSpace size="small" v-if="editorState.isReady">
              <span class="status-mini">组件: {{ editorState.totalWidgets }}</span>
              <span class="status-mini" v-if="editorState.selectedNodeId">选中: {{ editorState.selectedNodeId.slice(0, 8) }}...</span>
            </NSpace>
          </NSpace>
        </div>
      </NSpace>
    </NCard>

    <!-- PanelEditorV2 测试实例 -->
    <div class="editor-container">
      <PanelEditorV2
        :panel-id="testConfig.panelId"
        :show-toolbar="testConfig.showToolbar"
        :show-page-header="testConfig.showPageHeader"
        :enable-header-area="testConfig.enableHeaderArea"
        :enable-toolbar-area="testConfig.enableToolbarArea"
        :enable-footer-area="testConfig.enableFooterArea"
        :custom-layout-class="testConfig.customLayoutClass"
        :default-renderer="testConfig.defaultRenderer"
        @state-manager-ready="handleStateManagerReady"
        @widget-added="handleWidgetAdded"
        @node-select="handleNodeSelect"
        @editor-ready="handleEditorReady"
      />
    </div>
  </div>
</template>

<style scoped>
.test-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--body-color);
}

.control-panel {
  flex-shrink: 0;
  margin: 2px 8px 4px 8px; /* 🔥 进一步减少边距 */
  border-radius: 4px;
  box-shadow: var(--box-shadow);
  max-height: 80px; /* 🔥 极大压缩高度 */
  overflow: hidden; /* 🔥 不需要滚动 */
}

.config-row {
  padding: 4px 0; /* 🔥 减少内边距 */
}

.compact-controls {
  padding: 4px 0; /* 🔥 紧凑控制行 */
}

.mini-label {
  font-size: 12px;
  color: var(--text-color-2);
  white-space: nowrap;
}

.config-label {
  font-weight: 500;
  min-width: 80px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--modal-color);
  border-radius: 4px;
  font-size: 13px;
}

.status-info {
  padding: 4px 0 2px 0; /* 🔥 极小内边距 */
  border-top: 1px solid var(--divider-color);
}

.status-tag {
  padding: 1px 6px; /* 🔥 更小的标签 */
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  background: var(--modal-color);
  color: var(--text-color-2);
}

.status-tag.new {
  background: var(--success-color);
  color: white;
}

.status-tag.ready {
  background: var(--success-color);
  color: white;
}

.status-tag.loading {
  background: var(--warning-color);
  color: white;
}

.status-tag.error {
  background: var(--error-color);
  color: white;
}

.status-mini {
  font-size: 10px; /* 🔥 更小字体 */
  color: var(--text-color-2);
  padding: 1px 4px; /* 🔥 更小内边距 */
  background: var(--modal-color);
  border-radius: 3px;
}

.editor-container {
  flex: 1;
  margin: 0 8px 4px 8px; /* 🔥 减少底部边距 */
  border-radius: 6px;
  overflow: hidden;
  box-shadow: var(--box-shadow);
  background: var(--card-color);
  min-height: 0; /* 关键：确保flex布局正常 */
}
</style>
