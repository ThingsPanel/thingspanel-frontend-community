<template>
  <div class="test-card">
    <div class="test-card-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="test-card-content">
      <p>这是一个测试卡片组件</p>
      <p>数据: {{ dataString }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 测试卡片组件
 * 用于验证系统基本功能
 */

import { computed } from 'vue'

interface Props {
  title?: string
  data?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  title: '测试卡片',
  data: () => ({})
})

const dataString = computed(() => JSON.stringify(props.data))
</script>

<style scoped>
.test-card {
  width: 100%;
  height: 100%;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-card-header {
  margin-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.test-card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.test-card-content {
  font-size: 14px;
  color: #666;
}

.test-card-content p {
  margin: 4px 0;
}
</style>