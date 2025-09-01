<!--
  动态参数编辑器组件 v2.0
  支持模板化的参数值编辑：手动输入、下拉选择、属性绑定
-->
<script setup lang="ts">
/**
 * DynamicParameterEditor - 智能参数编辑器
 * 支持多种值输入模式：手动输入、模板选择、属性绑定
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { generateVariableName } from '../../types/http-config'
import {
  getRecommendedTemplates,
  getTemplateById,
  ParameterTemplateType,
  isComponentTemplate,
  type ParameterTemplate
} from './templates/index'

// 导入组件模板使用的组件
import DeviceMetricsSelector from '@/components/device-selectors/DeviceMetricsSelector.vue'
import DeviceDispatchSelector from '@/components/device-selectors/DeviceDispatchSelector.vue'
import IconSelector from '@/components/common/icon-selector.vue'

// 组件映射表
const componentMap = {
  DeviceMetricsSelector,
  DeviceDispatchSelector,
  IconSelector
}

// 增强的参数接口
interface EnhancedParameter {
  key: string
  value: string | number | boolean
  enabled: boolean
  // 新的值输入模式
  valueMode: ParameterTemplateType // 'manual' | 'dropdown' | 'property'
  selectedTemplate?: string // 选中的模板ID
  // 动态属性相关（仅在 valueMode === 'property' 时有效）
  variableName?: string
  description?: string
  dataType: 'string' | 'number' | 'boolean' | 'json'
}

// Props接口
interface Props {
  /** 参数数组 */
  modelValue: EnhancedParameter[]
  /** 参数类型标识，用于推荐模板 */
  parameterType: 'header' | 'query' | 'path'
  /** 显示标题 */
  title?: string
  /** 添加按钮文本 */
  addButtonText?: string
  /** 键名占位符 */
  keyPlaceholder?: string
  /** 值占位符 */
  valuePlaceholder?: string
  /** 是否显示数据类型选择 */
  showDataType?: boolean
  /** 是否显示启用复选框 */
  showEnabled?: boolean
  /** 自定义CSS类名 */
  customClass?: string
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: EnhancedParameter[]): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '参数配置',
  addButtonText: '添加参数',
  keyPlaceholder: '参数名',
  valuePlaceholder: '参数值',
  showDataType: true,
  showEnabled: true,
  customClass: ''
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

/**
 * 数据类型选项
 */
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' },
  { label: 'JSON', value: 'json' }
]

/**
 * 获取推荐的模板列表
 */
const recommendedTemplates = computed(() => {
  return getRecommendedTemplates(props.parameterType)
})

/**
 * 创建默认参数
 */
const createDefaultParameter = (): EnhancedParameter => {
  return {
    key: '',
    value: '',
    enabled: true,
    valueMode: ParameterTemplateType.MANUAL,
    selectedTemplate: 'manual',
    dataType: 'string',
    variableName: '',
    description: ''
  }
}

/**
 * 添加新参数
 */
const addParameter = () => {
  const newParam = createDefaultParameter()
  const updatedParams = [...props.modelValue, newParam]
  emit('update:modelValue', updatedParams)
}

/**
 * 删除参数
 */
const removeParameter = (index: number) => {
  const updatedParams = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', updatedParams)
}

/**
 * 处理参数键变化
 */
const onParameterKeyChange = (param: EnhancedParameter, index: number) => {
  // 如果是属性绑定模式，自动更新变量名和描述
  if (param.valueMode === ParameterTemplateType.PROPERTY && param.key) {
    param.variableName = generateVariableName(param.key)
    if (!param.description) {
      param.description = `${getTypeDisplayName()}参数：${param.key}`
    }
  }
  updateParameter(param, index)
}

/**
 * 处理模板变化
 */
