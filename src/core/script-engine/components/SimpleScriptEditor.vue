<!--
专业级脚本编辑器组件 - 基于 CodeMirror 6 重构
提供完整的代码编辑功能和优秀的用户体验
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { useI18n } from 'vue-i18n'

// 导入 CodeMirror 6 Vue 组件
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'

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

// 国际化集成
const { t } = useI18n()

// 主题系统集成
const themeStore = useThemeStore()

// 代码示例 - 使用硬编码文本避免国际化循环依赖
const codeExamples = {
  'data-generation': [
    {
      name: '生成随机数据',
      code: `return {
  value: Math.floor(Math.random() * 100),
  timestamp: Date.now(),
  id: Math.random().toString(36).substr(2, 9)
}`
    },
    {
      name: '生成时间序列',
      code: `return Array.from({ length: 10 }, (_, i) => ({
  time: Date.now() + i * 1000,
  value: Math.random() * 100
}))`
    }
  ],
  'data-processing': [
    {
      name: '数据过滤',
      code: `return data.filter(item => item.value > 50)`
    },
    {
      name: '数据转换',
      code: `return data.map(item => ({
  ...item,
  value: item.value * 2,
  processed: true
}))`
    }
  ],
  'data-merger': [
    {
      name: '合并为对象',
      code: `return items.reduce((acc, item, index) => {
  acc[\`data_\${index}\`] = item
  return acc
}, {})`
    },
    {
      name: '合并为数组',
      code: `return items.flat()`
    }
  ]
}

// 获取当前类别的示例
const availableExamples = computed(() => {
  if (props.templateCategory && codeExamples[props.templateCategory]) {
    return codeExamples[props.templateCategory]
  }
  return Object.values(codeExamples).flat()
})

// 示例选择器选项
const exampleOptions = computed(() =>
  availableExamples.value.map((example, index) => ({
    label: example.name,
    value: example.code
  }))
)

/**
 * 应用选中的模板
 */
const applyTemplate = (templateCode: string) => {
  if (templateCode) {
    emit('update:modelValue', templateCode)
  }
}

// CodeMirror 6 配置
const editorValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})
</script>

<template>
  <div class="simple-script-editor">
    <!-- 模板选择器 -->
    <div v-if="showTemplates && exampleOptions.length > 0" class="template-selector">
     
        <div> 模板：</div>
      <n-select
        :options="exampleOptions"
        :placeholder="t('script.selectTemplate')"
        size="small"
        style="width: 240px"
        clearable
        @update:value="applyTemplate"
      />
    </div>

    <!-- CodeMirror 6 编辑器 -->
    <div class="editor-container">
      <CodeMirror
        v-model="editorValue"
        basic
        :dark="themeStore.darkMode"
        :lang="javascript()"
        :placeholder="props.placeholder"
        :style="{ height: props.height }"
      />
    </div>

  </div>
</template>

<style scoped>
.simple-script-editor {
  width: 100%;
  display: flex;
  flex-direction: column;

  gap: 8px;
}

.template-selector {
  display: flex;
  align-items: center;
}

.editor-container {
  flex: 1;
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  overflow: hidden;
  transition: all 0.3s var(--n-bezier);
}

.editor-container:focus-within {
  border-color: var(--n-color-primary);
  box-shadow: 0 0 0 2px var(--n-color-primary-hover-opacity);
}

.editor-hint {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  text-align: center;
}

/* CodeMirror 6 样式定制 */
.simple-script-editor :deep(.cm-editor) {
  border: none;
  border-radius: var(--n-border-radius);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  background: transparent;
  height: 100%;
}

.simple-script-editor :deep(.cm-focused) {
  outline: none;
}

.simple-script-editor :deep(.cm-content) {
  min-height: v-bind(height);
  line-height: 1.6;
  caret-color: var(--n-color-primary);
  padding: 12px;
}

.simple-script-editor :deep(.cm-gutters) {
  background: var(--n-color-base);
  border-right: 1px solid var(--n-border-color);
  color: var(--n-text-color-disabled);
}

.simple-script-editor :deep(.cm-lineNumbers .cm-gutterElement) {
  color: var(--n-text-color-disabled);
  padding: 0 8px;
  font-size: 12px;
}

.simple-script-editor :deep(.cm-selectionBackground) {
  background: rgba(24, 160, 88, 0.2) !important;
}

.simple-script-editor :deep(.cm-activeLine) {
  background: var(--n-color-hover);
}

.simple-script-editor :deep(.cm-activeLineGutter) {
  background: var(--n-color-hover);
}

/* 滚动条样式 */
.simple-script-editor :deep(.cm-scroller::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.simple-script-editor :deep(.cm-scroller::-webkit-scrollbar-track) {
  background: var(--n-color-base);
}

.simple-script-editor :deep(.cm-scroller::-webkit-scrollbar-thumb) {
  background: var(--n-scrollbar-color);
  border-radius: 3px;
}

.simple-script-editor :deep(.cm-scroller::-webkit-scrollbar-thumb:hover) {
  background: var(--n-scrollbar-color-hover);
}

/* 占位符样式 */
.simple-script-editor :deep(.cm-placeholder) {
  color: var(--n-text-color-disabled);
  font-style: italic;
}

/* 语法高亮定制 */
.simple-script-editor :deep(.cm-editor.cm-focused .cm-selectionBackground) {
  background: rgba(24, 160, 88, 0.2) !important;
}

/* 响应主题变化 */
[data-theme='dark'] .simple-script-editor .editor-container {
  box-shadow: var(--n-box-shadow-1);
}

[data-theme='light'] .simple-script-editor .editor-container {
  background: var(--n-card-color);
}
</style>