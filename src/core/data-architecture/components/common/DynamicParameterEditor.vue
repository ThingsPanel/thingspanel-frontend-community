<!--
  动态参数编辑器组件 v3.0
  采用主行-详情分离的设计，优化了UI布局和交互体验
-->
<script setup lang="ts">
/**
 * DynamicParameterEditor - 智能参数编辑器 v3.0
 *
 * 设计理念：
 * - 主行/详情分离：主列表保持简洁，仅显示核心信息，点击“配置”展开详细面板。
 * - 模式化编辑：通过“模板”切换不同的值输入模式（手动、下拉、属性、组件）。
 * - 交互优化：对于复杂的组件模板，使用抽屉（Drawer）进行编辑，避免破坏布局。
 */

import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCheckbox,
  NInput,
  NSelect,
  NSpace,
  NTag,
  NText,
  NDrawer,
  NDrawerContent,
  NIcon,
  NDropdown
} from 'naive-ui'
import { type EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import { generateVariableName } from '@/core/data-architecture/types/http-config'
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
import AddParameterFromDevice from './AddParameterFromDevice.vue' // 导入新组件
import {
  Sparkles as SparkleIcon,
  InformationCircleOutline as InfoIcon,
  AddCircleOutline as AddIcon
} from '@vicons/ionicons5'

// 组件映射表
const componentMap = {
  DeviceMetricsSelector,
  DeviceDispatchSelector,
  IconSelector
}

// Props接口
interface Props {
  modelValue: EnhancedParameter[]
  parameterType: 'header' | 'query' | 'path'
  title?: string
  addButtonText?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  showDataType?: boolean
  showEnabled?: boolean
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

// 当前正在编辑的参数索引，-1表示没有参数处于编辑状态
const editingIndex = ref(-1)
// 控制组件模板编辑抽屉的显示
const isDrawerVisible = ref(false)
// 控制从设备添加参数抽屉的显示
const isAddFromDeviceDrawerVisible = ref(false)
// 当前在抽屉中编辑的参数的临时状态
const drawerParam = ref<EnhancedParameter | null>(null)

/**
 * 参数添加选项
 */
const addParameterOptions = [
  {
    label: '手动添加参数',
    key: 'manual'
  },
  {
    label: '从设备添加',
    key: 'device'
  }
]

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
const createDefaultParameter = (): EnhancedParameter => ({
  key: '',
  value: '',
  enabled: true,
  valueMode: ParameterTemplateType.MANUAL,
  selectedTemplate: 'manual',
  dataType: 'string',
  variableName: '',
  description: ''
})

/**
 * 添加新参数
 */
const addParameter = () => {
  const newParam = createDefaultParameter()
  const updatedParams = [...props.modelValue, newParam]
  emit('update:modelValue', updatedParams)
  // 自动展开新添加的参数进行编辑
  editingIndex.value = updatedParams.length - 1
}

/**
 * 处理添加参数的下拉选项
 */
const handleSelectAddOption = (key: string) => {
  if (key === 'manual') {
    addParameter()
  } else if (key === 'device') {
    isAddFromDeviceDrawerVisible.value = true // 打开从设备添加抽屉
  }
}

/**
 * 删除参数
 */
const removeParameter = (index: number) => {
  const updatedParams = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', updatedParams)
  // 如果删除的是正在编辑的项，则关闭编辑状态
  if (editingIndex.value === index) {
    editingIndex.value = -1
  }
}

/**
 * 处理从设备添加的参数
 */
const handleAddFromDevice = (params: any[]) => {
  // TODO: 实现将从设备添加的参数合并到主列表的逻辑
  console.log('Added params from device:', params)
  isAddFromDeviceDrawerVisible.value = false
}

/**
 * 切换参数的编辑状态
 */
const toggleEditMode = (index: number) => {
  editingIndex.value = editingIndex.value === index ? -1 : index
}

/**
 * 更新指定索引的参数
 */
const updateParameter = (param: EnhancedParameter, index: number) => {
  const updatedParams = [...props.modelValue]
  updatedParams[index] = { ...param }
  emit('update:modelValue', updatedParams)
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

  if (template.defaultValue !== undefined) {
    updatedParam.value = template.defaultValue
  }

  if (template.type === ParameterTemplateType.PROPERTY) {
    if (param.key) {
      updatedParam.variableName = generateVariableName(param.key)
      updatedParam.description = updatedParam.description || `${getTypeDisplayName()}参数：${param.key}`
    }
  } else if (template.type === ParameterTemplateType.COMPONENT) {
    // 对于组件模板，打开抽屉进行编辑
    openComponentDrawer(updatedParam)
  } else {
    updatedParam.variableName = ''
    updatedParam.description = ''
  }

  updateParameter(updatedParam, index)
}

/**
 * 打开组件编辑抽屉
 */
const openComponentDrawer = (param: EnhancedParameter) => {
  drawerParam.value = { ...param }
  isDrawerVisible.value = true
}

/**
 * 保存从抽屉中所做的更改
 */
const saveDrawerChanges = () => {
  if (drawerParam.value && editingIndex.value !== -1) {
    updateParameter(drawerParam.value, editingIndex.value)
  }
  isDrawerVisible.value = false
  drawerParam.value = null
}

/**
 * 获取参数类型显示名称
 */
const getTypeDisplayName = () => {
  const names = { header: '请求头', query: '查询', path: '路径' }
  return names[props.parameterType]
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
 * 获取组件模板配置
 */
const getComponentTemplate = (param: EnhancedParameter | null) => {
  if (!param || !param.selectedTemplate) return null
  const template = getTemplateById(param.selectedTemplate)
  const config = template?.componentConfig
  if (!config) return null

  const component =
    typeof config.component === 'string'
      ? componentMap[config.component as keyof typeof componentMap]
      : config.component

  return { ...config, component }
}

// 监听抽屉中参数值的变化，并更新 drawerParam
watch(
  () => drawerParam.value?.value,
  (newValue, oldValue) => {
    if (drawerParam.value && newValue !== undefined && newValue !== oldValue) {
      drawerParam.value.value = newValue
    }
  }
)
</script>

<template>
  <div :class="['dynamic-parameter-editor-v3', customClass]">
    <!-- 标题和添加按钮 -->
    <div class="editor-header">
      <span v-if="title" class="editor-title">{{ title }}</span>
      <n-dropdown trigger="click" :options="addParameterOptions" @select="handleSelectAddOption">
        <n-button size="small" type="primary">
          <template #icon>
            <n-icon><add-icon /></n-icon>
          </template>
          {{ addButtonText }}
        </n-button>
      </n-dropdown>
    </div>

    <!-- 参数列表 -->
    <div v-if="modelValue.length > 0" class="parameter-list">
      <div
        v-for="(param, index) in modelValue"
        :key="`param-${index}`"
        class="parameter-item"
        :class="{ 'is-editing': editingIndex === index }"
      >
        <!-- 主行 -->
        <div class="parameter-row">
          <n-checkbox
            v-if="showEnabled"
            :checked="param.enabled"
            @update:checked="value => updateParameter({ ...param, enabled: value }, index)"
          />
          <n-input
            :value="param.key"
            :placeholder="keyPlaceholder"
            size="small"
            class="param-key-input"
            @update:value="value => updateParameter({ ...param, key: value }, index)"
          />
          <n-text class="param-value-summary" depth="3">
            {{ param.value || '未设置' }}
          </n-text>
          <n-space class="param-actions">
            <n-button size="small" @click="toggleEditMode(index)">
              {{ editingIndex === index ? '收起' : '配置' }}
            </n-button>
            <n-button size="small" type="error" ghost @click="removeParameter(index)">删除</n-button>
          </n-space>
        </div>

        <!-- 详细配置面板 (可折叠) -->
        <div v-if="editingIndex === index" class="details-panel">
          <!-- 模板选择 -->
          <div class="detail-row">
            <n-text class="detail-label">模板</n-text>
            <n-select
              :value="param.selectedTemplate"
              :options="
                recommendedTemplates.map(t => ({
                  label: t.name,
                  value: t.id,
                  description: t.description
                }))
              "
              size="small"
              @update:value="templateId => onTemplateChange(param, index, templateId)"
            />
          </div>

          <!-- 值输入 -->
          <div class="detail-row">
            <n-text class="detail-label">值</n-text>
            <!-- 手动输入 -->
            <n-input
              v-if="param.valueMode === 'manual'"
              :value="param.value"
              :placeholder="valuePlaceholder"
              size="small"
              @update:value="value => updateParameter({ ...param, value: value }, index)"
            />
            <!-- 下拉选择 -->
            <n-select
              v-else-if="param.valueMode === 'dropdown'"
              :value="param.value"
              :options="getCurrentTemplateOptions(param)"
              :filterable="isCustomInputAllowed(param)"
              :tag="isCustomInputAllowed(param)"
              size="small"
              placeholder="选择或输入值"
              @update:value="value => updateParameter({ ...param, value: value }, index)"
            />
            <!-- 属性绑定 -->
            <n-input
              v-else-if="param.valueMode === 'property'"
              :value="param.value"
              placeholder="示例值 (运行时替换)"
              size="small"
              @update:value="value => updateParameter({ ...param, value: value }, index)"
            />
            <!-- 组件模板 -->
            <div v-else-if="param.valueMode === 'component'" class="component-placeholder">
              <n-text>{{ getComponentTemplate(param)?.name || '组件' }}</n-text>
              <n-button size="small" @click="openComponentDrawer(param)">编辑内容</n-button>
            </div>
          </div>

          <!-- 数据类型 -->
          <div v-if="showDataType" class="detail-row">
            <n-text class="detail-label">数据类型</n-text>
            <n-select
              :value="param.dataType"
              :options="dataTypeOptions"
              size="small"
              @update:value="value => updateParameter({ ...param, dataType: value }, index)"
            />
          </div>

          <!-- 描述 -->
          <div class="detail-row">
            <n-text class="detail-label">描述</n-text>
            <n-input
              :value="param.description"
              placeholder="参数描述 (可选)"
              size="small"
              @update:value="value => updateParameter({ ...param, description: value }, index)"
            />
          </div>

          <!-- 属性绑定额外配置 -->
          <div v-if="param.valueMode === 'property'" class="property-binding-config">
            <n-tag size="small" type="info">属性绑定</n-tag>
            <n-text>变量名: {{ param.variableName || '自动生成' }}</n-text>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <n-text depth="3">暂无参数，点击"{{ addButtonText }}"添加</n-text>
    </div>

    <!-- 从设备添加参数抽屉 -->
    <n-drawer v-model:show="isAddFromDeviceDrawerVisible" :width="500">
      <n-drawer-content title="从设备添加参数" closable>
        <AddParameterFromDevice @add="handleAddFromDevice" @cancel="isAddFromDeviceDrawerVisible = false" />
      </n-drawer-content>
    </n-drawer>

    <!-- 组件编辑抽屉 -->
    <n-drawer v-model:show="isDrawerVisible" :width="500" :on-after-leave="() => (drawerParam = null)">
      <n-drawer-content :title="`编辑 ${getComponentTemplate(drawerParam)?.name || '参数'}`" closable>
        <template v-if="drawerParam">
          <component
            :is="getComponentTemplate(drawerParam)?.component"
            v-if="getComponentTemplate(drawerParam)?.component"
            v-model:value="drawerParam.value"
            v-bind="getComponentTemplate(drawerParam)?.props || {}"
          />
          <div v-else>组件加载失败</div>
        </template>
        <template #footer>
          <n-button @click="isDrawerVisible = false">取消</n-button>
          <n-button type="primary" @click="saveDrawerChanges">确定</n-button>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.dynamic-parameter-editor-v3 {
  width: 100%;
  font-size: 12px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.editor-title {
  font-size: 14px;
  font-weight: 500;
}

.parameter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parameter-item {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.parameter-item.is-editing {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color-suppl);
}

.parameter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.param-key-input {
  width: 150px;
}

.param-value-summary {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-color-3);
}

.param-actions {
  margin-left: auto;
}

.details-panel {
  padding: 12px;
  border-top: 1px solid var(--border-color);
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 8px;
}

.detail-label {
  font-weight: 500;
  color: var(--text-color-2);
}

.component-placeholder {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: var(--action-color);
  border-radius: 4px;
  width: 100%;
}

.property-binding-config {
  grid-column: 2 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-color-3);
}

.empty-state {
  padding: 24px;
  text-align: center;
  background: var(--body-color);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
}
</style>
