<!--
  可视化编辑器主工具栏组件
  统一管理公共工具栏和渲染器特有工具栏
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NModal,
  useThemeVars,
  NSpace,
  NButton,
  NSelect,
  NDivider,
  NPopconfirm,
  NTooltip,
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  NColorPicker,
  useMessage,
  type FormInst
} from 'naive-ui'
import CommonToolbar from './CommonToolbar.vue'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'
import DataSourceTriggerPanel from '../DataSourceTriggerPanel.vue'
import { useGlobalPollingManager, type PollingTask as GlobalPollingTask } from '../../core/GlobalPollingManager'
import { editorDataSourceManager } from '../../core/EditorDataSourceManager'

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
// 数据源触发器面板显示状态
const showDataSourcePanel = ref(false)
// 添加轮询任务弹窗显示状态
const showAddPollingDialog = ref(false)

// 消息提示
const message = useMessage()

// 全局轮询管理器
const globalPollingManager = useGlobalPollingManager()

// 全局轮询开关状态
const globalPollingEnabled = computed(() => globalPollingManager.isGlobalPollingEnabled())

// 轮询统计信息
const pollingStats = computed(() => globalPollingManager.getStatistics())

// 切换全局轮询开关
const handleToggleGlobalPolling = () => {
  const newState = globalPollingManager.toggleGlobalPolling()
  message.success(newState ? '全局轮询已启用' : '全局轮询已关闭')
}

// 轮询任务相关状态
interface PollingTask {
  componentId: string
  componentName: string
  interval: number
  active: boolean
  taskId?: string // 全局管理器中的任务ID
}

interface NewPollingTask {
  componentId: string
  interval: number
  autoStart: boolean
}

// 轮询任务列表（基于全局管理器的数据）
const pollingTasks = computed<PollingTask[]>(() => {
  return globalPollingManager.getAllTasks().map(task => ({
    componentId: task.componentId,
    componentName: task.componentName,
    interval: task.interval,
    active: task.active,
    taskId: task.id
  }))
})

// 新建轮询任务表单
const newPollingTask = ref<NewPollingTask>({
  componentId: '',
  interval: 5000,
  autoStart: true
})

// 表单引用
const addPollingFormRef = ref<FormInst>()

// 表单验证规则
const pollingTaskRules = {
  componentId: {
    required: true,
    message: '请选择要轮询的组件',
    trigger: ['blur', 'change']
  },
  interval: {
    type: 'number',
    required: true,
    min: 2000,
    message: '轮询间隔不能低于2000ms',
    trigger: ['blur', 'change']
  }
}

// 从编辑器状态获取真实的组件列表（具有数据源配置的组件）
const availableComponentsForPolling = computed(() => {
  try {
    // 获取编辑器数据源管理器中所有已注册的组件
    const allDataSourceConfigs = globalPollingManager.getAllTasks()
    const registeredComponents = new Set(allDataSourceConfigs.map(task => task.componentId))

    // 获取编辑器数据源管理器中的组件配置
    const editorConfigs = editorDataSourceManager?.getAllComponentConfigs?.()
    if (!editorConfigs) {
      return []
    }

    // 构建可用组件列表
    const availableComponents = Array.from(editorConfigs.values())
      .filter(config => {
        // 只包含已启用且有有效数据源配置的组件
        return config.enabled && config.config && !registeredComponents.has(config.componentId)
      })
      .map(config => ({
        label: `${config.componentType} (${config.componentId.slice(0, 8)}...)`,
        value: config.componentId,
        componentType: config.componentType,
        dataSourceType: config.config?.type || 'unknown'
      }))
    return availableComponents
  } catch (error) {
    return []
  }
})

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
  colNum: 12,
  rowHeight: 80,
  margin: [10, 10],
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
  emit('mode-change', mode)
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

// 切换配置面板显示状态
const handleToggleRendererConfig = () => {
  showConfigPanel.value = !showConfigPanel.value
}

