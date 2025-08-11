<template>
  <div class="settings-panel">
    <!-- 全局设置 - 优化布局 -->
    <div v-if="!selectedWidget" class="settings-section">
      <div class="section-header">
        <h3 class="section-title">
          <n-icon size="16"><SettingsOutline /></n-icon>
          全局设置
        </h3>
      </div>

      <div class="form-container">
        <div class="form-item-flat">
          <span class="item-label">组件标题</span>
          <n-switch :value="showWidgetTitles" size="small" @update:value="onToggleWidgetTitles" />
        </div>
      </div>
    </div>

    <!-- 网格配置 - 扁平化设计 -->
    <div v-if="!selectedWidget && gridConfig" class="settings-section">
      <div class="section-header">
        <h3 class="section-title">
          <n-icon size="16"><GridOutline /></n-icon>
          网格配置
        </h3>
      </div>

      <div class="form-container">
        <!-- 数值配置组 -->
        <div class="config-group">
          <div class="group-label">尺寸设置</div>
          <div class="form-grid">
            <div class="form-item-compact">
              <span class="item-label-short">列数</span>
              <n-input-number
                v-model:value="gridConfig.colNum"
                :min="1"
                :max="48"
                size="small"
                @update:value="handleGridConfigChange"
              />
            </div>
            <div class="form-item-compact">
              <span class="item-label-short">行高</span>
              <n-input-number
                v-model:value="gridConfig.rowHeight"
                :min="20"
                :max="200"
                size="small"
                @update:value="handleGridConfigChange"
              />
            </div>
            <div class="form-item-compact">
              <span class="item-label-short">间距</span>
              <n-input-number
                v-model:value="gridConfig.margin[0]"
                :min="0"
                :max="50"
                size="small"
                @update:value="
                  value => {
                    if (props.gridConfig) {
                      props.gridConfig.margin = [value, value]
                      handleGridConfigChange()
                    }
                  }
                "
              />
            </div>
          </div>
        </div>

        <!-- 开关配置组 -->
        <div class="config-group">
          <div class="group-label">交互设置</div>
          <div class="switch-group">
            <div class="form-item-flat">
              <span class="item-label">可拖拽</span>
              <n-switch v-model:value="gridConfig.isDraggable" size="small" @update:value="handleGridConfigChange" />
            </div>
            <div class="form-item-flat">
              <span class="item-label">可调大小</span>
              <n-switch v-model:value="gridConfig.isResizable" size="small" @update:value="handleGridConfigChange" />
            </div>
            <div class="form-item-flat">
              <span class="item-label">静态网格</span>
              <n-switch v-model:value="gridConfig.staticGrid" size="small" @update:value="handleGridConfigChange" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 组件设置 - 优化布局 -->
    <div v-else-if="selectedWidget" class="widget-settings">
      <div class="widget-header">
        <div class="widget-info">
          <h3 class="widget-title">
            <n-ellipsis style="max-width: 140px" tooltip>
              {{ widgetName }}
            </n-ellipsis>
          </h3>
          <n-text depth="3" class="widget-subtitle">属性配置</n-text>
        </div>
      </div>

      <n-tabs type="segment" animated size="small" class="settings-tabs">
        <!-- 数据源配置 - 直接嵌入配置表单 -->
        <n-tab-pane name="dataSource" tab="数据源" display-directive="show">
          <div class="tab-content">
            <div v-if="hasDataSourceSupport" class="data-source-section">
              <!-- 状态指示器 -->
              <div class="status-bar">
                <div class="status-item">
                  <span class="status-label">状态</span>
                  <n-tag :type="dataSourceStatus.type" size="small" round>
                    {{ dataSourceStatus.label }}
                  </n-tag>
                </div>
                <div v-if="editableProps.dataSource" class="status-item">
                  <span class="status-label">类型</span>
                  <n-text depth="2" class="status-value">
                    {{ editableProps.dataSource.type || '数据源测试' }}
                  </n-text>
                </div>
              </div>

              <!-- 直接嵌入数据源配置表单 -->
              <div class="data-source-config-wrapper">
                <DataSourceConfigForm
                  v-if="selectedWidget"
                  :widget="selectedWidget"
                  @data-updated="handleDataSourceUpdate"
                />
              </div>
            </div>

            <!-- 无数据源支持 -->
            <div v-else class="empty-state">
              <n-empty description="该组件不支持数据源配置" size="small" class="compact-empty">
                <template #icon>
                  <DocumentOutline />
                </template>
              </n-empty>
            </div>
          </div>
        </n-tab-pane>

        <!-- 基础配置 - 扁平化设计 -->
        <n-tab-pane name="base" tab="基础" display-directive="show">
          <div class="tab-content">
            <div class="config-group">
              <div class="form-item-flat">
                <span class="item-label">显示标题</span>
                <n-switch v-model:value="editableProps.showLabel" size="small" @update:value="updateNode" />
              </div>
              <div class="form-item-vertical">
                <span class="item-label-top">组件标题</span>
                <n-input
                  v-model:value="editableProps.label"
                  size="small"
                  placeholder="请输入组件标题"
                  @update:value="updateNode"
                />
              </div>
            </div>
          </div>
        </n-tab-pane>

        <!-- 组件属性 - 适配宽度 -->
        <n-tab-pane v-if="hasProperties || hasCustomConfig" name="props" tab="属性" display-directive="show">
          <div class="tab-content">
            <!-- 自定义配置组件 -->
            <div v-if="hasCustomConfig && customConfigComponent" class="custom-config-wrapper">
              <component
                :is="customConfigComponent"
                v-model:modelValue="editableProps.properties"
                :widget="selectedWidget"
                @update:modelValue="updateNode"
              />
            </div>

            <!-- 增强属性表单 -->
            <div v-else-if="hasEnhancedProperties" class="enhanced-form-wrapper">
              <EnhancedPropertyForm
                v-model="editableProps.properties"
                :properties="componentProperties"
                @update:modelValue="updateNode"
              />
            </div>

            <!-- 简单属性表单 - 优化布局 -->
            <div v-else class="properties-form">
              <div v-for="(propDef, key) in selectedWidget.properties" :key="key" class="property-item">
                <div class="form-item-vertical">
                  <span class="item-label-top">
                    <n-ellipsis style="max-width: 100px" tooltip>
                      {{ String(key) }}
                    </n-ellipsis>
                  </span>

                  <n-input
                    v-if="typeof propDef === 'string'"
                    v-model:value="editableProps.properties[key]"
                    size="small"
                    @update:value="updateNode"
                  />
                  <n-input-number
                    v-else-if="typeof propDef === 'number'"
                    v-model:value="editableProps.properties[key]"
                    size="small"
                    @update:value="updateNode"
                  />
                  <n-switch
                    v-else-if="typeof propDef === 'boolean'"
                    v-model:value="editableProps.properties[key]"
                    size="small"
                    @update:value="updateNode"
                  />
                  <n-text v-else depth="3" class="unsupported-type">不支持的类型</n-text>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <!-- 交互配置 - 条件渲染 -->
        <n-tab-pane name="interaction" tab="交互" display-directive="show">
          <div class="tab-content">
            <div class="config-group">
              <div class="form-item-vertical">
                <span class="item-label-top">点击事件</span>
                <n-select
                  v-model:value="editableProps.interaction.onClick.type"
                  :options="interactionTypeOptions"
                  size="small"
                  @update:value="updateNode"
                />
              </div>

              <!-- 动态显示额外配置 -->
              <div v-if="editableProps.interaction.onClick.type !== 'none'" class="interaction-config">
                <div v-if="editableProps.interaction.onClick.type === 'link'" class="link-config">
                  <div class="form-item-vertical">
                    <span class="item-label-top">目标URL</span>
                    <n-input
                      v-model:value="editableProps.interaction.onClick.payload.url"
                      size="small"
                      placeholder="https://example.com"
                      @update:value="updateNode"
                    />
                  </div>
                  <div class="form-item-flat">
                    <span class="item-label">新窗口打开</span>
                    <n-switch
                      v-model:value="editableProps.interaction.onClick.payload.newTab"
                      size="small"
                      @update:value="updateNode"
                    />
                  </div>
                </div>

                <div v-if="editableProps.interaction.onClick.type === 'internal_route'" class="route-config">
                  <div class="form-item-vertical">
                    <span class="item-label-top">内部路由</span>
                    <n-input
                      v-model:value="editableProps.interaction.onClick.payload.route"
                      size="small"
                      placeholder="/dashboard/details"
                      @update:value="updateNode"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
    <!-- 画布设置占位符 - 精简设计 -->
    <div v-else class="canvas-placeholder">
      <div class="placeholder">
        <n-empty description="选择组件以编辑属性" size="small">
          <template #icon>
            <SettingsOutline />
          </template>
          <template #extra>
            <p class="placeholder-text">点击画布中的组件即可在此处配置其属性</p>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NText,
  NTabs,
  NTabPane,
  NSelect,
  NAlert,
  NIcon,
  NTag,
  NEmpty,
  NEllipsis
} from 'naive-ui'
import { SettingsOutline, DocumentOutline, GridOutline } from '@vicons/ionicons5'
import { useEditor } from '../hooks'
import type { VisualEditorWidget } from '../types'
import { cloneDeep } from 'lodash-es'
import { configRegistry } from './ConfigRegistry'
import EnhancedPropertyForm from './components/EnhancedPropertyForm.vue'
import DataSourceConfigForm from '../configuration/forms/DataSourceConfigForm.vue'

