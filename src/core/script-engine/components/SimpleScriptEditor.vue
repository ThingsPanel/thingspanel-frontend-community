<!--
简洁的脚本编辑器 - 专注于实用性，摒弃复杂功能
只保留基本的编辑和模板选择功能
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import type { SelectOption } from 'naive-ui'
// Monaco Editor
import MonacoEditor from 'monaco-editor-vue3'

interface Props {
  /** 脚本内容 */
  modelValue?: string
  /** 编辑器占位符 */
  placeholder?: string
  /** 是否显示模板选择 */
  showTemplates?: boolean
  /** 模板类别过滤 */
  templateCategory?: string
  /** 编辑器高度 */
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入JavaScript脚本...',
  showTemplates: true,
  height: '200px'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 主题系统集成
const themeStore = useThemeStore()
const editorRef = ref<any>(null)

// 简单的内置模板
const templates: Record<string, SelectOption[]> = {
  'data-generation': [
    {
      label: '生成随机数据',
      value: 'return { value: Math.floor(Math.random() * 100), timestamp: Date.now() }'
    },
    {
      label: '生成时间序列',
      value: 'return Array.from({length: 10}, (_, i) => ({ time: Date.now() + i * 1000, value: Math.random() * 100 }))'
    }
  ],
  'data-processing': [
    {
      label: '数据过滤',
      value: 'return data.filter(item => item.value > 50)'
    },
    {
      label: '数据转换',
      value: 'return data.map(item => ({ ...item, value: item.value * 2 }))'
    }
  ],
  'data-merger': [
    {
      label: '合并为对象',
      value: 'return items.reduce((acc, item, index) => ({ ...acc, [`data_${index}`]: item }), {})'
    },
    {
      label: '合并为数组',
      value: 'return items.flat()'
    }
  ]
}

// 获取当前类别的模板选项
const templateOptions = computed(() => {
  if (props.templateCategory && templates[props.templateCategory]) {
    return templates[props.templateCategory]
  }
  // 如果没有指定类别，返回所有模板
  return Object.values(templates).flat()
})

// 脚本内容的双向绑定
const scriptContent = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

// Monaco Editor 配置
const editorOptions = computed(() => ({
  language: 'javascript',
  theme: themeStore.darkMode ? 'vs-dark' : 'vs',
  fontSize: 13,
  lineHeight: 20,
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'on',
  glyphMargin: false,
  folding: true,
  lineDecorationsWidth: 10,
  lineNumbersMinChars: 3,
  renderLineHighlight: 'line',
  contextmenu: true,
  selectOnLineNumbers: true,
  roundedSelection: false,
  readOnly: false,
  cursorStyle: 'line',
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  quickSuggestions: true,
  snippetSuggestions: 'inline'
}))

/**
 * 应用选中的模板到编辑器
 */
const applyTemplate = (templateCode: string) => {
  if (templateCode) {
    scriptContent.value = templateCode
    // 焦点到编辑器并选中所有内容
    nextTick(() => {
      if (editorRef.value?.editor) {
        editorRef.value.editor.focus()
        editorRef.value.editor.setSelection(editorRef.value.editor.getModel().getFullModelRange())
      }
    })
  }
}

/**
 * 处理编辑器内容变化
 */
const handleEditorChange = (value: string) => {
  emit('update:modelValue', value)
}

/**
 * 监听主题变化，更新编辑器主题
 */
watch(
  () => themeStore.darkMode,
  () => {
    if (editorRef.value?.editor) {
      const newTheme = themeStore.darkMode ? 'vs-dark' : 'vs'
      editorRef.value.editor.updateOptions({ theme: newTheme })
    }
  }
)
</script>

<template>
  <div class="simple-script-editor">
    <!-- Monaco Editor 容器 -->
    <div class="monaco-editor-container">
      <!-- 模板选择器 - 集成在编辑器上方 -->
      <div v-if="showTemplates && templateOptions.length > 0" class="editor-toolbar">
        <div class="toolbar-left">
          <span class="toolbar-label">模板:</span>
          <n-select
            :options="templateOptions"
            placeholder="选择代码模板..."
            size="small"
            class="template-select"
            clearable
            @update:value="applyTemplate"
          />
        </div>
        <div class="toolbar-right">
          <n-tag size="tiny" type="info" class="js-tag">JavaScript</n-tag>
        </div>
      </div>

      <!-- Monaco Editor -->
      <div class="editor-wrapper" :style="{ height: props.height }">
        <MonacoEditor
          ref="editorRef"
          :model-value="scriptContent"
          :options="editorOptions"
          @update:model-value="handleEditorChange"
        />
      </div>

      <!-- 底部提示 -->
      <div class="editor-footer">
        <n-text depth="3" class="footer-hint">💡 支持 JavaScript 语法高亮、自动补全和错误检测</n-text>
      </div>
    </div>
  </div>
</template>

<style scoped>
.simple-script-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Monaco Editor 容器 */
.monaco-editor-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--card-color);
  transition: border-color 0.2s ease;
}

.monaco-editor-container:hover {
  border-color: var(--primary-color-hover);
}

/* 编辑器工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--body-color);
  border-bottom: 1px solid var(--border-color);
  min-height: 40px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.toolbar-label {
  font-size: 12px;
  color: var(--text-color-2);
  font-weight: 500;
  white-space: nowrap;
}

.template-select {
  min-width: 200px;
  max-width: 300px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.js-tag {
  font-weight: 500;
  border: none;
  background: var(--info-color-suppl);
  color: var(--info-color);
}

/* Monaco Editor 包装器 */
.editor-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
}

/* 编辑器底部 */
.editor-footer {
  padding: 6px 12px;
  background: var(--body-color);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-hint {
  font-size: 11px;
  color: var(--text-color-3);
  text-align: center;
}

/* 模板选择器样式优化 */
.template-select :deep(.n-base-selection) {
  border: 1px solid var(--border-color);
  background: var(--card-color);
  transition: all 0.2s ease;
  font-size: 12px;
}

.template-select :deep(.n-base-selection:hover) {
  border-color: var(--primary-color-hover);
  background: var(--primary-color-suppl);
}

.template-select :deep(.n-base-selection-placeholder) {
  color: var(--text-color-3);
  font-size: 12px;
}

.template-select :deep(.n-base-selection-tags) {
  padding: 4px 8px;
}

/* Monaco Editor 主题适配 */
.editor-wrapper :deep(.monaco-editor) {
  background: transparent !important;
}

.editor-wrapper :deep(.monaco-editor .margin) {
  background: var(--body-color) !important;
}

.editor-wrapper :deep(.monaco-editor .monaco-editor-background) {
  background: var(--card-color) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    padding: 8px;
  }

  .toolbar-left {
    justify-content: space-between;
  }

  .template-select {
    min-width: auto;
    max-width: none;
    flex: 1;
  }

  .toolbar-right {
    justify-content: center;
  }
}
</style>