const onTemplateChange = (param: EnhancedParameter, index: number, templateId: string) => {
  const template = getTemplateById(templateId)
  if (!template) return

  const updatedParam = { ...param }
  updatedParam.selectedTemplate = templateId
  updatedParam.valueMode = template.type

  // 根据模板类型设置默认值
  if (template.defaultValue !== undefined) {
    updatedParam.value = template.defaultValue
  }

  // 根据模板类型初始化配置
  if (template.type === ParameterTemplateType.PROPERTY) {
    // 属性绑定模式，初始化动态参数配置
    if (param.key) {
      updatedParam.variableName = generateVariableName(param.key)
      updatedParam.description = updatedParam.description || `${getTypeDisplayName()}参数：${param.key}`
    }
  } else if (template.type === ParameterTemplateType.COMPONENT) {
    // 🔥 组件模式，清空动态参数配置但保留描述
    updatedParam.variableName = ''
    if (!updatedParam.description) {
      updatedParam.description = template.description || `${getTypeDisplayName()}参数：${param.key}`
    }
    console.log(`🔧 [DynamicParameterEditor] 切换到组件模板:`, {
      templateId,
      templateType: template.type,
      componentConfig: template.componentConfig
    })
  } else {
    // 其他模式，清空动态参数配置
    updatedParam.variableName = ''
    updatedParam.description = ''
  }

  updateParameter(updatedParam, index)
}

/**
 * 更新指定参数
 */
const updateParameter = (param: EnhancedParameter, index: number) => {
  const updatedParams = [...props.modelValue]
  updatedParams[index] = { ...param }
  emit('update:modelValue', updatedParams)
}

/**
 * 更新参数值
 */
const updateParameterValue = (param: EnhancedParameter, index: number, field: keyof EnhancedParameter, value: any) => {
  const updatedParam = { ...param, [field]: value }
  updateParameter(updatedParam, index)
}

/**
 * 获取参数类型显示名称
 */
const getTypeDisplayName = () => {
  const names = { header: '请求头', query: '查询', path: '路径' }
  return names[props.parameterType]
}

/**
 * 获取值输入占位符
 */
const getValuePlaceholder = (param: EnhancedParameter) => {
  switch (param.valueMode) {
    case ParameterTemplateType.MANUAL:
      return props.valuePlaceholder
    case ParameterTemplateType.DROPDOWN:
      return '选择或输入值'
    case ParameterTemplateType.PROPERTY:
      return '示例值（运行时将被替换）'
    default:
      return props.valuePlaceholder
  }
}

/**
 * 获取当前模板的下拉选项
 */
const getCurrentTemplateOptions = (param: EnhancedParameter) => {
  if (param.valueMode !== ParameterTemplateType.DROPDOWN || !param.selectedTemplate) return []
  const template = getTemplateById(param.selectedTemplate)
  return template?.options || []
}

/**
 * 检查模板是否允许自定义输入
 */
const isCustomInputAllowed = (param: EnhancedParameter) => {
  if (param.valueMode !== ParameterTemplateType.DROPDOWN || !param.selectedTemplate) return false
  const template = getTemplateById(param.selectedTemplate)
  return template?.allowCustom || false
}

/**
 * 检查是否为组件模板
 */
const isComponentMode = (param: EnhancedParameter) => {
  const isComponent = param.valueMode === ParameterTemplateType.COMPONENT
  console.log(`🔍 [DynamicParameterEditor] 检查组件模式:`, {
    paramKey: param.key,
    valueMode: param.valueMode,
    templateType: ParameterTemplateType.COMPONENT,
    isComponent,
    selectedTemplate: param.selectedTemplate
  })
  return isComponent
}

/**
 * 获取组件模板配置
 */
const getComponentTemplate = (param: EnhancedParameter) => {
  if (!param.selectedTemplate) return null
  const template = getTemplateById(param.selectedTemplate)
  const config = template?.componentConfig
  if (!config) return null
  
  // 解析组件：如果是字符串，从映射表中获取；否则直接返回
  const component = typeof config.component === 'string' 
    ? componentMap[config.component as keyof typeof componentMap]
    : config.component
    
  return {
    ...config,
    component
  }
}

/**
 * 处理组件事件
 */