const props = defineProps<{
  selectedWidget: VisualEditorWidget | null
  gridConfig?: any
  onGridConfigChange?: (config: any) => void
  showWidgetTitles?: boolean
  onToggleWidgetTitles?: (value: boolean) => void
}>()

const { stateManager } = useEditor()

const editableProps = ref<any>({})

const interactionTypeOptions = [
  { label: '无', value: 'none' },
  { label: '外部链接', value: 'link' },
  { label: '内部路由', value: 'internal_route' }
]

watch(
  () => props.selectedWidget,
  (widget, oldWidget) => {
    // 防止递归更新：只有当widget真正不同时才更新
    if (widget?.id === oldWidget?.id && JSON.stringify(widget) === JSON.stringify(oldWidget)) {
      return
    }

    if (widget) {
      editableProps.value = cloneDeep({
        label: widget.label,
        showLabel: widget.showLabel,
        properties: widget.properties || {},
        interaction: widget.interaction || {
          onClick: { type: 'none', payload: {} }
        },
        dataSource: widget.dataSource || null
      })
    } else {
      editableProps.value = {}
    }
  },
  { immediate: true, deep: true }
)

const widgetName = computed(() => {
  return props.selectedWidget?.metadata?.card2Definition?.meta?.name || props.selectedWidget?.type || ''
})

