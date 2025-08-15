<template>
  <div class="component-config-form">
    <div v-if="!hasCustomConfig && !hasProperties" class="no-config-message">
      <n-empty size="small" :description="$t('config.component.noConfig')">
        <template #icon>
          <n-icon size="32">
            <SettingsIcon />
          </n-icon>
        </template>
      </n-empty>
    </div>

    <!-- 自定义配置组件 -->
    <div v-else-if="hasCustomConfig && customConfigComponent">
      <div class="config-header">
        <h4 class="section-title">{{ componentName }} {{ $t('config.component.settings') }}</h4>
        <div v-if="componentDescription" class="component-description">
          {{ componentDescription }}
        </div>
      </div>

      <component
        :is="customConfigComponent"
        :model-value="formData.properties"
        :widget="widget"
        :readonly="readonly"
        :show-advanced="showAdvanced"
        class="custom-config-component"
        @update:model-value="handlePropertiesChange"
        @validate="handleValidate"
        @change="handlePropertiesChange"
      />
    </div>

    <!-- 动态属性表单 -->
    <div v-else-if="hasProperties">
      <div class="config-header">
        <h4 class="section-title">{{ $t('config.component.properties') }}</h4>
      </div>

      <n-form
        ref="formRef"
        :model="formData"
        label-placement="left"
        label-width="auto"
        size="small"
        class="properties-form"
      >
        <template v-for="(propDef, propKey) in componentProperties" :key="propKey">
          <n-form-item :label="getPropertyLabel(propKey, propDef)" :path="`properties.${propKey}`">
            <!-- 字符串类型 -->
            <n-input
              v-if="getPropertyType(propDef) === 'string'"
              :value="formData.properties[propKey]"
              :placeholder="getPropertyPlaceholder(propDef)"
              :readonly="readonly"
              clearable
              @update:value="value => updateProperty(propKey, value)"
            />

            <!-- 数值类型 -->
            <n-input-number
              v-else-if="getPropertyType(propDef) === 'number'"
              :value="formData.properties[propKey]"
              :min="getPropertyMin(propDef)"
              :max="getPropertyMax(propDef)"
              :step="getPropertyStep(propDef)"
              :readonly="readonly"
              @update:value="value => updateProperty(propKey, value)"
            />

            <!-- 布尔类型 -->
            <n-switch
              v-else-if="getPropertyType(propDef) === 'boolean'"
              :value="formData.properties[propKey]"
              :disabled="readonly"
              @update:value="value => updateProperty(propKey, value)"
            />

            <!-- 选择类型 -->
            <n-select
              v-else-if="getPropertyType(propDef) === 'select'"
              :value="formData.properties[propKey]"
              :options="getPropertyOptions(propDef)"
              :disabled="readonly"
              @update:value="value => updateProperty(propKey, value)"
            />

            <!-- 颜色类型 -->
            <n-color-picker
              v-else-if="getPropertyType(propDef) === 'color'"
              :value="formData.properties[propKey]"
              :disabled="readonly"
              show-alpha
              @update:value="value => updateProperty(propKey, value)"
            />

            <!-- 数组类型 -->
            <div v-else-if="getPropertyType(propDef) === 'array'" class="array-config">
              <n-dynamic-input
                :value="formData.properties[propKey] || []"
                :disabled="readonly"
                show-sort-button
                @update:value="value => updateProperty(propKey, value)"
              />
            </div>

            <!-- 对象类型 - JSON 编辑器 -->
            <div v-else-if="getPropertyType(propDef) === 'object'" class="object-config">
              <n-input
                :value="JSON.stringify(formData.properties[propKey] || {}, null, 2)"
                type="textarea"
                :rows="4"
                :readonly="readonly"
                placeholder='{"key": "value"}'
                class="json-input"
                @update:value="value => updateObjectProperty(propKey, value)"
              />
            </div>

            <!-- 不支持的类型 -->
            <n-alert v-else type="warning" size="small" :title="$t('config.component.unsupportedType')" closable>
              {{ $t('config.component.unsupportedTypeDesc', { type: getPropertyType(propDef) }) }}
            </n-alert>
          </n-form-item>
        </template>
      </n-form>
    </div>

    <!-- 组件样式配置 -->
    <div v-if="showAdvanced && (hasCustomConfig || hasProperties)" class="styles-section">
      <h4 class="section-title">{{ $t('config.component.styles') }}</h4>
      <n-form :model="formData.styles" label-placement="left" label-width="auto" size="small">
        <n-form-item :label="$t('config.component.customStyles')">
          <n-input
            v-model:value="formData.styles.custom"
            type="textarea"
            :rows="3"
            :placeholder="$t('config.component.customStyles.placeholder')"
            :readonly="readonly"
            @update:value="handleStylesChange"
          />
        </n-form-item>
      </n-form>
    </div>

    <!-- 操作按钮 -->
    <div v-if="hasCustomConfig || hasProperties" class="form-actions">
      <n-space size="small">
        <n-button size="small" @click="handleReset">
          {{ $t('common.reset') }}
        </n-button>
        <n-button v-if="showAdvanced !== undefined" size="small" @click="$emit('toggle-advanced')">
          {{ showAdvanced ? $t('config.hideAdvanced') : $t('config.showAdvanced') }}
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件配置表单组件
 * 作为组件特定配置的容器，根据组件类型动态加载相应的配置表单
 * 支持自定义配置组件和通用属性配置
 */

