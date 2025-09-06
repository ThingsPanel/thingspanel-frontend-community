<script setup lang="ts">
/**
 * PanelEditorV2 测试页面
 * 用于验证基于 PanelLayout 的新编辑器功能
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { NCard, NSpace, NButton, NSwitch, NSelect, NInputNumber, NDivider } from 'naive-ui'
import PanelEditorV2 from '@/components/visual-editor/PanelEditorV2.vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()

onMounted(() => {
  // appStore.setFullContent(true)
})

onUnmounted(() => {
  // appStore.setFullContent(false)
})
// 测试配置状态
const testConfig = ref({
  panelId: 'test-panel-v2-001',
  showToolbar: true,
  showPageHeader: true,
  enableHeaderArea: true,
  enableToolbarArea: true,
  enableFooterArea: false,
  customLayoutClass: ''
})

// 布局预设选项
const layoutPresets = [
  { label: '完整编辑器', value: 'full' },
  { label: '纯净编辑器', value: 'clean' },
  { label: '仅工具栏', value: 'toolbar-only' },
  { label: '仅标题栏', value: 'header-only' },
  { label: '最小化', value: 'minimal' }
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

// 编辑器事件处理
const handleStateManagerReady = (stateManager: any) => {
  console.log('V2 State Manager Ready:', stateManager)
}

const handleWidgetAdded = (widget: any) => {
  console.log('V2 Widget Added:', widget)
}

const handleNodeSelect = (nodeId: string) => {
  console.log('V2 Node Selected:', nodeId)
}
</script>

<template>
  <div class="test-page">
    <!-- 测试控制面板 -->
    <NCard class="control-panel" title="PanelEditorV2 测试控制台" size="small">
      <NSpace vertical>
        <div class="config-row">
          <NSpace align="center">
            <span class="config-label">布局预设:</span>
            <NSelect :options="layoutPresets" placeholder="选择预设" style="width: 150px" @update:value="applyPreset" />
          </NSpace>
        </div>

        <NDivider style="margin: 12px 0" />

        <div class="config-grid">
          <div class="config-item">
            <span>显示工具栏:</span>
            <NSwitch v-model:value="testConfig.showToolbar" />
          </div>

          <div class="config-item">
            <span>显示标题栏:</span>
            <NSwitch v-model:value="testConfig.showPageHeader" />
          </div>

          <div class="config-item">
            <span>启用标题区域:</span>
            <NSwitch v-model:value="testConfig.enableHeaderArea" />
          </div>

          <div class="config-item">
            <span>启用工具栏区域:</span>
            <NSwitch v-model:value="testConfig.enableToolbarArea" />
          </div>

          <div class="config-item">
            <span>启用底部状态栏:</span>
            <NSwitch v-model:value="testConfig.enableFooterArea" />
          </div>
        </div>

        <div class="status-info">
          <NSpace>
            <span class="status-tag new">V2版本</span>
            <span class="status-tag">基于PanelLayout</span>
            <span class="status-tag">滚动修复</span>
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
        @state-manager-ready="handleStateManagerReady"
        @widget-added="handleWidgetAdded"
        @node-select="handleNodeSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.test-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f7;
}

.control-panel {
  flex-shrink: 0;
  margin: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-row {
  padding: 8px 0;
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
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  font-size: 13px;
}

.status-info {
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: #f0f0f0;
  color: #666;
}

.status-tag.new {
  background: #10b981;
  color: white;
}

.editor-container {
  flex: 1;
  margin: 0 8px 8px 8px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
  min-height: 0; /* 关键：确保flex布局正常 */
}

/* 深色主题适配 */
[data-theme='dark'] .test-page {
  background: #1a1a1a;
}

[data-theme='dark'] .config-item {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme='dark'] .status-tag {
  background: #333;
  color: #ccc;
}
</style>