const hasProperties = computed(() => {
  return (
    props.selectedWidget && props.selectedWidget.properties && Object.keys(props.selectedWidget.properties).length > 0
  )
})

// 检查是否有自定义配置组件
const hasCustomConfig = computed(() => {
  if (!props.selectedWidget) return false
  const componentType = props.selectedWidget.type
  const hasConfig = configRegistry.has(componentType)
  console.log(`🔧 SettingsPanel - 检查配置组件: ${componentType}, 结果: ${hasConfig}`)

  // 添加调试信息
  if (props.selectedWidget.metadata?.isCard2Component) {
    console.log(`🔧 SettingsPanel - 这是一个 Card2.1 组件: ${componentType}`)
    console.log(`🔧 SettingsPanel - 组件 metadata:`, props.selectedWidget.metadata)
  }

  return hasConfig
})

// 获取自定义配置组件
const customConfigComponent = computed(() => {
  if (!props.selectedWidget) return null
  const componentType = props.selectedWidget.type
  const configComponent = configRegistry.get(componentType)
  console.log(`🔧 SettingsPanel - 获取配置组件: ${componentType}`, configComponent)
  return configComponent
})

// 检查是否有增强的属性定义
const hasEnhancedProperties = computed(() => {
  const definition = props.selectedWidget?.metadata?.card2Definition
  return definition && definition.properties && Object.keys(definition.properties).length > 0
})

// 获取组件属性定义
const componentProperties = computed(() => {
  const definition = props.selectedWidget?.metadata?.card2Definition
  return definition?.properties || {}
})

