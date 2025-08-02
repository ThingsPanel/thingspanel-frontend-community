<!--
  可视化编辑器主工具栏组件
  统一管理公共工具栏和渲染器特有工具栏
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal, useThemeVars, NSpace, NButton, NSelect, NDivider, NPopconfirm, NTooltip, NForm, NFormItem, NInputNumber, NSwitch, NColorPicker } from 'naive-ui'
import CommonToolbar from './CommonToolbar.vue'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'

interface Props {
  mode: 'edit' | 'preview'
  currentRenderer: string
  availableRenderers: Array<{ value: string; label: string; icon?: string }>
  canvasConfig?: Record<string, any>
  gridstackConfig?: Record<string, any>
  visualizationConfig?: Record<string, any>
  readonly?: boolean
  isSaving?: boolean
  hasChanges?: boolean
  showLeftDrawer?: boolean
  showRightDrawer?: boolean
}

interface Emits {
  // 编辑状态控制
  (e: 'mode-change', mode: 'edit' | 'preview'): void
  (e: 'renderer-change', rendererId: string): void
  // 文档操作
  (e: 'save'): void
  (e: 'import'): void
  (e: 'export'): void
  (e: 'import-config', config: Record<string, any>): void
  (e: 'export-config'): void
  // 编辑操作
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'clear-all'): void
  // 视图控制
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'reset-zoom'): void
  (e: 'fit-content'): void
  (e: 'center-view'): void
  (e: 'preview-mode'): void
  // 面板配置
  (e: 'open-config'): void
  (e: 'toggle-left-drawer'): void
  (e: 'toggle-right-drawer'): void
  // 配置变更
  (e: 'canvas-config-change', config: Record<string, any>): void
  (e: 'gridstack-config-change', config: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  canvasConfig: () => ({}),
  gridstackConfig: () => ({}),
  visualizationConfig: () => ({}),
  isSaving: false,
  hasChanges: false,
  showLeftDrawer: false,
  showRightDrawer: false
})

const emit = defineEmits<Emits>()

// 配置面板显示状态
const showConfigPanel = ref(false)

// 主题支持 - 使用Naive UI主题系统
const themeVars = useThemeVars()
const toolbarColors = computed(() => ({
  '--toolbar-bg': themeVars.value.bodyColor,
  '--toolbar-border': themeVars.value.dividerColor,
  '--toolbar-shadow': themeVars.value.boxShadow2,
  '--modal-bg': themeVars.value.modalColor,
  '--modal-header-bg': themeVars.value.cardColor,
  '--modal-content-bg': themeVars.value.bodyColor,
  '--modal-border': themeVars.value.borderColor,
  '--modal-header-border': themeVars.value.dividerColor
}))

// 判断当前渲染器类型
const isCanvasRenderer = computed(() => props.currentRenderer === 'canvas')
const isGridstackRenderer = computed(() => props.currentRenderer === 'gridstack')
const isVisualizationRenderer = computed(() => props.currentRenderer === 'visualization')

// 计算当前配置（提供默认值）
const canvasConfig = computed(() => ({
  width: 1200,
  height: 800,
  showGrid: true,
  backgroundColor: '#f5f5f5',
  gridSize: 20,
  ...props.canvasConfig
}))

const gridstackConfig = computed(() => ({
  columns: 12,
  cellHeight: 80,
  margin: 10,
  draggable: true,
  resizable: true,
  staticGrid: false,
  ...props.gridstackConfig
}))

const visualizationConfig = computed(() => ({
  theme: 'default',
  animation: true,
  responsive: true,
  ...props.visualizationConfig
}))

// 编辑状态控制
const handleModeChange = (mode: 'edit' | 'preview') => emit('mode-change', mode)
const handleRendererChange = (rendererId: string) => emit('renderer-change', rendererId)

// 文档操作
const handleSave = () => emit('save')

// 编辑操作
const handleUndo = () => emit('undo')
const handleRedo = () => emit('redo')
const handleClearAll = () => emit('clear-all')

// 渲染器配置变更
const handleCanvasConfigChange = (config: Record<string, any>) => {
  emit('canvas-config-change', config)
}

const handleGridstackConfigChange = (config: Record<string, any>) => {
  emit('gridstack-config-change', config)
}

