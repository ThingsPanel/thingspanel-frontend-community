<template>
  <div class="simple-test-config">
    <n-form :model="formData" label-placement="left" label-width="80" size="small" class="config-form">
      <!-- 标题配置 -->
      <n-form-item label="组件标题">
        <n-input v-model:value="formData.title" placeholder="请输入组件标题" @update:value="handleUpdate" />
      </n-form-item>

      <!-- 显示标题开关 -->
      <n-form-item label="显示标题">
        <n-switch v-model:value="formData.showTitle" @update:value="handleUpdate" />
      </n-form-item>

      <!-- 内容配置 -->
      <n-form-item label="文本内容">
        <n-input
          v-model:value="formData.content"
          type="textarea"
          :rows="3"
          placeholder="请输入显示内容"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 文字颜色 -->
      <n-form-item label="文字颜色">
        <n-color-picker v-model:value="formData.textColor" :show-alpha="true" @update:value="handleUpdate" />
      </n-form-item>

      <!-- 背景颜色 -->
      <n-form-item label="背景颜色">
        <n-color-picker v-model:value="formData.backgroundColor" :show-alpha="true" @update:value="handleUpdate" />
      </n-form-item>

      <!-- 字体大小 -->
      <n-form-item label="字体大小">
        <n-slider
          v-model:value="formData.fontSize"
          :min="12"
          :max="24"
          :step="1"
          :format-tooltip="value => `${value}px`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 内边距 -->
      <n-form-item label="内边距">
        <n-slider
          v-model:value="formData.padding"
          :min="0"
          :max="32"
          :step="2"
          :format-tooltip="value => `${value}px`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 圆角 -->
      <n-form-item label="圆角大小">
        <n-slider
          v-model:value="formData.borderRadius"
          :min="0"
          :max="20"
          :step="1"
          :format-tooltip="value => `${value}px`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 按钮配置区域 -->
      <n-divider title-placement="left">按钮配置</n-divider>

      <!-- 显示按钮开关 -->
      <n-form-item label="显示按钮">
        <n-switch v-model:value="formData.showButton" @update:value="handleUpdate" />
      </n-form-item>

      <template v-if="formData.showButton">
        <!-- 按钮文字 -->
        <n-form-item label="按钮文字">
          <n-input v-model:value="formData.buttonText" placeholder="请输入按钮文字" @update:value="handleUpdate" />
        </n-form-item>

        <!-- 按钮类型 -->
        <n-form-item label="按钮类型">
          <n-select v-model:value="formData.buttonType" :options="buttonTypeOptions" @update:value="handleUpdate" />
        </n-form-item>
      </template>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * SimpleTestComponent配置表单
 * 专门为simple-test-component组件提供配置界面
 */

import { reactive, watch, onMounted, nextTick, shallowReactive } from 'vue'

interface Props {
  widget?: any
  config?: any
  readonly?: boolean
}

interface Emits {
  (e: 'update', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 防止循环更新的标记
let isUpdating = false

/**
 * 表单数据结构 - 使用shallowReactive优化性能
 */
const formData = shallowReactive({
  title: '简单测试组件',
  showTitle: true,
  content: '这是一个简单的测试组件',
  backgroundColor: '#f0f8ff',
  textColor: '#333333',
  showButton: true,
  buttonText: '测试按钮',
  buttonType: 'primary',
  fontSize: 14,
  padding: 16,
  borderRadius: 8
})

/**
 * 按钮类型选项
 */
const buttonTypeOptions = [
  { label: '主要按钮', value: 'primary' },
  { label: '默认按钮', value: 'default' },
  { label: '信息按钮', value: 'info' },
  { label: '成功按钮', value: 'success' },
  { label: '警告按钮', value: 'warning' },
  { label: '错误按钮', value: 'error' }
]

/**
 * 处理配置更新 - 性能优化：防抖 + 防循环
 */
let updateTimer: number | null = null
const handleUpdate = () => {
  // 防止循环更新
  if (isUpdating) return

  if (updateTimer) {
    clearTimeout(updateTimer)
  }

  updateTimer = window.setTimeout(() => {
    const config = {
      title: formData.title,
      showTitle: formData.showTitle,
      content: formData.content,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      showButton: formData.showButton,
      buttonText: formData.buttonText,
      buttonType: formData.buttonType,
      fontSize: formData.fontSize,
      padding: formData.padding,
      borderRadius: formData.borderRadius
    }

    emit('update', config)
    updateTimer = null
  }, 300) // 增加到300ms防抖
}

/**
 * 从props中初始化表单数据 - 性能优化：防止循环 + 智能diff
 */
const initializeFromProps = async () => {
  if (!props.config || isUpdating) return

  // 设置更新标记，防止循环
  isUpdating = true

  try {
    // 准备新的配置数据
    const newConfig = {
      title: props.config.title || '简单测试组件',
      showTitle: props.config.showTitle ?? true,
      content: props.config.content || '这是一个简单的测试组件',
      backgroundColor: props.config.backgroundColor || '#f0f8ff',
      textColor: props.config.textColor || '#333333',
      showButton: props.config.showButton ?? true,
      buttonText: props.config.buttonText || '测试按钮',
      buttonType: props.config.buttonType || 'primary',
      fontSize: props.config.fontSize || 14,
      padding: props.config.padding || 16,
      borderRadius: props.config.borderRadius || 8
    }

    // 智能diff：只更新变化的字段
    Object.keys(newConfig).forEach(key => {
      if (formData[key] !== newConfig[key]) {
        formData[key] = newConfig[key]
      }
    })

    // 等待DOM更新完成
    await nextTick()
  } finally {
    // 延迟重置标记，确保更新完成
    setTimeout(() => {
      isUpdating = false
    }, 50)
  }
}

/**
 * 监听props变化 - 优化：减少不必要的深度监听
 */
watch(
  () => props.config,
  newConfig => {
    if (newConfig && !isUpdating) {
      initializeFromProps()
    }
  },
  { immediate: true } // 移除深度监听，提高性能
)

// 组件挂载时确保初始化
onMounted(() => {
  // 只在没有通过watch初始化时才手动初始化
  if (!isUpdating && props.config) {
    initializeFromProps()
  }
})

// 清理资源
onMounted(() => {
  return () => {
    if (updateTimer) {
      clearTimeout(updateTimer)
    }
    isUpdating = false
  }
})

// 移除调试日志，提高性能
</script>

<style scoped>
.simple-test-config {
  padding: 12px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 表单样式优化 - 让表单撑满容器 */
.config-form {
  flex: 1;
  min-height: 0; /* 关键：允许flex子项缩小 */
}

/* 表单项样式优化 */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
}

/* 输入控件样式 */
:deep(.n-input),
:deep(.n-input-number),
:deep(.n-select) {
  width: 100%;
}

/* 滑块样式 */
:deep(.n-slider) {
  margin: 8px 0;
}

/* 分割线样式 */
:deep(.n-divider) {
  margin: 16px 0 12px 0;
}

:deep(.n-divider__title) {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

/* 滚动条样式 */
.simple-test-config::-webkit-scrollbar {
  width: 4px;
}

.simple-test-config::-webkit-scrollbar-track {
  background: transparent;
}

.simple-test-config::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.simple-test-config::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}
</style>
