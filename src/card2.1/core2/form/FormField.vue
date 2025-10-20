<template>
  <div class="form-field">
    <!-- 文本输入框 -->
    <n-form-item
      v-if="setting.type === 'input'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-input
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 文本域 -->
    <n-form-item
      v-else-if="setting.type === 'textarea'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-input
        type="textarea"
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        :rows="4"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 数字输入框 -->
    <n-form-item
      v-else-if="setting.type === 'input-number'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-input-number
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        :min="setting.min"
        :max="setting.max"
        :step="setting.step"
        style="width: 100%"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 颜色选择器 -->
    <n-form-item
      v-else-if="setting.type === 'color-picker'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-color-picker
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 滑块 -->
    <n-form-item
      v-else-if="setting.type === 'slider'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-slider
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        :min="setting.min"
        :max="setting.max"
        :step="setting.step"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 开关 -->
    <n-form-item
      v-else-if="setting.type === 'switch'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-switch
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 下拉选择 -->
    <n-form-item
      v-else-if="setting.type === 'select'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-select
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        :options="selectOptions"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 多选框 -->
    <n-form-item
      v-else-if="setting.type === 'checkbox'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-checkbox
        :checked="modelValue"
        :disabled="setting.disabled || readonly"
        @update:checked="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 单选框组 -->
    <n-form-item
      v-else-if="setting.type === 'radio-group'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-radio-group
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      >
        <n-space>
          <n-radio
            v-for="option in setting.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 日期选择器 -->
    <n-form-item
      v-else-if="setting.type === 'date-picker'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-date-picker
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        style="width: 100%"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 动态标签 -->
    <n-form-item
      v-else-if="setting.type === 'dynamic-tags'"
      :label="setting.label"
      :required="setting.required"
    >
      <n-dynamic-tags
        :value="modelValue"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- Vue 组件渲染器 -->
    <n-form-item
      v-else-if="setting.type === 'vue-component'"
      :label="setting.label"
      :required="setting.required"
    >
      <component
        :is="setting.component"
        :model-value="modelValue"
        :readonly="readonly"
        v-bind="setting.componentProps"
        @update:model-value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>

    <!-- 未知类型的字段 -->
    <n-form-item
      v-else
      :label="setting.label"
      :required="setting.required"
    >
      <n-input
        :value="modelValue"
        :placeholder="setting.placeholder"
        :disabled="setting.disabled || readonly"
        @update:value="handleValueChange"
      />
      <template v-if="setting.description" #feedback>
        <span class="field-description">{{ setting.description }}</span>
      </template>
    </n-form-item>
  </div>
</template>

<script setup lang="ts">
/**
 * FormField - 表单字段组件
 * 根据设置项类型渲染对应的表单控件
 * 支持所有标准的表单控件类型和 Vue 组件渲染
 */

import { computed } from 'vue'
import {
  NFormItem,
  NInput,
  NInputNumber,
  NColorPicker,
  NSlider,
  NSwitch,
  NSelect,
  NCheckbox,
  NRadioGroup,
  NRadio,
  NDatePicker,
  NDynamicTags,
  NSpace
} from 'naive-ui'
import type { Setting } from '@/card2.1/types/setting-config'

interface Props {
  // 设置项配置
  setting: Setting
  // 当前值
  modelValue?: unknown
  // 是否只读
  readonly?: boolean
}

interface Emits {
  (event: 'update:modelValue', value: unknown): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 处理值变化
const handleValueChange = (value: unknown) => {
  emit('update:modelValue', value)
}

// 下拉选择器选项
const selectOptions = computed(() => {
  if (!props.setting.options) return []

  return props.setting.options.map(option => ({
    label: option.label,
    value: option.value,
    disabled: option.disabled || false
  }))
})
</script>

<style scoped>
.form-field {
  width: 100%;
}

.field-description {
  color: var(--text-color-3);
  font-size: 12px;
  line-height: 1.4;
}

:deep(.n-form-item-feedback) {
  margin-top: 4px;
}
</style>