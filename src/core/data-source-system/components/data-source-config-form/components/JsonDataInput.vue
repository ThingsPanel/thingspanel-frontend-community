<template>
  <div class="json-data-input">
    <!-- 标签区域 -->
    <div v-if="showLabel && label" class="input-label">
      <n-text :depth="2">{{ label }}</n-text>
      <n-text v-if="required" style="color: var(--error-color)">*</n-text>
    </div>

    <!-- JSON编辑器容器 -->
    <div class="json-editor-container">
      <!-- 编辑器工具栏 -->
      <div class="editor-toolbar">
        <n-space :size="6" align="center" justify="space-between">
          <n-space :size="6" align="center">
            <n-button size="tiny" tertiary :loading="formatting" :disabled="!modelValue" @click="formatJson">
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

            <n-button size="tiny" tertiary :loading="validating" @click="validateJson">
              <template #icon>
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                      stroke="currentColor"
                      stroke-width="2"
                      fill="none"
                    ></path>
                  </svg>
                </n-icon>
              </template>
              {{ $t('common.validate') }}
            </n-button>

            <n-button size="tiny" tertiary :disabled="!modelValue" @click="compressJson">
              <template #icon>
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M8 2V5L11 7L8 9V12L12 8L8 2Z" fill="currentColor"></path>
                    <path d="M16 12V9L13 7L16 5V2L12 6L16 12Z" fill="currentColor"></path>
                  </svg>
                </n-icon>
              </template>
              {{ $t('common.compress') }}
            </n-button>

            <n-button size="tiny" tertiary type="error" :disabled="!modelValue" @click="clearContent">
              <template #icon>
                <n-icon size="12">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 7L18.1 5.5L12 11.6L5.9 5.5L5 7L11.1 13L5 19L5.9 20.5L12 14.4L18.1 20.5L19 19L12.9 13L19 7Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </n-icon>
              </template>
              {{ $t('common.clear') }}
            </n-button>
          </n-space>

          <!-- 验证状态指示器 -->
          <n-space :size="4" align="center">
            <n-spin v-if="validating" size="small" />
            <template v-else-if="validationResult">
              <n-icon v-if="validationResult.valid" size="14" style="color: var(--success-color)">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
                </svg>
              </n-icon>
              <n-icon v-else size="14" style="color: var(--error-color)">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 7L18.1 5.5L12 11.6L5.9 5.5L5 7L11.1 13L5 19L5.9 20.5L12 14.4L18.1 20.5L19 19L12.9 13L19 7Z"
                    fill="currentColor"
                  />
                </svg>
              </n-icon>
            </template>
            <n-text
              v-if="validationResult && !validationResult.valid"
              style="color: var(--error-color); font-size: 10px"
            >
              {{ validationResult.error }}
            </n-text>
          </n-space>
        </n-space>
      </div>

      <!-- JSON输入区域 -->
      <n-input
        :value="modelValue"
        type="textarea"
        :rows="rows"
        :placeholder="placeholder || $t('json.placeholder')"
        :status="validationResult && !validationResult.valid ? 'error' : undefined"
        class="json-textarea"
        @update:value="handleInput"
        @blur="handleBlur"
      />

      <!-- 验证错误详情 -->
      <div v-if="validationResult && !validationResult.valid && showErrorDetails" class="error-details">
        <n-alert type="error" :show-icon="false" style="margin-top: 8px">
          <template #header>
            <n-text style="font-size: 12px; font-weight: 500">{{ $t('json.validation.error') }}</n-text>
          </template>
          <n-text style="font-size: 11px">{{ validationResult.error }}</n-text>
        </n-alert>
      </div>

      <!-- JSON统计信息 -->
      <div v-if="showStats && validationResult?.valid && jsonStats" class="json-stats">
        <n-space :size="8" align="center">
          <n-text depth="3" style="font-size: 10px">{{ $t('json.stats.size') }}: {{ jsonStats.size }}</n-text>
          <n-text depth="3" style="font-size: 10px">{{ $t('json.stats.type') }}: {{ jsonStats.type }}</n-text>
          <n-text v-if="jsonStats.itemCount !== undefined" depth="3" style="font-size: 10px">
            {{ $t('json.stats.items') }}: {{ jsonStats.itemCount }}
          </n-text>
        </n-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * JSON数据输入组件
 * 提供JSON数据的编辑、验证、格式化等功能
 * 支持实时验证和工具栏操作
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NInput, NButton, NSpace, NIcon, NText, NAlert, NSpin } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'

