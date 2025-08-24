<template>
  <!-- JSON数据输入组件 -->
  <div class="json-data-input">
    <!-- 可选的标题 -->
    <n-form-item v-if="showLabel" :label="label" :label-width="labelWidth" :size="size" style="margin-bottom: 2px">
      <div class="json-editor-container">
        <!-- 编辑器工具栏 -->
        <div class="json-editor-toolbar">
          <!-- 左侧工具按钮 -->
          <n-space :size="6" align="center">
            <!-- 格式化按钮 -->
            <n-button size="tiny" tertiary @click="formatJson">
              <template #icon>
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </n-icon>
              </template>
              {{ $t('common.format') }}
            </n-button>

            <!-- 验证按钮 -->
            <n-button size="tiny" tertiary @click="validateJson">
              <template #icon>
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </n-icon>
              </template>
              {{ $t('common.validate') }}
            </n-button>

            <!-- 压缩按钮 -->
            <n-button size="tiny" tertiary @click="compressJson">
              <template #icon>
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6h2v2H6V6zm0 4h2v2H6v-2zm0 4h2v2H6v-2zm4-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </n-icon>
              </template>
              {{ $t('common.compress') }}
            </n-button>

            <!-- 清空按钮 -->
            <n-button size="tiny" tertiary type="warning" @click="clearJson">
              <template #icon>
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </n-icon>
              </template>
              {{ $t('common.clear') }}
            </n-button>
          </n-space>

          <!-- 右侧状态指示 -->
          <n-space :size="4" align="center">
            <!-- JSON验证状态 -->
            <n-popover placement="bottom" trigger="hover">
              <template #trigger>
                <n-tag size="small" :type="validationStatus.type" style="font-size: 10px; cursor: help">
                  {{ validationStatus.text }}
                </n-tag>
              </template>
              <div style="max-width: 300px; font-size: 12px">
                {{ validationStatus.detail }}
              </div>
            </n-popover>
          </n-space>
        </div>

        <!-- JSON输入区域 -->
        <n-input
          :value="internalValue"
          type="textarea"
          :placeholder="placeholder"
          :rows="rows"
          :disabled="disabled"
          :readonly="readonly"
          style="font-family: 'Courier New', monospace; font-size: 12px"
          @update:value="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
        />
      </div>
    </n-form-item>

    <!-- 无标题模式 -->
    <div v-else class="json-editor-container">
      <!-- 编辑器工具栏 -->
      <div class="json-editor-toolbar">
        <!-- 左侧工具按钮 -->
        <n-space :size="6" align="center">
          <!-- 格式化按钮 -->
          <n-button size="tiny" tertiary @click="formatJson">
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </n-icon>
            </template>
            {{ $t('common.format') }}
          </n-button>

          <!-- 验证按钮 -->
          <n-button size="tiny" tertiary @click="validateJson">
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    fill="currentColor"
                  ></path>
                </svg>
              </n-icon>
            </template>
            {{ $t('common.validate') }}
          </n-button>

          <!-- 压缩按钮 -->
          <n-button size="tiny" tertiary @click="compressJson">
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6h2v2H6V6zm0 4h2v2H6v-2zm0 4h2v2H6v-2zm4-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"
                    fill="currentColor"
                  ></path>
                </svg>
              </n-icon>
            </template>
            {{ $t('common.compress') }}
          </n-button>

          <!-- 清空按钮 -->
          <n-button size="tiny" tertiary type="warning" @click="clearJson">
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                    fill="currentColor"
                  ></path>
                </svg>
              </n-icon>
            </template>
            {{ $t('common.clear') }}
          </n-button>
        </n-space>

        <!-- 右侧状态指示 -->
        <n-space :size="4" align="center">
          <!-- JSON验证状态 -->
          <n-popover placement="bottom" trigger="hover">
            <template #trigger>
              <n-tag size="small" :type="validationStatus.type" style="font-size: 10px; cursor: help">
                {{ validationStatus.text }}
              </n-tag>
            </template>
            <div style="max-width: 300px; font-size: 12px">
              {{ validationStatus.detail }}
            </div>
          </n-popover>
        </n-space>
      </div>

      <!-- JSON输入区域 -->
      <n-input
        :value="internalValue"
        type="textarea"
        :placeholder="placeholder"
        :rows="rows"
        :disabled="disabled"
        :readonly="readonly"
        style="font-family: 'Courier New', monospace; font-size: 12px"
        @update:value="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * JSON数据输入组件
 * 提供JSON编辑、格式化、验证、压缩等功能的完整解决方案
 */

import { computed, ref, watch } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { useI18n } from 'vue-i18n'
import type { FormItemSize, TagType } from 'naive-ui'

