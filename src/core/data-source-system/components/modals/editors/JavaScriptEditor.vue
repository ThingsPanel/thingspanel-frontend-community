<!--
  JavaScript编辑器组件
  提供JavaScript代码编辑、语法高亮、错误检查等功能
  专门用于数据处理脚本的编写和调试
-->
<template>
  <div class="javascript-editor">
    <MonacoEditor
      v-model:value="localValue"
      language="javascript"
      :height="height"
      :options="editorOptions"
      @change="handleCodeChange"
      @validation-changed="handleValidationChanged"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * JavaScript编辑器组件
 * 基于Monaco Editor，专门用于编写数据处理脚本
 */

import { computed, watch } from 'vue'

// 导入Monaco编辑器组件
import MonacoEditor from './MonacoEditor.vue'

// Props 定义
interface Props {
  value: string
  height?: number | string
  readonly?: boolean
}

// Emits 定义
interface Emits {
  (e: 'update:value', value: string): void
  (e: 'change', value: string): void
  (e: 'validation-changed', validation: { isValid: boolean; error: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  readonly: false
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

/** Monaco编辑器配置 */
const editorOptions = computed(() => ({
  // 基本配置
  minimap: { enabled: false },
  lineNumbers: 'on',
  wordWrap: 'on',
  automaticLayout: true,
  fontSize: 11,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  
  // 缩进配置
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: false,
  
  // 滚动配置
  scrollBeyondLastLine: false,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8
  },
  
  // 界面配置
  padding: { top: 12, bottom: 12 },
  lineHeight: 18,
  
  // 编辑功能
  readOnly: props.readonly,
  selectOnLineNumbers: true,
  roundedSelection: false,
  cursorStyle: 'line',
  cursorWidth: 2,
  
  // 代码提示和自动完成
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: 'on',
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false
  },
  
  // 代码折叠
  folding: true,
  foldingStrategy: 'indentation',
  showFoldingControls: 'mouseover',
  
  // 匹配括号
  matchBrackets: 'always',
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'languageDefined',
  
  // 语法检查
  validate: true,
  
  // 格式化
  formatOnPaste: true,
  formatOnType: true,
  
  // 主题适配
  theme: 'vs-light', // 会根据系统主题自动切换
  
  // JavaScript特定配置
  suggest: {
    showWords: false,
    showKeywords: true,
    showSnippets: true,
    showFunctions: true,
    showConstructors: true,
    showFields: true,
    showVariables: true,
    showClasses: true,
    showModules: true,
    showProperties: true,
    showEvents: true,
    showOperators: true,
    showUnits: false,
    showValues: true,
    showConstants: true,
    showEnums: true,
    showEnumMembers: true,
    showColors: false,
    showFiles: false,
    showReferences: true,
    showFolders: false,
    showTypeParameters: true,
    showUsers: false,
    showIssues: false
  }
}))

// ========== 监听器 ==========

/** 监听值变化进行JavaScript语法验证 */
watch(
  localValue,
  (newValue) => {
    if (newValue.trim()) {
      validateJavaScript(newValue)
    } else {
      emit('validation-changed', { isValid: true, error: '' })
    }
  },
  { immediate: true }
)

// ========== 方法 ==========

/**
 * 验证JavaScript代码语法
 */
function validateJavaScript(code: string): void {
  try {
    // 基本语法检查 - 尝试用Function构造器验证
    // 包装代码以支持return语句
    const wrappedCode = `
      (function(data) {
        ${code}
      })
    `
    
    // 尝试创建函数来检查语法
    new Function('return ' + wrappedCode)
    
    // 语法正确
    emit('validation-changed', { isValid: true, error: '' })
    
  } catch (error) {
    // 语法错误
    const errorMessage = error instanceof Error ? error.message : 'JavaScript语法错误'
    emit('validation-changed', { isValid: false, error: errorMessage })
  }
}

// ========== 事件处理器 ==========

/**
 * 处理代码变化
 */
function handleCodeChange(code: string): void {
  // 代码变化已通过computed处理
  console.log('🔧 [JavaScriptEditor] 代码已更新，长度:', code.length)
}

/**
 * 处理Monaco编辑器验证状态变化
 */
function handleValidationChanged(validation: { isValid: boolean; error: string }): void {
  // Monaco编辑器的内置验证
  if (!validation.isValid) {
    emit('validation-changed', validation)
  }
}
</script>

<style scoped>
/* JavaScript编辑器样式 */
.javascript-editor {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--card-color);
  position: relative;
}

/* 编辑器容器 */
.javascript-editor :deep(.monaco-editor) {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

/* 行号样式 */
.javascript-editor :deep(.line-numbers) {
  color: var(--text-color-3);
}

/* 光标样式 */
.javascript-editor :deep(.cursor) {
  background: var(--primary-color);
}

/* 选中文本样式 */
.javascript-editor :deep(.selected-text) {
  background: var(--primary-color-pressed);
}

/* 错误提示样式 */
.javascript-editor :deep(.squiggly-error) {
  border-bottom: 2px wavy var(--error-color);
}

.javascript-editor :deep(.squiggly-warning) {
  border-bottom: 2px wavy var(--warning-color);
}

/* 代码提示样式 */
.javascript-editor :deep(.suggest-widget) {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--box-shadow);
}

/* 自动完成样式 */
.javascript-editor :deep(.monaco-list-row) {
  color: var(--text-color);
}

.javascript-editor :deep(.monaco-list-row:hover) {
  background: var(--hover-color);
}

.javascript-editor :deep(.monaco-list-row.focused) {
  background: var(--primary-color-hover);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .javascript-editor {
    font-size: 12px;
  }
  
  .javascript-editor :deep(.monaco-editor) {
    font-size: 12px;
  }
}

/* 明暗主题适配 */
[data-theme="dark"] .javascript-editor {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .javascript-editor :deep(.monaco-editor) {
  /* Monaco 会自动处理暗色主题 */
}

[data-theme="light"] .javascript-editor {
  border-color: rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.02);
}

/* 焦点状态 */
.javascript-editor:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-hover);
}

/* 只读状态 */
.javascript-editor.readonly {
  background: var(--disabled-color);
  opacity: 0.8;
}

.javascript-editor.readonly :deep(.monaco-editor) {
  background: transparent;
}
</style>