// 切换数据源触发器面板显示状态
const handleToggleDataSourcePanel = () => {
  showDataSourcePanel.value = !showDataSourcePanel.value
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
    input.addEventListener('change', e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = event => {
          try {
            const config = JSON.parse(event.target?.result as string)
            emit('import-config', config)
          } catch (error) {
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
    return $t('visualEditor.canvasConfig')
  } else if (isGridstackRenderer.value) {
    return $t('visualEditor.gridConfig')
  } else if (isVisualizationRenderer.value) {
    return $t('visualEditor.visualizationConfig')
  }
  return $t('visualEditor.rendererConfig')
}

// 轮询任务管理方法
const handleComponentSelect = (componentId: string) => {
  try {
    // 获取组件的数据源配置，根据数据源类型设置合适的默认间隔
    const componentConfig = editorDataSourceManager.getComponentConfig(componentId)
    if (componentConfig?.config) {
      const dataSourceType = componentConfig.config.type

      // 根据数据源类型设置推荐的轮询间隔
      let recommendedInterval = 5000 // 默认5秒
      switch (dataSourceType) {
        case 'api':
        case 'http':
          recommendedInterval = 10000 // API请求建议10秒
          break
        case 'websocket':
          recommendedInterval = 30000 // WebSocket连接建议30秒检查
          break
        case 'database':
          recommendedInterval = 15000 // 数据库查询建议15秒
          break
        case 'mqtt':
          recommendedInterval = 20000 // MQTT建议20秒
          break
        default:
          recommendedInterval = 5000
      }

      // 更新表单的默认间隔
      newPollingTask.value.interval = recommendedInterval
    }
  } catch (error) {
  }
}

const handleAddPollingTask = async () => {
  if (!addPollingFormRef.value) return

  try {
    await addPollingFormRef.value.validate()

    const selectedComponent = availableComponentsForPolling.value.find(
      c => c.value === newPollingTask.value.componentId
    )

    if (!selectedComponent) {
      message.error('请选择有效的组件')
      return
    }

    // 使用全局轮询管理器添加任务
    const taskId = globalPollingManager.addTask({
      componentId: newPollingTask.value.componentId,
      componentName: selectedComponent.label,
      interval: newPollingTask.value.interval,
      autoStart: newPollingTask.value.autoStart,
      callback: () => {
        // TODO: 这里应该调用实际的数据源更新逻辑
        // editorDataSourceManager.triggerComponentUpdate(newPollingTask.value.componentId)
      }
    })

    // 重置表单
    newPollingTask.value = {
      componentId: '',
      interval: 5000,
      autoStart: true
    }

    showAddPollingDialog.value = false
    message.success(`轮询任务"${selectedComponent.label}"添加成功`)
  } catch (error) {
    message.error('添加轮询任务失败')
  }
}

const togglePollingTask = (componentId: string) => {
  const task = pollingTasks.value.find(t => t.componentId === componentId)
  if (!task || !task.taskId) return

  if (task.active) {
    stopPollingTask(componentId)
  } else {
    startPollingTask(componentId)
  }
}

const startPollingTask = (componentId: string) => {
  const task = pollingTasks.value.find(t => t.componentId === componentId)
  if (!task || !task.taskId) return

  const success = globalPollingManager.startTask(task.taskId)
  if (success) {
    message.success(`轮询任务"${task.componentName}"已启动`)
  } else {
    message.error(`启动轮询任务"${task.componentName}"失败`)
  }
}

const stopPollingTask = (componentId: string) => {
  const task = pollingTasks.value.find(t => t.componentId === componentId)
  if (!task || !task.taskId) return

  const success = globalPollingManager.stopTask(task.taskId)
  if (success) {
    message.info(`轮询任务"${task.componentName}"已停止`)
  } else {
    message.error(`停止轮询任务"${task.componentName}"失败`)
  }
}

const removePollingTask = (componentId: string) => {
  const task = pollingTasks.value.find(t => t.componentId === componentId)
  if (!task || !task.taskId) return

  const success = globalPollingManager.removeTask(task.taskId)
  if (success) {
    message.success(`轮询任务"${task.componentName}"已删除`)
  } else {
    message.error(`删除轮询任务"${task.componentName}"失败`)
  }
}
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
                <SvgIcon icon="material-symbols:upload" />
              </template>
            </NButton>

            <NButton size="small" type="tertiary" @click="handleExport">
              <template #icon>
                <SvgIcon icon="material-symbols:download" />
              </template>
            </NButton>
          </div>

          <!-- 编辑操作组 -->
          <div class="btn-group">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" :disabled="readonly" @click="handleUndo">
                  <template #icon>
                    <SvgIcon icon="material-symbols:undo" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.shortcuts.undo') }}</span>
            </NTooltip>

            <NTooltip trigger="hover">
              <template #trigger>
                <NButton size="small" type="tertiary" :disabled="readonly" @click="handleRedo">
                  <template #icon>
                    <SvgIcon icon="material-symbols:redo" />
                  </template>
                </NButton>
              </template>
              <span>{{ $t('visualEditor.shortcuts.redo') }}</span>
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
              <span>{{ $t('visualEditor.clearAllConfirm') }}</span>
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
          <NButton size="small" type="tertiary" @click="handleToggleRendererConfig">
            <template #icon>
              <SvgIcon icon="material-symbols:settings-outline" />
            </template>
          </NButton>

          <!-- 数据源触发器管理按钮 -->
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton size="small" type="info" @click="handleToggleDataSourcePanel">
                <template #icon>
                  <SvgIcon icon="material-symbols:data-usage-outline" />
                </template>
              </NButton>
            </template>
            <span>{{ $t('dataSource.trigger.management') }}</span>
          </NTooltip>
        </template>

        <!-- 编辑/预览切换按钮 - 始终显示在最右侧 -->
        <NDivider vertical />
        <NButton
          size="small"
          :type="mode === 'edit' ? 'primary' : 'default'"
          @click="handleModeChange(mode === 'edit' ? 'preview' : 'edit')"
        >
          <template #icon>
            <SvgIcon
              :icon="mode === 'edit' ? 'material-symbols:visibility-outline' : 'material-symbols:edit-outline'"
            />
          </template>
          {{ mode === 'edit' ? $t('visualEditor.preview') : $t('visualEditor.edit') }}
          <!-- 调试信息 -->
          <span style="font-size: 10px; margin-left: 4px">({{ mode }})</span>
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
            <NFormItem :label="$t('visualEditor.canvasWidth')">
              <NInputNumber
                v-model:value="canvasConfig.width"
                :min="800"
                :max="4000"
                :step="100"
                placeholder="画布宽度"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, width: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.canvasHeight')">
              <NInputNumber
                v-model:value="canvasConfig.height"
                :min="600"
                :max="3000"
                :step="100"
                placeholder="画布高度"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, height: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.showGrid')">
              <NSwitch
                v-model:value="canvasConfig.showGrid"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, showGrid: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.backgroundColor')">
              <NColorPicker
                v-model:value="canvasConfig.backgroundColor"
                @update:value="handleCanvasConfigChange({ ...canvasConfig, backgroundColor: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.gridSize')">
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
            <NFormItem :label="$t('visualEditor.columns')">
              <NInputNumber
                v-model:value="gridstackConfig.colNum"
                :min="6"
                :max="24"
                :step="1"
                placeholder="网格列数"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, colNum: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.rowHeight')">
              <NInputNumber
                v-model:value="gridstackConfig.rowHeight"
                :min="40"
                :max="200"
                :step="10"
                placeholder="单元格高度"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, rowHeight: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.margin')">
              <NInputNumber
                v-model:value="gridstackConfig.margin[0]"
                :min="0"
                :max="30"
                :step="2"
                placeholder="组件间距"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, margin: [$event, $event] })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.draggable')">
              <NSwitch
                v-model:value="gridstackConfig.isDraggable"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, isDraggable: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.resizable')">
              <NSwitch
                v-model:value="gridstackConfig.isResizable"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, isResizable: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.staticGrid')">
              <NSwitch
                v-model:value="gridstackConfig.staticGrid"
                @update:value="handleGridstackConfigChange({ ...gridstackConfig, staticGrid: $event })"
              />
            </NFormItem>

            <!-- 轮询配置区域 -->
            <NDivider title-placement="left">
              <span class="text-14px font-medium">数据源轮询配置</span>
            </NDivider>

            <div class="polling-config-section">
              <div class="mb-4 text-12px text-gray-500">管理面板中组件的数据源轮询任务，设置自动数据更新间隔</div>

              <!-- 轮询任务列表 -->
              <div v-if="pollingTasks.length > 0" class="polling-tasks mb-4">
                <div v-for="task in pollingTasks" :key="task.componentId" class="polling-task-item">
                  <div class="flex items-center justify-between p-3 border rounded">
                    <div class="flex-1">
                      <div class="font-medium text-14px">{{ task.componentName }}</div>
                      <div class="text-12px text-gray-500">
                        间隔：{{ task.interval }}ms | 状态：
                        <span :class="task.active ? 'text-green-500' : 'text-gray-400'">
                          {{ task.active ? '运行中' : '已停止' }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <NButton
                        size="small"
                        :type="task.active ? 'warning' : 'primary'"
                        @click="togglePollingTask(task.componentId)"
                      >
                        {{ task.active ? '停止' : '启动' }}
                      </NButton>
                      <NButton size="small" type="error" @click="removePollingTask(task.componentId)">删除</NButton>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 添加新轮询任务 -->
              <div class="add-polling-task">
                <NButton type="dashed" block @click="showAddPollingDialog = true">
                  <template #icon>
                    <SvgIcon icon="material-symbols:add-circle-outline" />
                  </template>
                  添加轮询任务
                </NButton>
              </div>
            </div>
          </NForm>
        </div>

        <!-- 可视化渲染器配置 -->
        <div v-else-if="isVisualizationRenderer" class="visualization-config">
          <NForm label-placement="left" label-width="100">
            <NFormItem :label="$t('visualEditor.theme')">
              <NSelect
                v-model:value="visualizationConfig.theme"
                :options="[
                  { label: $t('visualEditor.defaultTheme'), value: 'default' },
                  { label: $t('visualEditor.darkTheme'), value: 'dark' },
                  { label: $t('visualEditor.lightTheme'), value: 'light' }
                ]"
                placeholder="选择主题"
                @update:value="handleVisualizationConfigChange({ ...visualizationConfig, theme: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.animation')">
              <NSwitch
                v-model:value="visualizationConfig.animation"
                @update:value="handleVisualizationConfigChange({ ...visualizationConfig, animation: $event })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.responsive')">
              <NSwitch
                v-model:value="visualizationConfig.responsive"
                @update:value="handleVisualizationConfigChange({ ...visualizationConfig, responsive: $event })"
              />
            </NFormItem>
          </NForm>
        </div>
      </div>
    </NModal>

    <!-- 数据源触发器管理面板 - 模态弹窗 -->
    <NModal
      v-model:show="showDataSourcePanel"
      :mask-closable="true"
      :close-on-esc="true"
      preset="card"
      class="data-source-trigger-modal"
      :style="{ width: '1000px', maxWidth: '95vw' }"
      :title="$t('dataSource.trigger.title')"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-labelledby="data-source-modal-title"
      :auto-focus="false"
    >
      <DataSourceTriggerPanel />
    </NModal>

    <!-- 添加轮询任务弹窗 -->
    <NModal
      v-model:show="showAddPollingDialog"
      :mask-closable="true"
      :close-on-esc="true"
      preset="card"
      class="add-polling-modal"
      :style="{ width: '600px', maxWidth: '90vw' }"
      title="添加轮询任务"
      :bordered="false"
      size="medium"
      role="dialog"
      :auto-focus="false"
    >
      <div class="add-polling-content">
        <NForm
          ref="addPollingFormRef"
          :model="newPollingTask"
          :rules="pollingTaskRules"
          label-placement="left"
          label-width="80"
        >
          <NFormItem label="选择组件" path="componentId">
            <NSelect
              v-model:value="newPollingTask.componentId"
              :options="availableComponentsForPolling"
              placeholder="选择一个具有数据源的组件"
              clearable
              @update:value="handleComponentSelect"
            />
          </NFormItem>

          <NFormItem label="轮询间隔" path="interval">
            <NInputNumber
              v-model:value="newPollingTask.interval"
              :min="2000"
              :max="300000"
              :step="1000"
              placeholder="轮询间隔（毫秒）"
              suffix="ms"
              style="width: 100%"
            />
            <template #feedback>建议间隔时间不低于2000ms，避免过于频繁的请求</template>
          </NFormItem>

          <NFormItem label="自动启动" path="autoStart">
            <NSwitch v-model:value="newPollingTask.autoStart" />
            <template #feedback>创建任务后是否立即开始轮询</template>
          </NFormItem>
        </NForm>

        <div class="dialog-actions mt-6 flex justify-end gap-3">
          <NButton @click="showAddPollingDialog = false">取消</NButton>
          <NButton type="primary" @click="handleAddPollingTask">添加任务</NButton>
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

