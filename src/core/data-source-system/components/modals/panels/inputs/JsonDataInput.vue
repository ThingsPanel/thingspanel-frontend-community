<!--
  JSON数据输入组件
  提供JSON数据编辑、格式化、验证等功能
  从原DataSourceConfigForm拆分而来，专注于JSON数据处理
-->
<template>
  <n-space vertical :size="4">
    <!-- JSON编辑器 -->
    <div style="width: 100%">
      <MonacoEditor
        v-model:value="localValue"
        language="json"
        :options="editorOptions"
        @change="handleJsonChange"
        @validation-changed="handleValidationChanged"
      />
    </div>

    <!-- 操作按钮 -->
    <n-space :size="4" align="center">
      <n-button size="tiny" type="info" @click="formatJson">🎨 格式化</n-button>
      <n-button size="tiny" type="warning" @click="correctJson">🔧 纠错</n-button>
      <n-button size="tiny" type="success" @click="validateJson">✅ 验证</n-button>
      <n-button size="tiny" @click="clearJson">🗑️ 清空</n-button>
    </n-space>

    <!-- 状态显示 -->
    <n-space align="center" :size="4">
      <n-tag :type="validationState.type" size="small" style="font-size: 10px">
        {{ validationState.text }}
      </n-tag>
      <n-text v-if="validationState.message" depth="3" style="font-size: 10px">
        {{ validationState.message }}
      </n-text>
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
/**
 * JSON数据输入组件
 * 专门处理JSON数据的编辑、验证、格式化等功能
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NSpace, NButton, NTag, NText } from 'naive-ui'

// 导入Monaco编辑器组件
import MonacoEditor from '../../editors/MonacoEditor.vue'

// Props 定义
interface Props {
  value: string
}

// Emits 定义
interface Emits {
  (e: 'update:value', value: string): void
  (e: 'change', value: string): void
  (e: 'validation-changed', validation: { isValid: boolean; error: string }): void
}

const props = defineProps<Props>()
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

/** 验证状态 */
const validationState = ref({
  type: 'default' as const,
  text: '待验证',
  message: ''
})

/** Monaco编辑器配置 */
const editorOptions = {
  minimap: { enabled: false },
  lineNumbers: 'on',
  wordWrap: 'on',
  automaticLayout: true,
  fontSize: 11,
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: false,
  scrollBeyondLastLine: false,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8
  },
  padding: { top: 8, bottom: 8 }
}

// ========== 监听器 ==========

/** 监听值变化进行验证 */
watch(
  localValue,
  newValue => {
    if (newValue.trim()) {
      validateJsonInternal(newValue)
    } else {
      validationState.value = {
        type: 'warning',
        text: '空数据',
        message: '请输入JSON数据'
      }
      emit('validation-changed', { isValid: false, error: '数据为空' })
    }
  },
  { immediate: true }
)

// ========== 方法 ==========

/**
 * 内部JSON验证
 */
function validateJsonInternal(value: string): boolean {
  if (!value.trim()) {
    validationState.value = {
      type: 'warning',
      text: '空数据',
      message: '请输入JSON数据'
    }
    emit('validation-changed', { isValid: false, error: '数据为空' })
    return false
  }

  try {
    JSON.parse(value)
    validationState.value = {
      type: 'success',
      text: 'JSON有效',
      message: '数据格式正确'
    }
    emit('validation-changed', { isValid: true, error: '' })
    return true
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'JSON格式错误'
    validationState.value = {
      type: 'error',
      text: 'JSON无效',
      message: errorMessage
    }
    emit('validation-changed', { isValid: false, error: errorMessage })
    return false
  }
}

/**
 * 格式化JSON
 */