import { ref, reactive, computed, watch } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NSelect,
  NColorPicker,
  NDynamicInput,
  NButton,
  NSpace,
  NEmpty,
  NIcon,
  NAlert,
  FormInst
} from 'naive-ui'
import { Settings as SettingsIcon } from '@vicons/ionicons5'
import { configRegistry } from '../../settings/ConfigRegistry'
import type { ComponentConfiguration, ConfigFormProps, ConfigFormEmits, ValidationResult } from '../types'

interface Props extends ConfigFormProps<ComponentConfiguration> {
  /** 是否显示高级选项 */
  showAdvanced?: boolean
}

interface Emits extends ConfigFormEmits<ComponentConfiguration> {
  (event: 'toggle-advanced'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    properties: {},
    styles: {},
    behavior: {},
    validation: { required: [], rules: {} }
  }),
  readonly: false,
  showAdvanced: false
})

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInst>()

// 表单数据
const formData = reactive<ComponentConfiguration>({
  properties: { ...props.modelValue.properties },
  styles: { ...props.modelValue.styles },
  behavior: { ...props.modelValue.behavior },
  validation: { ...props.modelValue.validation }
})

// 监听外部配置变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(formData)) {
      Object.assign(formData, {
        properties: { ...newValue.properties },
        styles: { ...newValue.styles },
        behavior: { ...newValue.behavior },
        validation: { ...newValue.validation }
      })
      console.log('ComponentConfigForm - 外部配置已更新:', newValue)
    }
  },
  { deep: true }
)

// 组件信息
const componentName = computed(() => {
  if (!props.widget) return ''
  return props.widget.metadata?.card2Definition?.name || props.widget.type || ''
})

const componentDescription = computed(() => {
  if (!props.widget) return ''
  return props.widget.metadata?.card2Definition?.description || ''
})

// 检查是否有自定义配置组件
const hasCustomConfig = computed(() => {
  if (!props.widget) return false
  const componentType = props.widget.type
  return configRegistry.has(componentType)
})

// 获取自定义配置组件
const customConfigComponent = computed(() => {
  if (!props.widget) return null
  const componentType = props.widget.type
  return configRegistry.get(componentType)
})

// 检查是否有属性定义
const hasProperties = computed(() => {
  const properties = componentProperties.value
  return properties && Object.keys(properties).length > 0
})

// 获取组件属性定义
const componentProperties = computed(() => {
  if (!props.widget) return {}
  const definition = props.widget.metadata?.card2Definition
  return definition?.properties || {}
})