/* 模态弹窗样式 */
.renderer-config-modal {
  --n-border-radius: 12px;
}

.renderer-config-modal :deep(.n-modal-mask) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
}

/* 数据源触发器管理模态弹窗样式 */
.data-source-trigger-modal {
  --n-border-radius: 12px;
}

/* 添加轮询任务模态弹窗样式 */
.add-polling-modal {
  --n-border-radius: 12px;
}

.data-source-trigger-modal :deep(.n-modal-mask) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
}

.data-source-trigger-modal :deep(.n-modal-container) {
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

.data-source-trigger-modal :deep(.n-card) {
  background-color: var(--modal-bg) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  box-shadow: 0 8px 32px var(--toolbar-shadow) !important;
  border: 1px solid var(--modal-border) !important;
}

.data-source-trigger-modal :deep(.n-card-header) {
  background-color: var(--modal-header-bg) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid var(--modal-header-border) !important;
}

.data-source-trigger-modal :deep(.n-card-content) {
  background-color: var(--modal-content-bg) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  padding: 16px !important;
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

/* 轮询配置区域样式 */
.polling-config-section {
  margin-top: 16px;
}

.polling-task-item {
  margin-bottom: 8px;
}

.polling-task-item .border {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.polling-task-item .border:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.add-polling-content {
  padding: 0;
}

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