function formatJson(): void {
  try {
    if (!localValue.value.trim()) {
      window.$message?.warning('请先输入JSON数据')
      return
    }

    const parsed = JSON.parse(localValue.value)
    const formatted = JSON.stringify(parsed, null, 2)
    localValue.value = formatted

    validationState.value = {
      type: 'success',
      text: '已格式化',
      message: 'JSON已格式化'
    }

    console.log('🎨 [JsonDataInput] JSON已格式化')
    window.$message?.success('JSON已格式化')
  } catch (error) {
    console.error('❌ [JsonDataInput] 格式化失败:', error)
    window.$message?.error('格式化失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

/**
 * 纠错JSON - 修复常见错误
 */
function correctJson(): void {
  try {
    let corrected = localValue.value.trim()

    if (!corrected) {
      window.$message?.warning('请先输入数据')
      return
    }

    // 常见纠错处理
    const corrections = [
      // 中文标点符号纠错
      { pattern: /，/g, replacement: ',' },
      { pattern: /：/g, replacement: ':' },
      { pattern: /；/g, replacement: ';' },
      { pattern: /"/g, replacement: '"' },
      { pattern: /"/g, replacement: '"' },
      { pattern: /'/g, replacement: "'" },
      { pattern: /'/g, replacement: "'" },

      // 移除末尾逗号
      { pattern: /,(\s*[}\]])/g, replacement: '$1' },

      // 修复单引号
      { pattern: /'([^']*)':/g, replacement: '"$1":' },
      { pattern: /:\s*'([^']*)'/g, replacement: ': "$1"' },

      // 修复未引用的键
      { pattern: /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, replacement: '$1"$2":' },

      // 处理多余的空白字符
      { pattern: /\s+/g, replacement: ' ' },
      { pattern: /{\s+/g, replacement: '{ ' },
      { pattern: /\s+}/g, replacement: ' }' },
      { pattern: /\[\s+/g, replacement: '[ ' },
      { pattern: /\s+\]/g, replacement: ' ]' }
    ]

    // 应用纠错规则
    corrections.forEach(({ pattern, replacement }) => {
      corrected = corrected.replace(pattern, replacement)
    })

    // 尝试解析纠正后的JSON
    JSON.parse(corrected)

    localValue.value = corrected

    validationState.value = {
      type: 'success',
      text: '已纠错',
      message: 'JSON错误已修复'
    }

    console.log('🔧 [JsonDataInput] JSON已纠错')
    window.$message?.success('JSON错误已修复')

    // 延迟格式化
    nextTick(() => {
      formatJson()
    })
  } catch (error) {
    console.error('❌ [JsonDataInput] 纠错失败:', error)
    window.$message?.error('纠错失败：' + (error instanceof Error ? error.message : '数据格式错误太严重'))
  }
}

/**
 * 验证JSON
 */
function validateJson(): void {
  const isValid = validateJsonInternal(localValue.value)

  if (isValid) {
    window.$message?.success('JSON格式正确')
  } else {
    window.$message?.error(validationState.value.message || 'JSON格式错误')
  }
}

/**
 * 清空JSON
 */
function clearJson(): void {
  localValue.value = ''
  validationState.value = {
    type: 'default',
    text: '已清空',
    message: '请输入新的JSON数据'
  }

  console.log('🗑️ [JsonDataInput] JSON已清空')
  window.$message?.info('JSON已清空')
}

// ========== 事件处理器 ==========

/**
 * 处理JSON变化
 */
function handleJsonChange(value: string): void {
  // JSON变化已通过computed处理
}

/**
 * 处理验证状态变化
 */
function handleValidationChanged(validation: { isValid: boolean; error: string }): void {
  // Monaco编辑器的验证状态变化
  if (!validation.isValid) {
    validationState.value = {
      type: 'error',
      text: '语法错误',
      message: validation.error
    }
  }

  emit('validation-changed', validation)
}

// ========== 初始化 ==========

// 组件挂载时验证
nextTick(() => {
  if (localValue.value.trim()) {
    validateJsonInternal(localValue.value)
  }
})
</script>

<style scoped>
/* JSON输入组件样式 */
.json-input-container {
  width: 100%;
}

/* 编辑器容器 */
.editor-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--card-color);
}

/* 操作按钮样式 */
.action-buttons :deep(.n-button) {
  font-size: 10px;
  padding: 2px 8px;
  height: 24px;
}

/* 状态标签样式 */
.status-display :deep(.n-tag) {
  font-size: 10px;
  padding: 2px 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-container {
    height: 250px;
  }

  .action-buttons {
    flex-wrap: wrap;
    gap: 4px;
  }
}

/* 明暗主题适配 */
[data-theme='dark'] .editor-container {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

[data-theme='light'] .editor-container {
  border-color: rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.02);
}
</style>