// 组件接口定义
interface Props {
  /** JSON内容 - 支持v-model */
  modelValue?: string
  /** 是否显示标题 */
  showLabel?: boolean
  /** 标题文本 */
  label?: string
  /** 标题宽度 */
  labelWidth?: number
  /** 占位提示文本 */
  placeholder?: string
  /** 输入框行数 */
  rows?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 组件尺寸 */
  size?: FormItemSize
  /** 是否在输入时自动验证 */
  autoValidate?: boolean
  /** 是否在失焦时自动格式化 */
  autoFormat?: boolean
}

// 验证状态类型定义
interface ValidationStatus {
  type: TagType
  text: string
  detail: string
}

// Props 和 emits 定义
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  showLabel: false,
  label: 'JSON数据',
  labelWidth: 60,
  placeholder: '请输入JSON数据',
  rows: 8,
  disabled: false,
  readonly: false,
  size: 'small',
  autoValidate: true,
  autoFormat: false
})

const emit = defineEmits<{
  /** 数据更新事件 */
  'update:modelValue': [value: string]
  /** 验证状态变化事件 */
  'validation-change': [status: ValidationStatus]
  /** 输入事件 */
  input: [value: string]
  /** 失焦事件 */
  blur: [event: FocusEvent]
  /** 聚焦事件 */
  focus: [event: FocusEvent]
  /** JSON格式化事件 */
  format: [value: string]
  /** JSON验证事件 */
  validate: [status: ValidationStatus]
  /** 内容清空事件 */
  clear: []
}>()

// 国际化集成（强制）
const { t } = useI18n()

// 主题系统集成（强制）
const themeStore = useThemeStore()

// 响应式状态
const internalValue = ref(props.modelValue)
const validationStatus = ref<ValidationStatus>({
  type: 'default',
  text: t('common.unvalidated'),
  detail: t('json.validation.pleaseInput')
})

// 计算属性
const isDark = computed(() => themeStore.darkMode)

// 监听器
watch(
  () => props.modelValue,
  newValue => {
    internalValue.value = newValue
    if (props.autoValidate) {
      validateJson()
    }
  }
)

watch(
  () => internalValue.value,
  newValue => {
    emit('update:modelValue', newValue)
    if (props.autoValidate) {
      validateJson()
    }
  }
)

/**
 * 处理输入事件
 * @param value 输入值
 */
const handleInput = (value: string) => {
  internalValue.value = value
  emit('input', value)
}

/**
 * 处理失焦事件
 * @param event 失焦事件
 */
const handleBlur = (event: FocusEvent) => {
  if (props.autoFormat && internalValue.value.trim()) {
    formatJson()
  }
  emit('blur', event)
}

/**
 * 处理聚焦事件
 * @param event 聚焦事件
 */
const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

/**
 * 格式化JSON数据
 * 将JSON字符串格式化为可读的缩进形式
 */
const formatJson = () => {
  try {
    if (!internalValue.value.trim()) {
      window.$message?.warning(t('json.format.emptyWarning'))
      return
    }

    const parsed = JSON.parse(internalValue.value)
    const formatted = JSON.stringify(parsed, null, 2)
    internalValue.value = formatted

    window.$message?.success(t('json.format.success'))
    emit('format', formatted)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    window.$message?.error(`${t('json.format.error')}: ${errorMessage}`)
    console.warn('JSON格式化失败:', error)
  }
}

/**
 * 验证JSON格式
 * 检查JSON字符串的有效性并更新验证状态
 */
const validateJson = () => {
  try {
    if (!internalValue.value.trim()) {
      validationStatus.value = {
        type: 'warning',
        text: t('json.validation.empty'),
        detail: t('json.validation.pleaseInput')
      }
      emit('validation-change', validationStatus.value)
      return
    }

    const parsed = JSON.parse(internalValue.value)
    const keyCount = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0

    validationStatus.value = {
      type: 'success',
      text: t('json.validation.valid'),
      detail: `${t('json.validation.parseSuccess')}, ${t('json.validation.keyCount', { count: keyCount })}`
    }

    emit('validation-change', validationStatus.value)
    emit('validate', validationStatus.value)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    validationStatus.value = {
      type: 'error',
      text: t('json.validation.invalid'),
      detail: `${t('json.validation.error')}: ${errorMessage}`
    }

    emit('validation-change', validationStatus.value)
    emit('validate', validationStatus.value)
  }
}

/**
 * 压缩JSON数据
 * 移除JSON字符串中的所有空白字符和换行符
 */
