<!--
轻量级脚本编辑器 - 使用CodeMirror提供良好的代码编辑体验
参考data-handle.vue的成功实现，性能优秀且功能完整
-->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import Codemirror from 'codemirror-editor-vue3'
import 'codemirror/mode/javascript/javascript.js'

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
const cmRef = ref()

// CodeMirror 配置
const cmOptions = {
  mode: 'text/javascript',
  indentUnit: 2,
  lineWrapping: true,
  lineNumbers: true,
  theme: 'default'
}

// 代码示例
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
    // 等待DOM更新后聚焦
    nextTick(() => {
      if (cmRef.value) {
        const cm = cmRef.value.getCodeMirror?.()
        if (cm) {
          const lastLine = cm.lineCount() - 1
          const lastCh = cm.getLine(lastLine).length
          cm.focus()
          cm.setCursor({ line: lastLine, ch: lastCh })
        }
      }
    })
  }
}

/**
 * CodeMirror 内容变化事件
 */
const onChange = (val: string, cm: any) => {
  emit('update:modelValue', val)
}

/**
 * CodeMirror 就绪事件
 */
const onReady = (cm: any) => {
  // 设置焦点到编辑器末尾
  const lastLine = cm.lineCount() - 1
  const lastCh = cm.getLine(lastLine).length
  cm.focus()
  cm.setCursor({ line: lastLine, ch: lastCh })
}
</script>

<template>
  <div class="simple-script-editor">
    <!-- 模板选择器 -->
    <div v-if="showTemplates && exampleOptions.length > 0" class="template-selector">
      <n-select 
        :options="exampleOptions" 
        placeholder="选择代码模板..." 
        size="small"
        style="width: 240px"
        clearable 
        @update:value="applyTemplate" 
      />
    </div>

    <!-- CodeMirror编辑器 -->
    <Codemirror
      ref="cmRef"
      v-model:value="props.modelValue"
      :options="cmOptions"
      :height="props.height"
      border
      @change="onChange"
      @ready="onReady"
    />

    <!-- 简单提示 -->
    <div class="editor-hint">
      <n-text depth="3">💡 JavaScript 代码编辑器</n-text>
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

.code-textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-textarea :deep(textarea) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
}

.editor-hint {
  font-size: 12px;
  color: var(--text-color-3);
  text-align: center;
}
</style>