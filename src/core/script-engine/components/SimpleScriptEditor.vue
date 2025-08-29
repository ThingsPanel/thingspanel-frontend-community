<!--
简洁的脚本编辑器 - 专注于实用性，摒弃复杂功能
只保留基本的编辑和模板选择功能
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { SelectOption } from 'naive-ui'

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

/**
 * 应用选中的模板到编辑器
 */
const applyTemplate = (templateCode: string) => {
  scriptContent.value = templateCode
}
</script>

<template>
  <div class="simple-script-editor">
    <!-- 模板选择（可选） -->
    <div v-if="showTemplates && templateOptions.length > 0" class="template-selector mb-2">
      <n-select
        :options="templateOptions"
        placeholder="选择模板快速插入..."
        clearable
        @update:value="applyTemplate"
      />
    </div>
    
    <!-- 脚本编辑器 -->
    <n-input
      v-model:value="scriptContent"
      type="textarea"
      :placeholder="placeholder"
      :autosize="{ minRows: 6, maxRows: 20 }"
      :style="{ height: props.height }"
      show-count
    />
    
    <!-- 简单提示 -->
    <div class="editor-hint mt-1">
      <n-text depth="3" class="text-xs">
        提示: 使用 return 语句返回结果，可访问上下文变量
      </n-text>
    </div>
  </div>
</template>

<style scoped>
.simple-script-editor {
  width: 100%;
}

.template-selector {
  max-width: 300px;
}

.editor-hint {
  font-size: 12px;
}
</style>