const handleComponentEvent = (param: EnhancedParameter, index: number, eventName: string, value: any) => {
  console.log(`🔧 [DynamicParameterEditor] 组件事件处理:`, { eventName, value, param })
  
  // 根据事件类型更新参数值
  switch (eventName) {
    case 'handleDeviceMetricsChange':
    case 'handleDeviceSelectionChange':
    case 'handleIconChange':
    case 'update:selectedValue':
    case 'update:selectedDevice':
    case 'update:value':
      updateParameterValue(param, index, 'value', value)
      break
    default:
      console.warn(`🚨 [DynamicParameterEditor] 未处理的组件事件: ${eventName}`)
  }
}

/**
 * 创建组件事件监听器
 */
const createComponentEventListeners = (param: EnhancedParameter, index: number) => {
  const componentConfig = getComponentTemplate(param)
  if (!componentConfig || !componentConfig.events) return {}

  const listeners: Record<string, Function> = {}
  Object.entries(componentConfig.events).forEach(([vueEvent, handlerName]) => {
    listeners[vueEvent] = (value: any) => handleComponentEvent(param, index, handlerName, value)
  })
  
  return listeners
}
</script>

<template>
  <div :class="['dynamic-parameter-editor', customClass]">
    <!-- 标题和添加按钮 -->
    <div v-if="title" class="section-header">
      <span>{{ title }}</span>
      <n-button size="small" type="primary" @click="addParameter">
        {{ addButtonText }}
      </n-button>
    </div>
    <div v-else class="simple-header">
      <n-button size="small" type="primary" @click="addParameter">
        {{ addButtonText }}
      </n-button>
    </div>

    <!-- 参数列表 -->
    <div v-if="modelValue.length > 0" class="parameter-list">
      <div v-for="(param, index) in modelValue" :key="`param-${index}`" class="parameter-item">
        <div class="parameter-row">
          <!-- 启用复选框 -->
          <n-checkbox
            v-if="showEnabled"
            :checked="param.enabled"
            @update:checked="value => updateParameterValue(param, index, 'enabled', value)"
          />

          <!-- 键名输入 -->
          <n-input
            :value="param.key"
            :placeholder="keyPlaceholder"
            size="small"
            style="width: 120px"
            @update:value="
              value => {
                const updatedParam = { ...param, key: value }
                updateParameter(updatedParam, index)
                onParameterKeyChange(updatedParam, index)
              }
            "
          />

          <!-- 模板选择器 -->
          <n-select
            :value="param.selectedTemplate"
            :options="recommendedTemplates.map(t => ({ label: t.name, value: t.id, description: t.description }))"
            size="small"
            style="width: 100px"
            @update:value="templateId => onTemplateChange(param, index, templateId)"
          />

          <!-- 值输入 - 根据模板类型动态显示 -->
          <div style="flex: 1; display: flex; gap: 4px">
            <!-- 手动输入模式 -->
            <n-input
              v-if="param.valueMode === 'manual'"
              :value="param.value"
              :placeholder="getValuePlaceholder(param)"
              size="small"
              @update:value="value => updateParameterValue(param, index, 'value', value)"
            />

            <!-- 下拉选择模式 -->
            <n-select
              v-else-if="param.valueMode === 'dropdown'"
              :value="param.value"
              :options="getCurrentTemplateOptions(param)"
              :filterable="isCustomInputAllowed(param)"
              :tag="isCustomInputAllowed(param)"
              size="small"
              :placeholder="getValuePlaceholder(param)"
              @update:value="value => updateParameterValue(param, index, 'value', value)"
            />

            <!-- 属性绑定模式 -->
            <n-input
              v-else-if="param.valueMode === 'property'"
              :value="param.value"
              :placeholder="getValuePlaceholder(param)"
              size="small"
              @update:value="value => updateParameterValue(param, index, 'value', value)"
            />

            <!-- 🔥 组件模板模式 -->
            <div
              v-else-if="isComponentMode(param)"
              :class="[
                'component-template-container',
                getComponentTemplate(param)?.renderConfig?.containerClass || ''
              ]"
              :style="{
                minHeight: getComponentTemplate(param)?.renderConfig?.minHeight || 'auto',
                width: '100%'
              }"
            >
              <component
                v-if="getComponentTemplate(param)?.component"
                :is="getComponentTemplate(param)?.component"
                :value="param.value"
                v-bind="getComponentTemplate(param)?.props || {}"
                v-on="createComponentEventListeners(param, index)"
              />
              <div v-else class="component-loading">
                <n-spin size="small" />
                <span>加载组件中...</span>
              </div>
            </div>
          </div>

          <!-- 数据类型选择 -->
          <n-select
            v-if="showDataType"
            :value="param.dataType"
            :options="dataTypeOptions"
            size="small"
            style="width: 80px"
            @update:value="value => updateParameterValue(param, index, 'dataType', value)"
          />

          <!-- 删除按钮 -->
          <n-button size="small" type="error" ghost @click="removeParameter(index)">删除</n-button>
        </div>

        <!-- 属性绑定配置（仅在属性绑定模式下显示）-->
        <div v-if="param.valueMode === 'property'" class="property-binding-config">
          <n-space vertical size="small">
            <div class="binding-info">
              <n-tag size="small" type="info">属性绑定 - 运行时动态获取值</n-tag>
            </div>
            <n-space align="center" size="small">
              <n-text depth="3" style="font-size: 11px; width: 60px">变量名:</n-text>
              <n-text depth="2" style="font-size: 11px">
                {{ param.variableName || `请先输入${keyPlaceholder}` }}
              </n-text>
            </n-space>
            <n-space align="center" size="small">
              <n-text depth="3" style="font-size: 11px; width: 60px">描述:</n-text>
              <n-input
                :value="param.description || ''"
                placeholder="参数描述（可选）"
                size="small"
                style="flex: 1"
                @update:value="value => updateParameterValue(param, index, 'description', value)"
              />
            </n-space>
            <!-- 预留：属性绑定的具体实现区域 -->
            <div class="binding-placeholder">
              <n-text depth="3" style="font-size: 10px; color: var(--warning-color)">
                🚧 属性绑定功能开发中，当前为预留接口
              </n-text>
            </div>
          </n-space>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <n-text depth="3">暂无参数，点击"{{ addButtonText }}"添加</n-text>
    </div>
  </div>