const handleVisualizationConfigChange = (config: Record<string, any>) => {
  emit('visualization-config-change', config)
}

// 视图控制事件
const handleZoomIn = () => emit('zoom-in')
const handleZoomOut = () => emit('zoom-out')
const handleResetZoom = () => emit('reset-zoom')
const handleFitContent = () => emit('fit-content')
const handleCenterView = () => emit('center-view')

// 抽屉控制事件
const handleToggleLeftDrawer = () => emit('toggle-left-drawer')
const handleToggleRightDrawer = () => emit('toggle-right-drawer')

// 切换配置面板显示状态
const handleToggleRendererConfig = () => {
  showConfigPanel.value = !showConfigPanel.value
}

// 文件导入导出处理
const fileInputRef = ref<HTMLInputElement>()

const handleImport = () => {
  // 创建一个隐藏的文件输入元素
  if (!fileInputRef.value) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.style.display = 'none'
    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target?.result as string)
            console.log('导入配置:', config)
            emit('import-config', config)
          } catch (error) {
            console.error('导入配置失败:', error)
          }
        }
        reader.readAsText(file)
      }
    })
    fileInputRef.value = input
    document.body.appendChild(input)
  }
  fileInputRef.value.click()
}

const handleExport = () => {
  // 触发导出事件，由父组件提供当前配置
  emit('export-config')
}

// 获取配置面板标题
const getConfigTitle = () => {
  if (isCanvasRenderer.value) {
    return '画布配置'
  } else if (isGridstackRenderer.value) {
    return '网格配置'
  } else if (isVisualizationRenderer.value) {
    return '可视化配置'
  }
  return '渲染器配置'
}
</script>

