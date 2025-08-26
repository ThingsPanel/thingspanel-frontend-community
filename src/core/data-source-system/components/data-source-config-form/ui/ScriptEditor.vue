<template>
  <div class="script-editor">
    <!-- 编辑器标题和工具栏 -->
    <div v-if="showHeader" class="editor-header">
      <n-space align="center" justify="space-between">
        <n-text strong>{{ title || $t('script.editor.title') }}</n-text>
        <n-space :size="4">
          <n-button
            size="tiny"
            tertiary
            :loading="formatting"
            :disabled="!modelValue || readonly"
            @click="formatScript"
          >
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

          <n-button size="tiny" tertiary :loading="validating" @click="validateScript">
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

          <n-button
            v-if="showTemplateButton"
            size="tiny"
            tertiary
            :disabled="readonly"
            @click="showTemplateModal = true"
          >
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z"
                    fill="currentColor"
                  />
                </svg>
              </n-icon>
            </template>
            {{ $t('script.template.button') }}
          </n-button>

          <n-button size="tiny" tertiary type="error" :disabled="!modelValue || readonly" @click="clearContent">
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
      </n-space>
    </div>

    <!-- 脚本编辑器主体 -->
    <div class="editor-container">
      <n-input
        :value="modelValue"
        type="textarea"
        :rows="rows"
        :placeholder="placeholder || getDefaultPlaceholder()"
        :status="validationResult && !validationResult.valid ? 'error' : undefined"
        :disabled="readonly"
        class="script-textarea"
        @update:value="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </div>

    <!-- 验证结果显示 -->
    <div v-if="validationResult && !validationResult.valid" class="validation-error">
      <n-alert type="error" :show-icon="false" style="margin-top: 8px">
        <template #header>
          <n-text style="font-size: 12px; font-weight: 500">{{ $t('script.validation.error') }}</n-text>
        </template>
        <n-text style="font-size: 11px">{{ validationResult.error }}</n-text>

        <!-- 详细错误信息 -->
        <div v-if="validationResult.details" style="margin-top: 8px">
          <n-text depth="3" style="font-size: 10px">
            {{ $t('script.validation.line') }}: {{ validationResult.details.line }},
            {{ $t('script.validation.column') }}: {{ validationResult.details.column }}
          </n-text>
        </div>
      </n-alert>
    </div>

    <!-- 脚本信息显示 -->
    <div v-if="showInfo && validationResult?.valid && scriptInfo" class="script-info">
      <n-space :size="8" align="center">
        <n-text depth="3" style="font-size: 10px">{{ $t('script.info.size') }}: {{ scriptInfo.size }}</n-text>
        <n-text depth="3" style="font-size: 10px">{{ $t('script.info.lines') }}: {{ scriptInfo.lines }}</n-text>
        <n-text v-if="scriptInfo.functions > 0" depth="3" style="font-size: 10px">
          {{ $t('script.info.functions') }}: {{ scriptInfo.functions }}
        </n-text>
      </n-space>
    </div>

    <!-- 脚本模板选择弹窗 -->
    <n-modal v-model:show="showTemplateModal" preset="dialog" style="width: 600px">
      <template #header>
        <n-text>{{ $t('script.template.title') }}</n-text>
      </template>

      <div class="template-list">
        <n-space vertical :size="8">
          <div
            v-for="template in scriptTemplates"
            :key="template.id"
            class="template-item"
            @click="selectTemplate(template)"
          >
            <n-card size="small" hoverable class="template-card">
              <n-space vertical :size="4">
                <n-text strong style="font-size: 14px">{{ template.name }}</n-text>
                <n-text depth="2" style="font-size: 12px">{{ template.description }}</n-text>
                <n-text depth="3" style="font-size: 10px">
                  {{ $t('script.template.category') }}: {{ template.category }}
                </n-text>
              </n-space>
            </n-card>
          </div>
        </n-space>
      </div>

      <template #action>
        <n-space>
          <n-button @click="showTemplateModal = false">{{ $t('common.cancel') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 脚本编辑器组件
 * 支持JavaScript/TypeScript代码编辑、验证、格式化
 * 提供脚本模板和语法检查功能
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NInput, NButton, NSpace, NIcon, NText, NAlert, NModal, NCard } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'

// 脚本语言类型
export type ScriptLanguage = 'javascript' | 'typescript'

// 脚本验证结果接口
interface ScriptValidationResult {
  valid: boolean
  error?: string
  details?: {
    line: number
    column: number
    code?: string
  }
}

// 脚本统计信息接口
interface ScriptInfo {
  size: string
  lines: number
  functions: number
  variables: number
}

// 脚本模板接口
interface ScriptTemplate {
  id: string
  name: string
  description: string
  category: string
  code: string
  language: ScriptLanguage
}

// 组件Props接口
interface Props {
  /** v-model绑定的脚本内容 */
  modelValue: string
  /** 脚本语言类型 */
  language?: ScriptLanguage
  /** 是否显示标题头 */
  showHeader?: boolean
  /** 标题文本 */
  title?: string
  /** 占位符文本 */
  placeholder?: string
  /** 文本域行数 */
  rows?: number
  /** 是否显示模板按钮 */
  showTemplateButton?: boolean
  /** 是否显示信息统计 */
  showInfo?: boolean
  /** 是否自动格式化 */
  autoFormat?: boolean
  /** 是否实时验证 */
  realTimeValidation?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 自定义脚本模板 */
  customTemplates?: ScriptTemplate[]
}

// 组件Emits接口
interface Emits {
  /** v-model更新事件 */
  'update:modelValue': [value: string]
  /** 验证事件 */
  validate: [result: ScriptValidationResult]
  /** 格式化事件 */
  format: [formatted: string]
  /** 模板选择事件 */
  'template-selected': [template: ScriptTemplate]
  /** 内容变更事件 */
  change: [value: string]
  /** 焦点事件 */
  focus: []
  /** 失焦事件 */
  blur: []
}

// Props和Emits定义
const props = withDefaults(defineProps<Props>(), {
  language: 'javascript',
  showHeader: true,
  rows: 8,
  showTemplateButton: true,
  showInfo: true,
  autoFormat: false,
  realTimeValidation: true,
  readonly: false
})

const emit = defineEmits<Emits>()

// 国际化和主题
const { t } = useI18n()
const themeStore = useThemeStore()

// 响应式状态
const formatting = ref(false)
const validating = ref(false)
const validationResult = ref<ScriptValidationResult | null>(null)
const showTemplateModal = ref(false)

// 默认占位符文本
const getDefaultPlaceholder = () => {
  switch (props.language) {
    case 'javascript':
      return t('script.placeholder.javascript')
    case 'typescript':
      return t('script.placeholder.typescript')
    default:
      return t('script.placeholder.default')
  }
}

// 脚本统计信息
const scriptInfo = computed((): ScriptInfo | null => {
  if (!props.modelValue || !validationResult.value?.valid) {
    return null
  }

  const content = props.modelValue
  const size = new Blob([content]).size
  const sizeText = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`

  const lines = content.split('\n').length
  const functions = (content.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || []).length
  const variables = (content.match(/(?:const|let|var)\s+\w+/g) || []).length

  return {
    size: sizeText,
    lines,
    functions,
    variables
  }
})

// 内置脚本模板
const defaultTemplates: ScriptTemplate[] = [
  {
    id: 'blank',
    name: t('script.templates.blank.name'),
    description: t('script.templates.blank.description'),
    category: 'basic',
    code: '// 在此编写您的脚本\nreturn data;',
    language: 'javascript'
  },
  {
    id: 'data-transform',
    name: t('script.templates.transform.name'),
    description: t('script.templates.transform.description'),
    category: 'transform',
    code: `// 数据转换模板
// 输入参数: data - 原始数据
// 返回值: 转换后的数据

// 示例：提取特定字段
const result = {
  id: data.id,
  name: data.name,
  timestamp: new Date().toISOString()
};

return result;`,
    language: 'javascript'
  },
  {
    id: 'array-filter',
    name: t('script.templates.filter.name'),
    description: t('script.templates.filter.description'),
    category: 'filter',
    code: `// 数组过滤模板
// 输入参数: data - 数组数据
// 返回值: 过滤后的数组

if (!Array.isArray(data)) {
  return data;
}

// 示例：过滤活跃项目
const filtered = data.filter(item => {
  return item.active === true && item.status === 'online';
});

return filtered;`,
    language: 'javascript'
  },
  {
    id: 'data-merge',
    name: t('script.templates.merge.name'),
    description: t('script.templates.merge.description'),
    category: 'merge',
    code: `// 数据合并模板
// 输入参数: dataList - 数据项数组
// 返回值: 合并后的数据

const result = {};

dataList.forEach((item, index) => {
  // 合并策略：后面的数据覆盖前面的
  Object.assign(result, item);
  
  // 或者添加索引前缀
  // Object.keys(item).forEach(key => {
  //   result[\`\${key}_\${index}\`] = item[key];
  // });
});

return result;`,
    language: 'javascript'
  }
]

// 合并自定义模板和默认模板
const scriptTemplates = computed(() => {
  return [...defaultTemplates, ...(props.customTemplates || [])]
})

/**
 * 验证JavaScript脚本语法
 */
const validateJavaScript = (script: string): ScriptValidationResult => {
  if (!script.trim()) {
    return { valid: true }
  }

  try {
    // 简单的语法检查
    new Function(script)
    return { valid: true }
  } catch (error) {
    const err = error as Error
    const match = err.message.match(/line (\d+)/) || err.message.match(/position (\d+)/)

    return {
      valid: false,
      error: err.message,
      details: match
        ? {
            line: parseInt(match[1]) || 1,
            column: 1
          }
        : undefined
    }
  }
}

/**
 * 格式化JavaScript代码
 */
const formatJavaScript = (script: string): { success: boolean; data?: string; error?: string } => {
  try {
    if (!script.trim()) {
      return { success: true, data: '' }
    }

    // 简单的格式化：添加适当的缩进和换行
    let formatted = script
      .replace(/;(\s*)/g, ';\n$1')
      .replace(/{(\s*)/g, ' {\n$1  ')
      .replace(/}(\s*)/g, '\n$1}')
      .replace(/,(\s*)/g, ',\n$1')

    // 清理多余的空行
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n')

    return { success: true, data: formatted }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '格式化失败'
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
    const result = validateJavaScript(value)
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
    formatScript()
  }
}

/**
 * 处理焦点事件
 */
const handleFocus = () => {
  emit('focus')
}

/**
 * 格式化脚本
 */
const formatScript = async () => {
  if (!props.modelValue || props.readonly) return

  formatting.value = true

  try {
    await nextTick()
    const result = formatJavaScript(props.modelValue)

    if (result.success && result.data !== props.modelValue) {
      emit('update:modelValue', result.data!)
      emit('format', result.data!)

      // 重新验证格式化后的代码
      const validationResult = validateJavaScript(result.data!)
      validationResult.value = validationResult
      emit('validate', validationResult)
    }
  } finally {
    formatting.value = false
  }
}

/**
 * 验证脚本
 */
const validateScript = async () => {
  validating.value = true

  try {
    await nextTick()
    const result = validateJavaScript(props.modelValue)
    validationResult.value = result
    emit('validate', result)
  } finally {
    validating.value = false
  }
}

/**
 * 清空内容
 */
const clearContent = () => {
  if (props.readonly) return

  emit('update:modelValue', '')
  emit('change', '')
  validationResult.value = null
}

/**
 * 选择脚本模板
 */
const selectTemplate = (template: ScriptTemplate) => {
  if (props.readonly) return

  emit('update:modelValue', template.code)
  emit('template-selected', template)
  showTemplateModal.value = false

  // 验证模板代码
  const result = validateJavaScript(template.code)
  validationResult.value = result
  emit('validate', result)
}

// 初始验证
watch(
  () => props.modelValue,
  newValue => {
    if (props.realTimeValidation) {
      const result = validateJavaScript(newValue)
      validationResult.value = result
    }
  },
  { immediate: true }
)

// 公开的方法供父组件调用
defineExpose({
  /** 格式化脚本 */
  format: formatScript,
  /** 验证脚本 */
  validate: validateScript,
  /** 清空内容 */
  clear: clearContent,
  /** 获取验证结果 */
  getValidationResult: () => validationResult.value,
  /** 获取脚本信息 */
  getScriptInfo: () => scriptInfo.value,
  /** 插入文本到光标位置 */
  insertText: (text: string) => {
    const current = props.modelValue
    const newValue = current + text
    emit('update:modelValue', newValue)
  }
})
</script>

<style scoped>
.script-editor {
  width: 100%;
}

.editor-header {
  margin-bottom: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider-color);
}

.editor-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
  overflow: hidden;
  transition: all 0.2s ease;
}

.editor-container:hover {
  border-color: var(--primary-color-hover);
}

.editor-container:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-opacity-2);
}

.script-textarea {
  border: none !important;
  box-shadow: none !important;
}

.script-textarea :deep(.n-input__textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace !important;
  font-size: 12px;
  line-height: 1.6;
  border: none;
  background: transparent;
  resize: vertical;
  padding: 12px;
}

.script-textarea :deep(.n-input__textarea):focus {
  box-shadow: none;
}

.validation-error {
  margin-top: 4px;
}

.script-info {
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.template-list {
  max-height: 400px;
  overflow-y: auto;
}

.template-item {
  cursor: pointer;
}

.template-card {
  transition: all 0.2s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--box-shadow-color);
}

/* 自定义滚动条 */
.template-list::-webkit-scrollbar {
  width: 4px;
}

.template-list::-webkit-scrollbar-track {
  background: var(--hover-color);
  border-radius: 2px;
}

.template-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.template-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

/* 主题适配 */
[data-theme='dark'] .editor-container {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .script-textarea :deep(.n-input__textarea) {
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-color);
}

[data-theme='light'] .editor-container {
  background: rgba(0, 0, 0, 0.01);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .script-textarea :deep(.n-input__textarea) {
  background: rgba(255, 255, 255, 0.8);
}

/* 无障碍设计 */
@media (prefers-reduced-motion: reduce) {
  .editor-container,
  .template-card {
    transition: none;
  }
}

@media (prefers-contrast: high) {
  .editor-container {
    border-width: 2px;
  }
}
</style>