// 获取组件数据源定义
const componentDataSourceDefinitions = computed(() => {
  const definition = props.selectedWidget?.metadata?.card2Definition
  return definition?.dataSourceDefinitions || []
})

// 检查是否支持数据源配置
const hasDataSourceSupport = computed(() => {
  return (
    props.selectedWidget &&
    (props.selectedWidget.metadata?.isCard2Component || componentDataSourceDefinitions.value.length > 0)
  )
})

// 数据源状态
const dataSourceStatus = computed(() => {
  const dataSource = editableProps.value.dataSource

  if (!dataSource) {
    return { type: 'warning', label: '未配置' }
  }

  if (dataSource.type && dataSource.config) {
    return { type: 'success', label: '已配置' }
  }

  return { type: 'info', label: '配置中' }
})

// 处理数据源更新
const handleDataSourceUpdate = (dataSourceUpdateEvent: any) => {
  console.log('🔧 SettingsPanel - 接收到数据源更新事件:', dataSourceUpdateEvent)

  // DataSourceConfigForm 发送的事件包含完整的数据更新信息
  if (dataSourceUpdateEvent && props.selectedWidget) {
    // 更新 widget 的数据源配置
    editableProps.value.dataSource = {
      type: 'data-source-test',
      config: dataSourceUpdateEvent.config || {}
    }

    // 直接更新 widget 的 metadata.card2Data（这是组件真正接收数据的路径）
    if (props.selectedWidget.metadata) {
      props.selectedWidget.metadata.card2Data = dataSourceUpdateEvent.data
    }

    // 通知状态管理器更新节点
    stateManager.updateNode(props.selectedWidget.id, {
      properties: editableProps.value.properties,
      interaction: editableProps.value.interaction,
      dataSource: editableProps.value.dataSource,
      // 同时更新 metadata
      metadata: {
        ...props.selectedWidget.metadata,
        card2Data: dataSourceUpdateEvent.data
      }
    } as any)

    console.log('✅ SettingsPanel - 数据源已更新:', {
      widgetId: props.selectedWidget.id,
      dataSource: editableProps.value.dataSource,
      card2Data: dataSourceUpdateEvent.data
    })
  }
}

// 防抖更新节点
let updateNodeTimer: NodeJS.Timeout | null = null
const updateNode = () => {
  // 清除之前的定时器
  if (updateNodeTimer) {
    clearTimeout(updateNodeTimer)
  }

  // 设置新的定时器，防抖200ms
  updateNodeTimer = setTimeout(() => {
    if (props.selectedWidget) {
      console.log('🔧 SettingsPanel - 更新节点:', {
        id: props.selectedWidget.id,
        dataSource: editableProps.value.dataSource
      })

      stateManager.updateNode(props.selectedWidget.id, {
        properties: editableProps.value.properties,
        interaction: editableProps.value.interaction,
        dataSource: editableProps.value.dataSource
      } as any)
    }
  }, 200)
}

const handleGridConfigChange = () => {
  if (props.onGridConfigChange && props.gridConfig) {
    // 确保 margin 是数组格式
    const updatedConfig = {
      ...props.gridConfig,
      margin: Array.isArray(props.gridConfig.margin)
        ? props.gridConfig.margin
        : [props.gridConfig.margin, props.gridConfig.margin]
    }

    // 调试日志
    console.log('🔧 SettingsPanel - 配置变更:', {
      originalConfig: props.gridConfig,
      updatedConfig: updatedConfig
    })

    props.onGridConfigChange(updatedConfig)
  }
}

// 创建响应式的网格配置
const gridConfig = computed(() => props.gridConfig || {})

onUnmounted(() => {
  if (updateNodeTimer) {
    clearTimeout(updateNodeTimer)
  }
})
</script>

<style scoped>
/* === 主容器样式 === */
.settings-panel {
  padding: 0;
  height: 100%;
  overflow-y: auto;
  background: var(--body-color);
}