<template>
  <div
    class="visual-editor-toolbar h-12 flex items-center relative"
    :style="toolbarColors"
  >
    <!-- 左侧：添加组件 -->
    <div class="toolbar-left flex items-center gap-2">
      <!-- 添加组件按钮 - 仅编辑模式显示 -->
      <template v-if="mode === 'edit'">
        <NButton
          size="small"
          :type="showLeftDrawer ? 'primary' : 'default'"
          @click="handleToggleLeftDrawer"
        >
          <template #icon>
            <SvgIcon icon="material-symbols:widgets-outline" />
          </template>
          添加组件
        </NButton>

        <!-- 渲染器选择 -->
        <NDivider vertical />
        <span class="text-12px text-gray-500">渲染器:</span>
        <NSelect
          :value="currentRenderer"
          :options="availableRenderers"
          size="small"
          style="width: 100px"
          @update:value="handleRendererChange"
        />
      </template>
    </div>

    <!-- 右侧：操作按钮组 -->
    <div class="toolbar-right flex items-center">
      <NSpace align="center" :size="4">
        <!-- 编辑模式下的功能 -->
        <template v-if="mode === 'edit'">

          <!-- 文档操作组 -->
          <div class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  size="small"
                  :type="hasChanges ? 'primary' : 'default'"
                  :loading="isSaving"
                  :disabled="readonly"
                  @click="handleSave"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:save-outline" />
                  </template>
                </NButton>
              </template>
              <span>保存 (Ctrl+S)</span>
            </NTooltip>

            <NButton
              size="small"
              type="tertiary"
              :disabled="readonly"
              @click="handleImport"
            >
              <template #icon>
                <SvgIcon icon="material-symbols:upload" />
              </template>
            </NButton>

            <NButton
              size="small"
              type="tertiary"
              @click="handleExport"
            >
              <template #icon>
                <SvgIcon icon="material-symbols:download" />
              </template>
            </NButton>
          </div>

          <!-- 编辑操作组 -->
          <div class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  size="small"
                  type="tertiary"
                  :disabled="readonly"
                  @click="handleUndo"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:undo" />
                  </template>
                </NButton>
              </template>
              <span>撤销 (Ctrl+Z)</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  size="small"
                  type="tertiary"
                  :disabled="readonly"
                  @click="handleRedo"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:redo" />
                  </template>
                </NButton>
              </template>
              <span>重做 (Ctrl+Y)</span>
            </NTooltip>

            <NPopconfirm
              positive-text="确认"
              negative-text="取消"
              @positive-click="handleClearAll"
            >
              <template #trigger>
                <NButton 
                  size="small" 
                  type="error" 
                  secondary
                  :disabled="readonly"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:delete-outline" />
                  </template>
                </NButton>
              </template>
              <span>确定要清空所有内容吗？</span>
            </NPopconfirm>
          </div>

          <!-- Canvas视图控制组 - 仅Canvas模式显示 -->
          <div v-if="isCanvasRenderer" class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  size="small"
                  type="tertiary"
                  @click="handleZoomOut"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:zoom-out" />
                  </template>
                </NButton>
              </template>
              <span>缩小</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  size="small"
                  type="tertiary"
                  @click="handleResetZoom"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:refresh" />
                  </template>
                </NButton>
              </template>
              <span>重置</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton
                  size="small"
                  type="tertiary"
                  @click="handleZoomIn"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:zoom-in" />
                  </template>
                </NButton>
              </template>
              <span>放大</span>
            </NTooltip>
          </div>

          <!-- 配置按钮 -->
          <NButton
            size="small"
            type="tertiary"
            @click="handleToggleRendererConfig"
          >
            <template #icon>
              <SvgIcon icon="material-symbols:settings-outline" />
            </template>
          </NButton>
        </template>

        <!-- 编辑/预览切换按钮 - 始终显示在最右侧 -->
        <NDivider vertical />
        <NButton
          size="small"
          :type="mode === 'edit' ? 'primary' : 'default'"
          @click="handleModeChange(mode === 'edit' ? 'preview' : 'edit')"
        >
          <template #icon>
            <SvgIcon :icon="mode === 'edit' ? 'material-symbols:visibility-outline' : 'material-symbols:edit-outline'" />
          </template>
          {{ mode === 'edit' ? '预览' : '编辑' }}
        </NButton>
      </NSpace>
    </div>

    <!-- 渲染器配置面板 - 模态弹窗 -->
    <NModal
      v-model:show="showConfigPanel"
      :mask-closable="true"
      :close-on-esc="true"
      preset="card"
      class="renderer-config-modal"
      :style="{ width: '800px', maxWidth: '90vw' }"
      :title="getConfigTitle()"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-labelledby="config-modal-title"
      :auto-focus="false"
    >
      <div class="config-content">
        <!-- Canvas 渲染器配置 -->
        <div v-if="isCanvasRenderer" class="canvas-config">
          <NForm label-placement="left" label-width="100">
            <NFormItem label="画布宽度">
              <NInputNumber
                v-model:value="canvasConfig.width"
                :min="800"
                :max="4000"
                :step="100"
                placeholder="画布宽度"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, width: $event })"
              />
            </NFormItem>
            
            <NFormItem label="画布高度">
              <NInputNumber
                v-model:value="canvasConfig.height"
                :min="600"
                :max="3000"
                :step="100"
                placeholder="画布高度"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, height: $event })"
              />
            </NFormItem>
            
            <NFormItem label="显示网格">
              <NSwitch
                v-model:value="canvasConfig.showGrid"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, showGrid: $event })"
              />
            </NFormItem>
            
            <NFormItem label="背景颜色">
              <NColorPicker
                v-model:value="canvasConfig.backgroundColor"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, backgroundColor: $event })"
              />
            </NFormItem>
            
            <NFormItem label="网格大小">
              <NInputNumber
                v-model:value="canvasConfig.gridSize"
                :min="10"
                :max="50"
                :step="5"
                placeholder="网格大小"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, gridSize: $event })"
              />
            </NFormItem>
          </NForm>
        </div>
        
        <!-- Gridstack 渲染器配置 -->
        <div v-else-if="isGridstackRenderer" class="gridstack-config">
          <NForm label-placement="left" label-width="100">
            <NFormItem label="列数">
              <NInputNumber
                v-model:value="gridstackConfig.columns"
                :min="6"
                :max="24"
                :step="1"
                placeholder="网格列数"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, columns: $event })"
              />
            </NFormItem>
            
            <NFormItem label="行高">
              <NInputNumber
                v-model:value="gridstackConfig.cellHeight"
                :min="40"
                :max="200"
                :step="10"
                placeholder="单元格高度"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, cellHeight: $event })"
              />
            </NFormItem>
            
            <NFormItem label="间距">
              <NInputNumber
                v-model:value="gridstackConfig.margin"
                :min="0"
                :max="30"
                :step="2"
                placeholder="组件间距"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, margin: $event })"
              />
            </NFormItem>
            
            <NFormItem label="可拖拽">
              <NSwitch
                v-model:value="gridstackConfig.draggable"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, draggable: $event })"
              />
            </NFormItem>
            
            <NFormItem label="可调整大小">
              <NSwitch
                v-model:value="gridstackConfig.resizable"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, resizable: $event })"
              />
            </NFormItem>
            
            <NFormItem label="静态网格">
              <NSwitch
                v-model:value="gridstackConfig.staticGrid"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, staticGrid: $event })"
              />
            </NFormItem>
          </NForm>
        </div>
        
        <!-- 可视化渲染器配置 -->
        <div v-else-if="isVisualizationRenderer" class="visualization-config">
          <NForm label-placement="left" label-width="100">
            <NFormItem label="主题">
              <NSelect
                v-model:value="visualizationConfig.theme"
                :options="[
                  { label: '默认主题', value: 'default' },
                  { label: '暗色主题', value: 'dark' },
                  { label: '明亮主题', value: 'light' }
                ]"
                placeholder="选择主题"
                @update:value="handleVisualizationConfigChange({ ...visualizationConfig, theme: $event })"
              />
            </NFormItem>
            
            <NFormItem label="动画效果">
              <NSwitch
                v-model:value="visualizationConfig.animation"
                @update:value="handleVisualizationConfigChange({ ...visualizationConfig, animation: $event })"
              />
            </NFormItem>
            
            <NFormItem label="响应式">
              <NSwitch
                v-model:value="visualizationConfig.responsive"
                @update:value="handleVisualizationConfigChange({ ...visualizationConfig, responsive: $event })"
              />
            </NFormItem>
          </NForm>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.visual-editor-toolbar {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--toolbar-bg);
  border-bottom: 1px solid var(--toolbar-border);
  box-shadow: 0 1px 3px var(--toolbar-shadow);
  position: relative;
  z-index: 10;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  padding: 0 16px;
}