const compressJson = () => {
  try {
    if (!internalValue.value.trim()) {
      window.$message?.warning(t('json.compress.emptyWarning'))
      return
    }

    const parsed = JSON.parse(internalValue.value)
    const compressed = JSON.stringify(parsed)
    internalValue.value = compressed

    window.$message?.success(t('json.compress.success'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    window.$message?.error(`${t('json.compress.error')}: ${errorMessage}`)
    console.warn('JSON压缩失败:', error)
  }
}

/**
 * 清空JSON内容
 * 清除输入框中的所有内容
 */
const clearJson = () => {
  internalValue.value = ''
  validationStatus.value = {
    type: 'default',
    text: t('common.unvalidated'),
    detail: t('json.validation.pleaseInput')
  }

  window.$message?.info(t('json.clear.success'))
  emit('clear')
  emit('validation-change', validationStatus.value)
}

/**
 * 获取当前JSON数据的解析值
 * @returns 解析后的JSON对象或null
 */
const getParsedValue = () => {
  try {
    return internalValue.value.trim() ? JSON.parse(internalValue.value) : null
  } catch {
    return null
  }
}

/**
 * 设置JSON内容
 * @param value JSON字符串或对象
 */
const setValue = (value: string | object) => {
  if (typeof value === 'string') {
    internalValue.value = value
  } else {
    internalValue.value = JSON.stringify(value, null, 2)
  }

  if (props.autoValidate) {
    validateJson()
  }
}

/**
 * 获取验证状态
 */
const getValidationStatus = () => validationStatus.value

// 组件初始化时进行验证
if (props.autoValidate && props.modelValue) {
  validateJson()
}

// 暴露公共方法供父组件调用
defineExpose({
  formatJson,
  validateJson,
  compressJson,
  clearJson,
  getParsedValue,
  setValue,
  getValidationStatus
})
</script>

<style scoped>
/**
 * JSON数据输入组件样式
 * 集成主题系统，支持明暗主题切换
 */

.json-data-input {
  width: 100%;
}

/* JSON编辑器容器 */
.json-editor-container {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  overflow: hidden;
  background: var(--card-color);
  transition: border-color 0.2s ease-in-out;
}

.json-editor-container:hover {
  border-color: var(--primary-color-hover);
}

.json-editor-container:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-opacity);
}

/* 编辑器工具栏 */
.json-editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--hover-color);
  border-bottom: 1px solid var(--border-color);
  min-height: 32px;
  transition: background-color 0.2s ease-in-out;
}

/* 工具栏按钮样式 */
.json-editor-toolbar :deep(.n-button) {
  height: 24px;
  padding: 0 6px;
  font-size: 11px;
  transition: all 0.2s ease-in-out;
}

.json-editor-toolbar :deep(.n-button:hover) {
  transform: translateY(-1px);
}

.json-editor-toolbar :deep(.n-button .n-icon) {
  font-size: 12px;
}

/* 状态标签样式 */
.json-editor-toolbar :deep(.n-tag) {
  transition: all 0.2s ease-in-out;
}

/* 暗主题适配 */
[data-theme='dark'] .json-editor-container {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .json-editor-container:hover {
  border-color: var(--primary-color-hover);
}

[data-theme='dark'] .json-editor-container:focus-within {
  box-shadow:
    0 0 0 2px var(--primary-color-opacity),
    0 1px 3px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .json-editor-toolbar {
  background: rgba(255, 255, 255, 0.05);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

/* 禁用状态样式 */
.json-data-input[disabled] .json-editor-container {
  opacity: 0.6;
  cursor: not-allowed;
}

.json-data-input[disabled] .json-editor-toolbar {
  background: var(--disabled-color);
}

/* 只读状态样式 */
.json-data-input[readonly] .json-editor-container {
  background: var(--disabled-color);
}

.json-data-input[readonly] .json-editor-toolbar {
  background: var(--disabled-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .json-editor-toolbar {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .json-editor-toolbar :deep(.n-space) {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 动画效果 */
@keyframes validation-pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.json-editor-toolbar :deep(.n-tag[type='error']) {
  animation: validation-pulse 1.5s ease-in-out infinite;
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  .json-editor-container {
    border-width: 2px;
  }

  .json-editor-toolbar {
    border-bottom-width: 2px;
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .json-editor-container,
  .json-editor-toolbar,
  .json-editor-toolbar :deep(.n-button),
  .json-editor-toolbar :deep(.n-tag) {
    transition: none;
  }

  .json-editor-toolbar :deep(.n-button:hover) {
    transform: none;
  }

  .json-editor-toolbar :deep(.n-tag[type='error']) {
    animation: none;
  }
}
</style>