// 类型定义
interface Props {
  /** v-model绑定的JSON字符串 */
  modelValue: string
  /** 是否显示标签 */
  showLabel?: boolean
  /** 标签文本 */
  label?: string
  /** 是否必填 */
  required?: boolean
  /** 占位符文本 */
  placeholder?: string
  /** 文本域行数 */
  rows?: number
  /** 是否启用自动格式化 */
  autoFormat?: boolean
  /** 是否实时验证 */
  realTimeValidation?: boolean
  /** 是否显示错误详情 */
  showErrorDetails?: boolean
  /** 是否显示统计信息 */
  showStats?: boolean
  /** 是否只读 */
  readonly?: boolean
}

interface Emits {
  /** v-model更新事件 */
  'update:modelValue': [value: string]
  /** JSON验证事件 */
  validate: [result: { valid: boolean; error?: string }]
  /** 格式化事件 */
  format: [formatted: string]
  /** 内容变更事件 */
  change: [value: string]
  /** 焦点事件 */
  focus: []
  /** 失焦事件 */
  blur: []
}

// JSON验证结果接口
interface JsonValidationResult {
  valid: boolean
  error?: string
  data?: any
}

// JSON统计信息接口
interface JsonStats {
  size: string
  type: string
  itemCount?: number
  keyCount?: number
}

// Props和Emits定义
const props = withDefaults(defineProps<Props>(), {
  showLabel: false,
  required: false,
  rows: 6,
  autoFormat: false,
  realTimeValidation: true,
  showErrorDetails: true,
  showStats: true,
  readonly: false
})

const emit = defineEmits<Emits>()

// 国际化和主题
const { t } = useI18n()
const themeStore = useThemeStore()

// 响应式状态
const formatting = ref(false)
const validating = ref(false)
const validationResult = ref<JsonValidationResult | null>(null)

// JSON统计信息计算属性
const jsonStats = computed((): JsonStats | null => {
  if (!props.modelValue || !validationResult.value?.valid) {
    return null
  }

  try {
    const data = JSON.parse(props.modelValue)
    const size = new Blob([props.modelValue]).size
    const sizeText =
      size < 1024
        ? `${size} B`
        : size < 1024 * 1024
          ? `${(size / 1024).toFixed(1)} KB`
          : `${(size / 1024 / 1024).toFixed(1)} MB`

    let stats: JsonStats = {
      size: sizeText,
      type: Array.isArray(data) ? 'Array' : typeof data
    }

    if (Array.isArray(data)) {
      stats.itemCount = data.length
    } else if (typeof data === 'object' && data !== null) {
      stats.keyCount = Object.keys(data).length
    }

    return stats
  } catch {
    return null
  }
})

/**
 * 验证JSON格式
 * @param jsonString JSON字符串
 * @returns 验证结果
 */
const validateJsonString = (jsonString: string): JsonValidationResult => {
  if (!jsonString.trim()) {
    return { valid: true }
  }

  try {
    const parsed = JSON.parse(jsonString)
    return { valid: true, data: parsed }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '无效的JSON格式'
    }
  }
}

/**
 * 格式化JSON字符串
 * @param jsonString JSON字符串
 * @param indent 缩进空格数
 * @returns 格式化结果
 */
const formatJsonString = (
  jsonString: string,
  indent: number = 2
): { success: boolean; data?: string; error?: string } => {
  try {
    if (!jsonString.trim()) {
      return { success: true, data: '' }
    }

    const parsed = JSON.parse(jsonString)
    const formatted = JSON.stringify(parsed, null, indent)
    return { success: true, data: formatted }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '格式化失败'
    }
  }
}

/**
 * 压缩JSON字符串
 * @param jsonString JSON字符串
 * @returns 压缩结果
 */
const compressJsonString = (jsonString: string): { success: boolean; data?: string; error?: string } => {
  try {
    if (!jsonString.trim()) {
      return { success: true, data: '' }
    }

    const parsed = JSON.parse(jsonString)
    const compressed = JSON.stringify(parsed)
    return { success: true, data: compressed }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '压缩失败'
    }
  }
}

/**
 * 处理输入变化
 */