</template>

<style scoped>
.dynamic-parameter-editor {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}

.parameter-list {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parameter-item {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--card-color);
}

.parameter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dynamic-config {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-color);
}

.empty-state {
  padding: 20px;
  text-align: center;
  background: var(--body-color);
  border: 1px dashed var(--border-color);
  border-radius: 4px;
}

/* 属性绑定配置区域 */
.property-binding-config {
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  background: var(--body-color);
}

.binding-info {
  margin-bottom: 6px;
}

.binding-placeholder {
  padding: 4px 8px;
  border-radius: 3px;
  background: rgba(var(--warning-color-rgb), 0.1);
}

/* 简单头部样式 */
.simple-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

/* 🔥 组件模板容器样式 */
.component-template-container {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--card-color);
  position: relative;
}

.component-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--text-color-3);
  font-size: 12px;
}

/* 设备选择器容器 */
.device-metrics-container {
  border-color: var(--primary-color-hover);
}

.device-dispatch-container {
  border-color: var(--info-color);
}

/* 图标选择器容器 */
.icon-selector-container {
  border-color: var(--warning-color);
}

/* 响应主题变化 */
[data-theme='dark'] .parameter-item {
  background: var(--card-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .parameter-list,
[data-theme='dark'] .empty-state {
  background: var(--body-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .property-binding-config {
  background: var(--body-color);
}

[data-theme='dark'] .binding-placeholder {
  background: rgba(var(--warning-color-rgb), 0.15);
}

[data-theme='dark'] .component-template-container {
  background: var(--card-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .device-metrics-container {
  border-color: var(--primary-color-hover);
}

[data-theme='dark'] .device-dispatch-container {
  border-color: var(--info-color);
}

[data-theme='dark'] .icon-selector-container {
  border-color: var(--warning-color);
}
</style>