.toolbar-left {
  flex-shrink: 0;
  min-width: fit-content;
}

.toolbar-right {
  flex-shrink: 0;
  margin-left: auto;
}

/* 按钮组样式 */
.btn-group {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid transparent;
}

.btn-group:hover {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: var(--toolbar-border);
}

/* 工具栏按钮悬停效果 */
.n-button {
  transition: all 0.2s ease;
}

.n-button:hover {
  transform: translateY(-1px);
}

/* 分割线优化 */
.n-divider--vertical {
  height: 20px;
  margin: 0 8px;
  opacity: 0.6;
}

/* 模态弹窗样式 */
.renderer-config-modal {
  --n-border-radius: 12px;
}

.renderer-config-modal :deep(.n-modal-mask) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
}

.renderer-config-modal :deep(.n-modal-container) {
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

.renderer-config-modal :deep(.n-card) {
  background-color: var(--modal-bg) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  box-shadow: 0 8px 32px var(--toolbar-shadow) !important;
  border: 1px solid var(--modal-border) !important;
}

.renderer-config-modal :deep(.n-card-header) {
  background-color: var(--modal-header-bg) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid var(--modal-header-border) !important;
}

.renderer-config-modal :deep(.n-card-content) {
  background-color: var(--modal-content-bg) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

.config-content {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
  background-color: transparent;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  /* 中等屏幕：隐藏部分按钮文本 */
  .btn-group .n-button .n-button__content {
    padding: 0 8px;
  }
}

@media (max-width: 768px) {
  .visual-editor-toolbar {
    padding: 0 8px;
    height: auto;
    min-height: 48px;
  }
  
  /* 小屏幕：只显示图标 */
  .toolbar-left span {
    display: none;
  }
  
  .btn-group {
    gap: 1px;
    padding: 1px;
  }
  
  .renderer-config-modal {
    margin: 8px;
    width: calc(100vw - 16px) !important;
  }

  .config-content {
    max-height: 50vh;
  }
  
  /* 如果空间太小，隐藏Canvas特有的控制 */
  .btn-group:has(+ .btn-group) {
    display: none;
  }
}

@media (max-width: 480px) {
  /* 超小屏幕：进一步简化 */
  .toolbar-right .n-space {
    gap: 2px !important;
  }
  
  .btn-group:nth-child(n+3) {
    display: none;
  }
}
</style>