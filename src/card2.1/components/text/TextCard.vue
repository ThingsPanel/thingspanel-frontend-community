<!--
  最简单的文本组件
  专注于核心功能，不过度设计
-->

<script setup lang="ts">
import { inject, computed } from 'vue'
import type { ConfigContext } from '../../core/types'

// 注入配置上下文
const ctx = inject<ConfigContext>('config-ctx')

// 安全的配置访问
const config = computed(() => ctx?.config || {})

// 计算样式
const textStyle = computed(() => ({
  fontSize: config.value.fontSize ? `${config.value.fontSize}px` : '16px',
  color: config.value.color || '#333',
  textAlign: config.value.textAlign || 'left',
  fontWeight: config.value.fontWeight || 'normal',
  lineHeight: config.value.lineHeight || '1.5'
}))
</script>

<template>
  <div class="text-card" :style="textStyle">
    {{ config.content || '请输入文本内容...' }}
  </div>
</template>

<style scoped>
.text-card {
  width: 100%;
  height: 100%;
  padding: 12px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}
</style>