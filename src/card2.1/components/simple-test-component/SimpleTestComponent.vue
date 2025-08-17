<template>
  <div class="simple-test-component" :style="componentStyles">
    <div v-if="config.showTitle" class="component-title">
      {{ config.title || '简单测试组件' }}
    </div>
    <div class="component-content">
      <p>{{ config.content || '这是一个简单的测试组件' }}</p>
      <button v-if="config.showButton" :class="`btn-${config.buttonType || 'primary'}`" class="test-button">
        {{ config.buttonText || '测试按钮' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  config?: {
    title?: string
    showTitle?: boolean
    content?: string
    backgroundColor?: string
    textColor?: string
    showButton?: boolean
    buttonText?: string
    buttonType?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
    fontSize?: number
    padding?: number
    borderRadius?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
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
})

// 计算组件样式
const componentStyles = computed(() => ({
  backgroundColor: props.config.backgroundColor || '#f0f8ff',
  color: props.config.textColor || '#333333',
  fontSize: `${props.config.fontSize || 14}px`,
  padding: `${props.config.padding || 16}px`,
  borderRadius: `${props.config.borderRadius || 8}px`
}))

// 移除调试日志，提高性能
</script>

<style scoped>
.simple-test-component {
  border: 2px solid #007bff;
  background: #f0f8ff;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.component-title {
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.component-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  max-width: 120px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.test-button:hover {
  opacity: 0.8;
}
</style>
