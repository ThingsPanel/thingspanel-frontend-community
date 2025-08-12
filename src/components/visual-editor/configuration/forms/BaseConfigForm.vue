<template>
  <div class="base-config-form">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="auto"
      size="small"
      class="config-form"
    >
      <!-- 标题配置 -->
      <div class="config-section">
        <h4 class="section-title">{{ $t('config.base.title.section') }}</h4>

        <n-form-item :label="$t('config.base.showTitle')" path="showTitle">
          <n-switch v-model:value="formData.showTitle" @update:value="handleChange" />
        </n-form-item>

        <n-form-item v-if="formData.showTitle" :label="$t('config.base.title')" path="title">
          <n-input
            v-model:value="formData.title"
            :placeholder="$t('config.base.title.placeholder')"
            clearable
            @update:value="handleChange"
          />
        </n-form-item>
      </div>

      <!-- 显示配置 -->
      <div class="config-section">
        <h4 class="section-title">{{ $t('config.base.display.section') }}</h4>

        <n-form-item :label="$t('config.base.visible')" path="visible">
          <n-switch v-model:value="formData.visible" @update:value="handleChange" />
        </n-form-item>

        <n-form-item :label="$t('config.base.opacity')" path="opacity">
          <n-slider
            v-model:value="formData.opacity"
            :min="0"
            :max="1"
            :step="0.1"
            :format-tooltip="value => `${Math.round(value * 100)}%`"
            class="opacity-slider"
            @update:value="handleChange"
          />
        </n-form-item>
      </div>

      <!-- 高级选项 -->
      <div v-if="showAdvanced" class="config-section advanced-section">
        <h4 class="section-title">{{ $t('config.base.advanced.section') }}</h4>

        <n-form-item :label="$t('config.base.customClassName')" path="customClassName">
          <n-input
            v-model:value="formData.customClassName"
            :placeholder="$t('config.base.customClassName.placeholder')"
            clearable
            @update:value="handleChange"
          />
        </n-form-item>

        <!-- 外边距配置 -->
        <n-form-item :label="$t('config.base.margin')" path="margin">
          <div class="spacing-config">
            <div class="spacing-item">
              <label>{{ $t('common.top') }}</label>
              <n-input-number
                v-model:value="formData.margin.top"
                :min="0"
                :max="100"
                size="small"
                @update:value="handleChange"
              />
            </div>
            <div class="spacing-item">
              <label>{{ $t('common.right') }}</label>
              <n-input-number
                v-model:value="formData.margin.right"
                :min="0"
                :max="100"
                size="small"
                @update:value="handleChange"
              />
            </div>
            <div class="spacing-item">
              <label>{{ $t('common.bottom') }}</label>
              <n-input-number
                v-model:value="formData.margin.bottom"
                :min="0"
                :max="100"
                size="small"
                @update:value="handleChange"
              />
            </div>
            <div class="spacing-item">
              <label>{{ $t('common.left') }}</label>
              <n-input-number
                v-model:value="formData.margin.left"
                :min="0"
                :max="100"
                size="small"
                @update:value="handleChange"
              />
            </div>
          </div>
        </n-form-item>

        <!-- 内边距配置 -->
        <n-form-item :label="$t('config.base.padding')" path="padding">
          <div class="spacing-config">
            <div class="spacing-item">
              <label>{{ $t('common.top') }}</label>
              <n-input-number
                v-model:value="formData.padding.top"
                :min="0"
                :max="100"
                size="small"
                @update:value="handleChange"
              />
            </div>
            <div class="spacing-item">
              <label>{{ $t('common.right') }}</label>
              <n-input-number
                v-model:value="formData.padding.right"
                :min="0"
                :max="100"
                size="small"
                @update:value="handleChange"
              />
            </div>
            <div class="spacing-item">
              <label>{{ $t('common.bottom') }}</label>
              <n-input-number
                v-model:value="formData.padding.bottom"
                :min="0"
                :max="100"
                size="small"
                @update:value="handleChange"
              />
            </div>
            <div class="spacing-item">
              <label>{{ $t('common.left') }}</label>
              <n-input-number
                v-model:value="formData.padding.left"
                :min="0"
                :max="100"
                size="small"
                @update:value="handleChange"
              />
            </div>
          </div>
        </n-form-item>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <n-space>
          <n-button size="small" @click="handleReset">
            {{ $t('common.reset') }}
          </n-button>
          <n-button v-if="showAdvanced !== undefined" size="small" @click="$emit('toggle-advanced')">
            {{ showAdvanced ? $t('config.hideAdvanced') : $t('config.showAdvanced') }}
          </n-button>
        </n-space>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 基础配置表单组件
 * 负责处理组件的基础渲染配置，如标题、透明度、边距等
 * 这些配置主要由包装组件使用
 */

