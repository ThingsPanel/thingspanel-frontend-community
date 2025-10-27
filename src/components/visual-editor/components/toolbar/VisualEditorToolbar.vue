<!--
  可视化编辑器主工具栏组件
  统一管理公共工具栏和渲染器特有工具栏
-->
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { NModal, useThemeVars, NSpace, NButton, NSelect, NDivider, NPopconfirm, NTooltip, useMessage } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import CommonToolbar from '@/components/visual-editor/components/toolbar/CommonToolbar.vue'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'
import RendererConfigDropdown from '@/components/visual-editor/components/toolbar/RendererConfigDropdown.vue'

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

// 路由管理
const router = useRouter()
const route = useRoute()

// 配置面板显示状态
const showConfigPanel = ref(false)

// 消息提示
const message = useMessage()

// 全屏状态管理
const isFullscreen = ref(false)

// 移除自定义行高状态，由独立组件处理

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

// 选项配置已移至独立的配置组件中

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
  colNum: 24, // 🔥 修复：统一默认为24列
  rowHeight: 80,
  // 🔥 间距配置已在渲染器内部写死，不再从这里传递
  isDraggable: true,
  isResizable: true,
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
const handleModeChange = (mode: 'edit' | 'preview') => {
  if (mode === 'preview') {
    // 跳转到预览页面，在新标签页打开，传递当前渲染器信息
    const panelId = route.query.id
    if (panelId) {
      const previewUrl = router.resolve({
        path: '/ultra-kanban/kanban-preview',
        query: {
          id: panelId,
          renderer: props.currentRenderer // 传递当前选择的渲染器类型
        }
      })
      window.open(previewUrl.href, '_blank')
    } else {
      message.error($t('common.invalidParameter'))
    }
  } else {
    // 编辑模式正常处理
    emit('mode-change', mode)
  }
}
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

/**
 * 全屏切换功能
 * 进入/退出编辑器区域全屏模式（而非整个浏览器页面）
 */
const handleToggleFullscreen = async (event?: Event) => {
  // 🔥 阻止事件冒泡，防止触发其他全屏事件
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  // 查找编辑器容器元素
  const editorWrapper = document.querySelector('.panel-editor-wrapper') as HTMLElement

  if (!editorWrapper) {
    message.warning('未找到编辑器容器')
    return
  }

  // 🔥 修复：直接检查当前是否有全屏元素，而不依赖状态变量
  const currentFullscreenElement =
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement

  console.log('🔍 [Fullscreen Debug] 当前全屏元素:', currentFullscreenElement)
  console.log('🔍 [Fullscreen Debug] 编辑器容器:', editorWrapper)

  if (!currentFullscreenElement) {
    // 进入全屏 - 只全屏编辑器区域
    console.log('🚀 [Fullscreen] 正在进入全屏...')
    try {
      if (editorWrapper.requestFullscreen) {
        await editorWrapper.requestFullscreen()
      } else if ((editorWrapper as any).webkitRequestFullscreen) {
        // Safari 支持
        await (editorWrapper as any).webkitRequestFullscreen()
      } else if ((editorWrapper as any).mozRequestFullScreen) {
        // Firefox 支持
        await (editorWrapper as any).mozRequestFullScreen()
      } else if ((editorWrapper as any).msRequestFullscreen) {
        // IE11 支持
        await (editorWrapper as any).msRequestFullscreen()
      }
      console.log('✅ [Fullscreen] 已进入全屏')
    } catch (error) {
      console.error('❌ [Fullscreen] 进入全屏失败:', error)
    }
  } else {
    // 退出全屏
    console.log('🚪 [Fullscreen] 正在退出全屏...')
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
      console.log('✅ [Fullscreen] 已退出全屏')
    } catch (error) {
      console.error('❌ [Fullscreen] 退出全屏失败:', error)
    }
  }
}

// 监听全屏状态变化
const handleFullscreenChange = () => {
  const currentFullscreenElement =
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement

  isFullscreen.value = !!currentFullscreenElement

  console.log('📺 [Fullscreen Change] 全屏状态改变:', {
    isFullscreen: isFullscreen.value,
    element: currentFullscreenElement,
    elementClass: currentFullscreenElement?.className
  })
}

// 切换配置面板显示状态
const handleToggleRendererConfig = () => {
  showConfigPanel.value = !showConfigPanel.value
}

// 点击外部关闭配置面板 - 优化版
const handleClickOutside = (event: Event) => {
  if (showConfigPanel.value) {
    const target = event.target as HTMLElement
    const dropdown = document.querySelector('.config-dropdown')
    const button = document.querySelector('[data-config-button]')

    // 检查点击是否在下拉菜单内（Naive UI的下拉菜单通常有n-select-menu类）
    const isInDropdownMenu = target.closest(
      '.n-select-menu, .n-color-picker-panel, .n-popover, .v-binder-follower-container'
    )

    // 只有当点击真正在外部时才关闭
    if (dropdown && button && !dropdown.contains(target) && !button.contains(target) && !isInDropdownMenu) {
      showConfigPanel.value = false
    }
  }
}

// 添加全局点击监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  // 移除全屏状态监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})