/* === 区域布局 === */
.settings-section {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.settings-section:last-child {
  border-bottom: none;
}

/* === 标题区域 === */
.section-header {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

/* === 组件设置区域 === */
.widget-settings {
  padding: 0;
}

.widget-header {
  padding: 12px 12px 8px 12px;
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
}

.widget-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.widget-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  line-height: 1.3;
}

.widget-subtitle {
  font-size: 11px;
  opacity: 0.7;
}

/* === 标签页样式 === */
.settings-tabs {
  background: transparent;
}

.settings-tabs :deep(.n-tabs-nav) {
  padding: 8px 12px 0 12px;
  background: var(--card-color);
}

.tab-content {
  padding: 12px;
}

/* === 表单容器 === */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* === 配置组样式 === */
.config-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-2);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* === 表单项样式 === */
.form-item-flat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32px;
  padding: 6px 0;
}

.form-item-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

/* === 标签样式 === */
.item-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;
  flex-shrink: 0;
}

.item-label-short {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color-2);
  line-height: 1.3;
  margin-bottom: 2px;
}

.item-label-top {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  line-height: 1.3;
}

/* === 网格布局 === */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 12px;
}

.switch-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* === 状态条 === */
.status-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--info-color-suppl);
  border-radius: 4px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
}

.status-value {
  font-size: 12px;
  font-family: monospace;
}

/* === 提示和空状态 === */
.config-hint {
  margin: 12px 0;
  font-size: 12px;
}

.config-hint :deep(.n-alert__content) {
  line-height: 1.4;
}

.empty-state {
  padding: 20px 0;
}

.compact-empty :deep(.n-empty) {
  --n-icon-size: 32px;
}

/* === 交互配置 === */
.interaction-config {
  padding-top: 8px;
  border-top: 1px solid var(--divider-color);
  margin-top: 8px;
}

.link-config,
.route-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* === 属性表单 === */
.properties-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--divider-color);
}

.property-item:last-child {
  border-bottom: none;
}

.unsupported-type {
  font-size: 11px;
  padding: 4px 8px;
  background: var(--warning-color-suppl);
  border-radius: 4px;
  display: inline-block;
}

/* === 自定义组件包装 === */
.custom-config-wrapper,
.enhanced-form-wrapper {
  padding: 0;
}

/* === 数据源配置包装 === */
.data-source-config-wrapper {
  margin-top: 12px;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
}

.data-source-config-wrapper :deep(.simple-data-source-form) {
  /* 适配窄宽度的样式调整 */
  padding: 12px;
}

.data-source-config-wrapper :deep(.json-editor) {
  /* JSON编辑器在窄面板中的适配 */
  margin-bottom: 12px;
}

.data-source-config-wrapper :deep(.json-actions) {
  /* 按钮组在窄面板中的布局优化 */
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.data-source-config-wrapper :deep(.mapping-list) {
  /* 路径映射列表的窄宽度适配 */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-source-config-wrapper :deep(.mapping-item) {
  /* 单个映射项的布局优化 */
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-source-config-wrapper :deep(.mapping-label) {
  /* 标签样式优化 */
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
}

/* === 占位符样式 === */
.canvas-placeholder {
  padding: 32px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.placeholder {
  text-align: center;
  width: 100%;
}

.placeholder-text {
  margin-top: 8px;
  color: var(--text-color-3);
  font-size: 12px;
  line-height: 1.4;
  max-width: 180px;
  margin-left: auto;
  margin-right: auto;
}

/* === 响应式设计 === */
@media (max-width: 320px) {
  .settings-panel {
    font-size: 12px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .form-item-flat {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}

/* === 滚动条优化 === */
.settings-panel::-webkit-scrollbar {
  width: 4px;
}

.settings-panel::-webkit-scrollbar-track {
  background: transparent;
}

.settings-panel::-webkit-scrollbar-thumb {
  background: var(--scrollbar-color);
  border-radius: 2px;
}

.settings-panel::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-color-hover);
}

/* === 动画效果 === */
.config-group,
.form-item-flat,
.form-item-vertical {
  transition: all 0.2s ease;
}

.config-group:hover {
  border-color: var(--primary-color-suppl);
}

.form-item-flat:hover {
  background: var(--hover-color);
  border-radius: 4px;
  margin: 0 -4px;
  padding-left: 4px;
  padding-right: 4px;
}
</style>
