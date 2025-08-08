<template>
  <div class="settings-panel">
    <!-- GLOBAL SETTINGS -->
    <div v-if="!selectedWidget">
      <h3 class="panel-title">全局设置</h3>

      <n-form label-placement="left" label-width="auto" size="small" class="compact-form">
        <n-form-item label="显示组件标题">
          <n-switch :value="showWidgetTitles" @update:value="onToggleWidgetTitles" />
        </n-form-item>
      </n-form>
    </div>

    <!-- GRID CONFIG SETTINGS -->
    <div v-if="!selectedWidget && gridConfig">
      <h3 class="panel-title">网格配置</h3>

      <n-form label-placement="left" label-width="auto" size="small" class="compact-form">
        <n-form-item label="列数">
          <n-input-number v-model:value="gridConfig.colNum" :min="1" :max="48" @update:value="handleGridConfigChange" />
        </n-form-item>
        <n-form-item label="行高">
          <n-input-number
            v-model:value="gridConfig.rowHeight"
            :min="20"
            :max="200"
            @update:value="handleGridConfigChange"
          />
        </n-form-item>
        <n-form-item label="间距">
          <n-input-number
            v-model:value="gridConfig.margin[0]"
            :min="0"
            :max="50"
            @update:value="
              value => {
                if (props.gridConfig) {
                  props.gridConfig.margin = [value, value]
                  handleGridConfigChange()
                }
              }
            "
          />
        </n-form-item>
        <n-form-item label="可拖拽">
          <n-switch v-model:value="gridConfig.isDraggable" @update:value="handleGridConfigChange" />
        </n-form-item>
        <n-form-item label="可调整大小">
          <n-switch v-model:value="gridConfig.isResizable" @update:value="handleGridConfigChange" />
        </n-form-item>
        <n-form-item label="静态网格">
          <n-switch v-model:value="gridConfig.staticGrid" @update:value="handleGridConfigChange" />
        </n-form-item>
      </n-form>
    </div>

    <!-- WIDGET SETTINGS -->
    <div v-else-if="selectedWidget">
      <h3 class="panel-title">{{ widgetName }} 属性配置</h3>

      <n-tabs type="line" animated size="small">
        <!-- 数据源配置 -->
        <n-tab-pane name="dataSource" tab="数据源">
          <div style="padding: 20px; text-align: center; color: red">
            <h3>数据源表单已删除</h3>
            <p>原来的组件已被删除，现在会报错</p>
          </div>
        </n-tab-pane>

        <!-- 基础配置标签页 -->
        <n-tab-pane name="base" tab="基础">
          <n-form label-placement="left" label-width="auto" size="small" class="compact-form">
            <n-form-item label="显示标题">
              <n-switch v-model:value="editableProps.showLabel" @update:value="updateNode" />
            </n-form-item>
            <n-form-item label="标题">
              <n-input v-model:value="editableProps.label" @update:value="updateNode" />
            </n-form-item>
          </n-form>
        </n-tab-pane>

        <!-- 组件属性标签页 -->
        <n-tab-pane v-if="hasProperties || hasCustomConfig" name="props" tab="属性">
          <!-- 自定义配置组件 -->
          <div v-if="hasCustomConfig && customConfigComponent">
            <component
              :is="customConfigComponent"
              v-model:modelValue="editableProps.properties"
              :widget="selectedWidget"
              @update:modelValue="updateNode"
            />
          </div>

          <!-- 增强的属性表单 -->
          <div v-else-if="hasEnhancedProperties">
            <EnhancedPropertyForm
              v-model="editableProps.properties"
              :properties="componentProperties"
              @update:modelValue="updateNode"
            />
          </div>

          <!-- 传统的简单属性表单（向后兼容） -->
          <n-form v-else label-placement="left" label-width="auto" size="small" class="compact-form">
            <n-form-item v-for="(propDef, key) in selectedWidget.properties" :key="key" :label="String(key)">
              <n-input
                v-if="typeof propDef === 'string'"
                v-model:value="editableProps.properties[key]"
                @update:value="updateNode"
              />
              <n-input-number
                v-else-if="typeof propDef === 'number'"
                v-model:value="editableProps.properties[key]"
                @update:value="updateNode"
              />
              <n-switch
                v-else-if="typeof propDef === 'boolean'"
                v-model:value="editableProps.properties[key]"
                @update:value="updateNode"
              />
              <n-text v-else depth="3">不支持的属性类型</n-text>
            </n-form-item>
          </n-form>
        </n-tab-pane>

        <!-- 交互配置标签页 -->
        <n-tab-pane name="interaction" tab="交互">
          <n-form label-placement="left" label-width="auto" size="small" class="compact-form">
            <n-form-item label="点击事件">
              <n-select
                v-model:value="editableProps.interaction.onClick.type"
                :options="interactionTypeOptions"
                @update:value="updateNode"
              />
            </n-form-item>
            <n-form-item v-if="editableProps.interaction.onClick.type === 'link'" label="目标URL">
              <n-input v-model:value="editableProps.interaction.onClick.payload.url" @update:value="updateNode" />
            </n-form-item>
            <n-form-item v-if="editableProps.interaction.onClick.type === 'link'" label="新标签页打开">
              <n-switch v-model:value="editableProps.interaction.onClick.payload.newTab" @update:value="updateNode" />
            </n-form-item>
            <n-form-item v-if="editableProps.interaction.onClick.type === 'internal_route'" label="内部路由">
              <n-input v-model:value="editableProps.interaction.onClick.payload.route" @update:value="updateNode" />
            </n-form-item>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </div>
    <!-- CANVAS SETTINGS -->
    <div v-else class="placeholder">
      <h3 class="panel-title">画布设置</h3>
      <p class="placeholder-text">请选择一个组件以编辑属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSwitch, NText, NTabs, NTabPane, NSelect } from 'naive-ui'
import { useEditor } from '../hooks'
import type { VisualEditorWidget } from '../types'
import { cloneDeep } from 'lodash-es'
import { configRegistry } from './ConfigRegistry'
import EnhancedPropertyForm from './components/EnhancedPropertyForm.vue'
// import SimpleDataSourceSelector from './components/SimpleDataSourceSelector.vue' // 已删除

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

// 处理数据源更新
const handleDataSourceUpdate = (dataSource: any) => {
  editableProps.value.dataSource = dataSource
  updateNode()
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
.settings-panel {
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
}
.placeholder {
  text-align: center;
  padding-top: 20px;
}
.placeholder-text {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}
.compact-form .n-form-item {
  margin-bottom: 8px;
}

.compact-form .n-form-item-label {
  padding-bottom: 4px;
}

.compact-form .n-form-item-blank {
  padding-bottom: 4px;
}
</style>