// 监听外部值变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(formData)) {
      Object.assign(formData, newValue)
    }
  },
  { deep: true }
)

// 处理属性变化
const handlePropertiesChange = (value: any) => {
  if (props.readonly) return

  formData.properties = { ...value }
  emitChange()
}

// 处理样式变化
const handleStylesChange = () => {
  if (props.readonly) return
  emitChange()
}

// 更新单个属性
const updateProperty = (key: string, value: any) => {
  if (props.readonly) return

  formData.properties[key] = value
  emitChange()
}

// 更新对象类型属性
const updateObjectProperty = (key: string, jsonString: string) => {
  if (props.readonly) return

  try {
    const value = JSON.parse(jsonString)
    formData.properties[key] = value
    emitChange()
  } catch (error) {
    console.warn(`Invalid JSON for property ${key}:`, jsonString)
  }
}

// 发出变更事件
const emitChange = () => {
  const newConfig = { ...formData }
  emit('update:modelValue', newConfig)
  emit('change', newConfig, props.modelValue)
}

// 处理验证
const handleValidate = (result: ValidationResult) => {
  emit('validate', result)
}

// 重置表单
const handleReset = () => {
  if (props.readonly) return

  const defaultConfig: ComponentConfiguration = {
    properties: {},
    styles: {},
    behavior: {},
    validation: { required: [], rules: {} }
  }

  Object.assign(formData, defaultConfig)
  emit('update:modelValue', defaultConfig)
}

// 属性类型工具函数
const getPropertyType = (propDef: any): string => {
  if (typeof propDef === 'string') return 'string'
  if (typeof propDef === 'number') return 'number'
  if (typeof propDef === 'boolean') return 'boolean'
  if (Array.isArray(propDef)) return 'array'
  if (propDef && typeof propDef === 'object') {
    return propDef.type || 'object'
  }
  return 'unknown'
}

const getPropertyLabel = (key: string, propDef: any): string => {
  if (propDef && typeof propDef === 'object' && propDef.label) {
    return propDef.label
  }
  return key
}

const getPropertyPlaceholder = (propDef: any): string => {
  if (propDef && typeof propDef === 'object' && propDef.placeholder) {
    return propDef.placeholder
  }
  return ''
}

const getPropertyMin = (propDef: any): number | undefined => {
  return propDef && typeof propDef === 'object' ? propDef.min : undefined
}

const getPropertyMax = (propDef: any): number | undefined => {
  return propDef && typeof propDef === 'object' ? propDef.max : undefined
}

const getPropertyStep = (propDef: any): number | undefined => {
  return propDef && typeof propDef === 'object' ? propDef.step : undefined
}

const getPropertyOptions = (propDef: any): any[] => {
  if (propDef && typeof propDef === 'object' && propDef.options) {
    return propDef.options
  }
  return []
}

// 暴露验证方法
const validate = async (): Promise<ValidationResult> => {
  return {
    valid: true,
    errors: undefined,
    warnings: undefined
  }
}

// 暴露公共方法
defineExpose({
  validate,
  reset: handleReset
})
</script>

<style scoped>
.component-config-form {
  padding: 0;
}

.no-config-message {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-color-3);
}

.config-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.component-description {
  font-size: 12px;
  color: var(--text-color-2);
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--info-color-suppl);
  border-radius: 4px;
  border-left: 3px solid var(--info-color);
}

.custom-config-component {
  margin-bottom: 16px;
}

.properties-form {
  width: 100%;
}

.array-config {
  width: 100%;
}

.object-config {
  width: 100%;
}

.json-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.styles-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-color);
}

.form-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 只读状态样式 */
.component-config-form :deep(.n-input[readonly]),
.component-config-form :deep(.n-input-number[readonly]),
.component-config-form :deep(.n-switch[disabled]),
.component-config-form :deep(.n-select[disabled]) {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