// 文件导入导出处理
const fileInputRef = ref<HTMLInputElement>()

const handleImport = () => {
  // 创建一个隐藏的文件输入元素
  if (!fileInputRef.value) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.style.display = 'none'
    input.addEventListener('change', e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = event => {
          try {
            const config = JSON.parse(event.target?.result as string)
            emit('import-config', config)
          } catch (error) {}
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

// 标题获取逻辑已移至独立组件
</script>

<template>
  <div class="visual-editor-toolbar h-12 flex items-center relative" :style="toolbarColors">
    <!-- 左侧：添加组件 -->
    <div class="toolbar-left flex items-center gap-2">
      <!-- 添加组件按钮 - 仅编辑模式显示 -->
      <template v-if="mode === 'edit'">
        <NButton size="small" :type="showLeftDrawer ? 'primary' : 'default'" @click="handleToggleLeftDrawer">
          <template #icon>
            <SvgIcon icon="material-symbols:widgets-outline" />
          </template>
          {{ $t('visualEditor.addComponent') }}
        </NButton>

        <!-- 渲染器选择 -->
        <NDivider vertical />
        <span class="text-12px text-gray-500">{{ $t('visualEditor.renderer') }}:</span>
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
                  :disabled="readonly || isCanvasRenderer"
                  @click="handleSave"
                >
                  <template #icon>
                    <SvgIcon icon="material-symbols:save-outline" />
                  </template>
                </NButton>
              </template>
              <span v-if="isCanvasRenderer">Canvas功能开发中，暂不支持保存</span>
              <span v-else>{{ $t('visualEditor.shortcuts.save') }}</span>
            </NTooltip>

            <NButton size="small" type="tertiary" :disabled="readonly" @click="handleImport">
              <template #icon>
                <SvgIcon icon="material-symbols:download" />
              </template>
            </NButton>

            <NButton size="small" type="tertiary" @click="handleExport">
              <template #icon>
                <SvgIcon icon="material-symbols:upload" />
              </template>
            </NButton>
          </div>

          <!-- 编辑操作组 -->
          <div class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" disabled>
                  <template #icon>
                    <SvgIcon icon="material-symbols:undo" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.underDevelopment') }}</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" disabled>
                  <template #icon>
                    <SvgIcon icon="material-symbols:redo" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.underDevelopment') }}</span>
            </NTooltip>

            <NPopconfirm
              :positive-text="$t('visualEditor.confirm')"
              :negative-text="$t('visualEditor.cancel')"
              @positive-click="handleClearAll"
            >
              <template #trigger>
                <NButton size="small" type="error" secondary :disabled="readonly">
                  <template #icon>
                    <SvgIcon icon="material-symbols:delete-outline" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.clearCanvasConfirm') }}</span>
            </NPopconfirm>
          </div>

          <!-- Canvas视图控制组 - 仅Canvas模式显示 -->
          <div v-if="isCanvasRenderer" class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" @click="handleZoomOut">
                  <template #icon>
                    <SvgIcon icon="material-symbols:zoom-out" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.zoomOut') }}</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" @click="handleResetZoom">
                  <template #icon>
                    <SvgIcon icon="material-symbols:refresh" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.reset') }}</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" @click="handleZoomIn">
                  <template #icon>
                    <SvgIcon icon="material-symbols:zoom-in" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.zoomIn') }}</span>
            </NTooltip>
          </div>

          <!-- 配置按钮 -->
          <NButton size="small" type="tertiary" data-config-button @click="handleToggleRendererConfig">
            <template #icon>
              <SvgIcon icon="material-symbols:settings-outline" />
            </template>
          </NButton>

          <!-- 全屏按钮 -->
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton size="small" type="tertiary" @click.stop.prevent="handleToggleFullscreen($event)">
                <template #icon>
                  <SvgIcon
                    :icon="isFullscreen ? 'material-symbols:fullscreen-exit' : 'material-symbols:fullscreen'"
                  />
                </template>
              </NButton>
            </template>
            <span>{{ isFullscreen ? $t('visualEditor.exitFullscreen') : $t('visualEditor.fullscreen') }}</span>
          </NTooltip>
        </template>

        <!-- 编辑/预览按钮 - 预览改为跳转新页面 -->
        <NDivider vertical />
        <NButton
          size="small"
          type="primary"
          @click="handleModeChange('preview')"
        >
          <template #icon>
            <SvgIcon icon="material-symbols:visibility-outline" />
          </template>
          {{ $t('visualEditor.preview') }}
        </NButton>
      </NSpace>
    </div>

    <!-- 渲染器配置下拉面板 - 更简洁的交互 -->
    <RendererConfigDropdown
      :show="showConfigPanel"
      :current-renderer="currentRenderer"
      :canvas-config="canvasConfig"
      :gridstack-config="gridstackConfig"
      :visualization-config="visualizationConfig"
      @canvas-config-change="handleCanvasConfigChange"
      @gridstack-config-change="handleGridstackConfigChange"
      @visualization-config-change="handleVisualizationConfigChange"
    />
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
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
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

/* 移除弹窗相关样式，由独立组件处理 */

.dialog-actions {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
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

  .btn-group:nth-child(n + 3) {
    display: none;
  }
}
</style>
