<template>
  <n-form label-placement="left" label-width="auto" size="small">
    <n-form-item
      v-for="(propDef, key) in properties"
      :key="key"
      :label="propDef.label || String(key)"
      :rule="getValidationRule(propDef)"
    >
      <!-- 字符串输入 -->
      <n-input
        v-if="propDef.type === 'string'"
        v-model:value="formData[key]"
        :placeholder="propDef.description"
        :maxlength="propDef.maxLength"
        @update:value="handleUpdate(key, $event)"
      />

      <!-- 数字输入 -->
      <n-input-number
        v-else-if="propDef.type === 'number'"
        v-model:value="formData[key]"
        :min="propDef.min"
        :max="propDef.max"
        :step="propDef.step || 1"
        :placeholder="propDef.description"
        @update:value="handleUpdate(key, $event)"
      />

      <!-- 布尔开关 -->
      <n-switch
        v-else-if="propDef.type === 'boolean'"
        v-model:value="formData[key]"
        @update:value="handleUpdate(key, $event)"
      />

      <!-- 颜色选择器 -->
      <n-color-picker
        v-else-if="propDef.type === 'color'"
        v-model:value="formData[key]"
        :show-alpha="false"
        @update:value="handleUpdate(key, $event)"
      />

      <!-- 选择器 -->
      <n-select
        v-else-if="propDef.type === 'select' && propDef.options"
        v-model:value="formData[key]"
        :options="propDef.options"
        :placeholder="propDef.description"
        @update:value="handleUpdate(key, $event)"
      />

      <!-- 图标选择器 -->
      <div v-else-if="propDef.type === 'icon'" class="icon-selector">
        <n-input
          v-model:value="formData[key]"
          :placeholder="propDef.description || '选择图标'"
          readonly
          @update:value="handleUpdate(key, $event)"
        >
          <template #suffix>
            <n-button text @click="showIconSelector = true">
              <n-icon><component :is="getIconComponent(formData[key])" /></n-icon>
            </n-button>
          </template>
        </n-input>
      </div>

      <!-- 对象/数组 JSON 编辑器 -->
      <n-input
        v-else-if="propDef.type === 'object' || propDef.type === 'array'"
        v-model:value="jsonStringData[key]"
        type="textarea"
        :placeholder="propDef.description || '输入 JSON 格式数据'"
        :autosize="{ minRows: 2, maxRows: 5 }"
        @update:value="handleJsonUpdate(key, $event)"
      />

      <!-- 不支持的类型 -->
      <n-text v-else depth="3">不支持的属性类型: {{ propDef.type }}</n-text>
    </n-form-item>
  </n-form>

  <!-- 图标选择器模态框 -->
  <n-modal v-model:show="showIconSelector" preset="card" title="选择图标" style="width: 600px">
    <IconSelector @icon-selected="handleIconSelect" />
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NColorPicker,
  NSelect,
  NButton,
  NIcon,
  NText,
  NModal
} from 'naive-ui'
import { cloneDeep } from 'lodash-es'
import type { IPropertyDefinition } from '@/card2.1/core/types'
import IconSelector from '@/components/common/icon-selector.vue'
import { icons as iconOptions } from '@/components/common/icons'

interface Props {
  properties: Record<string, IPropertyDefinition>
  modelValue: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
}>()

const formData = reactive<Record<string, any>>({})
const jsonStringData = reactive<Record<string, string>>({})
const showIconSelector = ref(false)
const currentIconKey = ref('')

// 初始化表单数据
const initFormData = () => {
  Object.keys(props.properties).forEach(key => {
    const propDef = props.properties[key]
    const value = props.modelValue[key] ?? propDef.default

    if (propDef.type === 'object' || propDef.type === 'array') {
      formData[key] = value
      jsonStringData[key] = JSON.stringify(value, null, 2)
    } else {
      formData[key] = value
    }
  })
}

// 监听 props 变化
watch(() => props.modelValue, initFormData, { immediate: true, deep: true })
watch(() => props.properties, initFormData, { immediate: true })

// 处理普通字段更新
const handleUpdate = (key: string, value: any) => {
  formData[key] = value
  emitUpdate()
}

// 处理 JSON 字段更新
const handleJsonUpdate = (key: string, jsonString: string) => {
  jsonStringData[key] = jsonString
  try {
    const parsed = JSON.parse(jsonString)
    formData[key] = parsed
    emitUpdate()
  } catch (error) {
    // JSON 格式错误，不更新数据
    console.warn('Invalid JSON:', error)
  }
}

// 发出更新事件
const emitUpdate = () => {
  emit('update:modelValue', cloneDeep(formData))
}

// 获取图标组件
const getIconComponent = (iconName: string) => {
  return iconOptions[iconName] || iconOptions.QuestionMarkCircleOutline
}

// 处理图标选择
const handleIconSelect = (iconName: string) => {
  if (currentIconKey.value) {
    handleUpdate(currentIconKey.value, iconName)
  }
  showIconSelector.value = false
  currentIconKey.value = ''
}

// 获取验证规则
const getValidationRule = (propDef: IPropertyDefinition) => {
  const rules: any[] = []

  if (propDef.required) {
    rules.push({
      required: true,
      message: `${propDef.label} 是必填项`
    })
  }

  if (propDef.validator) {
    rules.push({
      validator: (_rule: any, value: any) => {
        const result = propDef.validator!(value)
        return result === true ? true : new Error(typeof result === 'string' ? result : '验证失败')
      }
    })
  }

  return rules.length > 0 ? rules : undefined
}
</script>

<style scoped>
.icon-selector {
  width: 100%;
}
</style>