import { ref, reactive, watch, computed } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NSlider,
  NButton,
  NSpace,
  FormInst,
  FormRules
} from 'naive-ui'
import type { BaseConfiguration, ConfigFormProps, ConfigFormEmits, ValidationResult } from '../types'

interface Props extends ConfigFormProps<BaseConfiguration> {
  /** 是否显示高级选项 */
  showAdvanced?: boolean
}

interface Emits extends ConfigFormEmits<BaseConfiguration> {
  (event: 'toggle-advanced'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    showTitle: false,
    title: '组件标题',
    opacity: 1,
    visible: true,
    customClassName: '',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 }
  }),
  readonly: false,
  showAdvanced: false
})

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInst>()

// 表单数据
const formData = reactive<BaseConfiguration>({
  ...props.modelValue
})

// 监听外部配置变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(formData)) {
      Object.assign(formData, newValue)
      console.log('BaseConfigForm - 外部配置已更新:', newValue)
    }
  },
  { deep: true }
)

// 表单验证规则
const formRules: FormRules = {
  title: {
    required: false,
    message: '请输入标题',
    trigger: 'blur'
  },
  opacity: {
    required: true,
    type: 'number',
    min: 0,
    max: 1,
    message: '透明度必须在0-1之间',
    trigger: 'change'
  },
  customClassName: {
    required: false,
    pattern: /^[a-zA-Z_][\w-]*$/,
    message: 'CSS类名格式不正确',
    trigger: 'blur'
  }
}

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

// 处理配置变化
const handleChange = () => {
  if (props.readonly) return

  // 验证表单
  formRef.value?.validate(async errors => {
    const validationResult: ValidationResult = {
      valid: !errors,
      errors: errors?.map(error => ({
        field: error.field || 'unknown',
        message: error.message || '验证失败',
        code: 'VALIDATION_ERROR'
      }))
    }

    emit('validate', validationResult)

    if (!errors) {
      // 发出配置更新事件
      const newConfig = { ...formData }
      emit('update:modelValue', newConfig)
      emit('change', newConfig, props.modelValue)
    }
  })
}

// 重置表单
const handleReset = () => {
  if (props.readonly) return

  const defaultConfig: BaseConfiguration = {
    showTitle: false,
    title: '组件标题',
    opacity: 1,
    visible: true,
    customClassName: '',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 }
  }

  Object.assign(formData, defaultConfig)
  emit('update:modelValue', defaultConfig)
}

// 暴露验证方法
const validate = async (): Promise<ValidationResult> => {
  return new Promise(resolve => {
    formRef.value?.validate(errors => {
      resolve({
        valid: !errors,
        errors: errors?.map(error => ({
          field: error.field || 'unknown',
          message: error.message || '验证失败',
          code: 'VALIDATION_ERROR'
        }))
      })
    })
  })
}

// 暴露公共方法
defineExpose({
  validate,
  reset: handleReset
})
</script>

<style scoped>
.base-config-form {
  padding: 0;
}

.config-form {
  width: 100%;
}

.config-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.advanced-section {
  border-top: 1px dashed var(--border-color);
  padding-top: 16px;
}

.spacing-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.spacing-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spacing-item label {
  font-size: 12px;
  color: var(--text-color-2);
  text-align: center;
}

.opacity-slider {
  margin: 0 8px;
}

.form-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .spacing-config {
    grid-template-columns: 1fr;
  }
}

/* 只读状态样式 */
.config-form :deep(.n-input[readonly]),
.config-form :deep(.n-input-number[readonly]),
.config-form :deep(.n-switch[disabled]) {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