const handleInput = (value: string) => {
  emit('update:modelValue', value)
  emit('change', value)

  // 实时验证
  if (props.realTimeValidation) {
    const result = validateJsonString(value)
    validationResult.value = result
    emit('validate', result)
  }
}

/**
 * 处理失焦事件
 */
const handleBlur = () => {
  emit('blur')

  // 自动格式化
  if (props.autoFormat && props.modelValue) {
    const result = formatJsonString(props.modelValue)
    if (result.success && result.data !== props.modelValue) {
      emit('update:modelValue', result.data!)
      emit('format', result.data!)
    }
  }
}

/**
 * 格式化JSON
 */
const formatJson = async () => {
  if (!props.modelValue) return

  formatting.value = true

  try {
    await nextTick()
    const result = formatJsonString(props.modelValue)

    if (result.success) {
      emit('update:modelValue', result.data!)
      emit('format', result.data!)

      // 重新验证格式化后的数据
      const validationResult = validateJsonString(result.data!)
      validationResult.value = validationResult
      emit('validate', validationResult)
    } else {
      console.error('JSON格式化失败:', result.error)
    }
  } finally {
    formatting.value = false
  }
}

/**
 * 验证JSON
 */
const validateJson = async () => {
  validating.value = true

  try {
    await nextTick()
    const result = validateJsonString(props.modelValue)
    validationResult.value = result
    emit('validate', result)
  } finally {
    validating.value = false
  }
}

/**
 * 压缩JSON
 */
const compressJson = async () => {
  if (!props.modelValue) return

  try {
    const result = compressJsonString(props.modelValue)

    if (result.success) {
      emit('update:modelValue', result.data!)

      // 重新验证压缩后的数据
      const validationResult = validateJsonString(result.data!)
      validationResult.value = validationResult
      emit('validate', validationResult)
    } else {
      console.error('JSON压缩失败:', result.error)
    }
  } catch (error) {
    console.error('压缩操作失败:', error)
  }
}

/**
 * 清空内容
 */
const clearContent = () => {
  emit('update:modelValue', '')
  emit('change', '')
  validationResult.value = null
}

/**
 * 处理焦点事件
 */
const handleFocus = () => {
  emit('focus')
}

// 初始验证
watch(
  () => props.modelValue,
  newValue => {
    if (props.realTimeValidation) {
      const result = validateJsonString(newValue)
      validationResult.value = result
    }
  },
  { immediate: true }
)

// 公开的方法供父组件调用
defineExpose({
  /** 格式化JSON */
  format: formatJson,
  /** 验证JSON */
  validate: validateJson,
  /** 压缩JSON */
  compress: compressJson,
  /** 清空内容 */
  clear: clearContent,
  /** 获取验证结果 */
  getValidationResult: () => validationResult.value,
  /** 获取统计信息 */
  getStats: () => jsonStats.value
})
</script>

<style scoped>
.json-data-input {
  width: 100%;
}

.input-label {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.json-editor-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
  overflow: hidden;
  transition: all 0.2s ease;
}

.json-editor-container:hover {
  border-color: var(--primary-color-hover);
}

.json-editor-container:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-opacity-2);
}

.editor-toolbar {
  padding: 6px 8px;
  background: var(--hover-color);
  border-bottom: 1px solid var(--divider-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.json-textarea {
  border: none !important;
  box-shadow: none !important;
}

.json-textarea :deep(.n-input__textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace !important;
  font-size: 12px;
  line-height: 1.5;
  border: none;
  background: transparent;
  resize: vertical;
}

.json-textarea :deep(.n-input__textarea):focus {
  box-shadow: none;
}

.error-details {
  margin-top: 4px;
}

.json-stats {
  padding: 4px 8px;
  background: var(--hover-color);
  border-top: 1px solid var(--divider-color);
}

/* 主题适配 */
[data-theme='dark'] .json-editor-container {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .editor-toolbar {
  background: rgba(255, 255, 255, 0.05);
}

[data-theme='light'] .json-editor-container {
  background: rgba(0, 0, 0, 0.01);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .editor-toolbar {
  background: rgba(0, 0, 0, 0.02);
}

/* 无障碍设计 */
@media (prefers-reduced-motion: reduce) {
  .json-editor-container {
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .json-editor-container {
    border-width: 2px;
  }
}
</style>
