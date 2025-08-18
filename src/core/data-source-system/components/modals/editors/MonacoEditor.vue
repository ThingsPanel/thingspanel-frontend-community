<!--
  Monaco Editor 基础组件
  基于 monaco-editor-vue3 的通用代码编辑器组件
  避免直接导入monaco-editor导致的worker加载问题
-->
<template>
  <div class="monaco-editor-container" :style="containerStyle">
    <MonacoEditorVue3
      v-model:value="localValue"
      :language="language"
      :height="containerHeight"
      :options="mergedOptions"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Monaco Editor 基础组件
 * 基于 monaco-editor-vue3 包装器，避免worker加载问题
 */

import { computed, watch } from 'vue'
import MonacoEditorVue3 from 'monaco-editor-vue3'

// Props 定义
interface Props {
  value: string
  language?: string
  height?: number | string
  options?: Record<string, any>
  readonly?: boolean
}

// Emits 定义
interface Emits {
  (e: 'update:value', value: string): void
  (e: 'change', value: string): void
  (e: 'validation-changed', validation: { isValid: boolean; error: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  language: 'javascript',
  height: 300,
  readonly: false,
  options: () => ({})
})

const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 本地值绑定 */
const localValue = computed({
  get: () => props.value,
  set: value => {
    emit('update:value', value)
    emit('change', value)
  }
})

/** 容器样式 */
const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  width: '100%'
}))

/** 容器高度（传递给MonacoEditorVue3） */
const containerHeight = computed(() => {
  if (typeof props.height === 'number') {
    return props.height
  }
  // 如果是字符串，提取数字部分
  const match = String(props.height).match(/(\d+)/)
  return match ? parseInt(match[1]) : 300
})

/** 默认编辑器选项 */
const defaultOptions = {
  // 基本配置
  automaticLayout: true,
  fontSize: 11,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  lineHeight: 18,
  
  // 界面配置
  minimap: { enabled: false },
  lineNumbers: 'on',
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  
  // 缩进配置
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: false,
  
  // 滚动条配置
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8
  },
  
  // 编辑器边距
  padding: { top: 8, bottom: 8 },
  
  // 光标配置
  cursorStyle: 'line',
  cursorWidth: 2,
  cursorBlinking: 'blink',
  
  // 选择配置
  selectOnLineNumbers: true,
  roundedSelection: false,
  
  // 代码提示
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  quickSuggestions: true,
  
  // 代码折叠
  folding: true,
  foldingStrategy: 'auto',
  showFoldingControls: 'mouseover',
  
  // 括号匹配
  matchBrackets: 'always',
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'languageDefined',
  
  // 格式化
  formatOnPaste: true,
  formatOnType: false,
  
  // 查找配置
  find: {
    seedSearchStringFromSelection: 'always',
    autoFindInSelection: 'never'
  },
  
  // 主题
  theme: 'vs-light'
}

/** 合并的编辑器选项 */
const mergedOptions = computed(() => ({
  ...defaultOptions,
  ...props.options,
  readOnly: props.readonly
}))

// ========== 监听器 ==========

/** 监听值变化进行验证 */
watch(
  localValue,
  (newValue) => {
    validateContent(newValue)
  },
  { immediate: true }
)

// ========== 方法 ==========

/**
 * 验证内容
 */
function validateContent(content: string): void {
  if (props.language === 'json') {
    validateJson(content)
  } else if (props.language === 'javascript') {
    validateJavaScript(content)
  } else {
    emit('validation-changed', { isValid: true, error: '' })
  }
}

/**
 * 验证JSON格式
 */
function validateJson(content: string): void {
  if (!content.trim()) {
    emit('validation-changed', { isValid: true, error: '' })
    return
  }

  try {
    JSON.parse(content)
    emit('validation-changed', { isValid: true, error: '' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'JSON格式错误'
    emit('validation-changed', { isValid: false, error: errorMessage })
  }
}

/**
 * 验证JavaScript语法
 */
function validateJavaScript(content: string): void {
  if (!content.trim()) {
    emit('validation-changed', { isValid: true, error: '' })
    return
  }

  try {
    // 包装代码以支持return语句
    const wrappedCode = `
      (function(data) {
        ${content}
      })
    `
    
    // 尝试创建函数来检查语法
    new Function('return ' + wrappedCode)
    emit('validation-changed', { isValid: true, error: '' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'JavaScript语法错误'
    emit('validation-changed', { isValid: false, error: errorMessage })
  }
}

// ========== 事件处理器 ==========

/**
 * 处理内容变化
 */
function handleChange(value: string): void {
  // 值变化已通过computed处理
  console.log('🔧 [MonacoEditor] 内容已更新，长度:', value.length)
}
</script>

<style scoped>
/* Monaco Editor 容器样式 */
.monaco-editor-container {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--card-color);
}

/* 确保编辑器完全填充容器 */
.monaco-editor-container :deep(.monaco-editor) {
  width: 100% !important;
  height: 100% !important;
}

/* 光标样式优化 */
.monaco-editor-container :deep(.cursor) {
  background: var(--primary-color) !important;
  width: 2px !important;
}

/* 行号样式 */
.monaco-editor-container :deep(.line-numbers) {
  color: var(--text-color-3) !important;
}

/* 选中文本样式 */
.monaco-editor-container :deep(.selected-text) {
  background: var(--primary-color-pressed) !important;
}

/* 当前行高亮 */
.monaco-editor-container :deep(.current-line) {
  background: var(--hover-color) !important;
}

/* 错误波浪线样式 */
.monaco-editor-container :deep(.squiggly-error) {
  border-bottom: 2px wavy var(--error-color) !important;
}

.monaco-editor-container :deep(.squiggly-warning) {
  border-bottom: 2px wavy var(--warning-color) !important;
}

.monaco-editor-container :deep(.squiggly-info) {
  border-bottom: 2px wavy var(--info-color) !important;
}

/* 代码提示面板样式 */
.monaco-editor-container :deep(.suggest-widget) {
  background: var(--card-color) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 4px !important;
  box-shadow: var(--box-shadow) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .monaco-editor-container {
    border-radius: 4px;
  }
}

/* 明暗主题适配 */
[data-theme="dark"] .monaco-editor-container {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

[data-theme="light"] .monaco-editor-container {
  border-color: rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.02);
}

/* 焦点状态 */
.monaco-editor-container:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-hover);
}

/* 禁用状态 */
.monaco-editor-container.disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>