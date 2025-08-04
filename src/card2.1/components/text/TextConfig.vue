<!--
  文本组件配置界面
  简洁实用的配置选项
-->

<script setup lang="ts">
import { inject } from 'vue'
import type { ConfigContext } from '../../core/types'
import { $t } from '@/locales'

// 注入配置上下文
const ctx = inject<ConfigContext>('config-ctx')!

// 文本对齐选项
const alignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' }
]

// 字重选项
const weightOptions = [
  { label: '正常', value: 'normal' },
  { label: '加粗', value: 'bold' },
  { label: '细体', value: '300' },
  { label: '中等', value: '500' }
]
</script>

<template>
  <div class="text-config">
    <n-form label-placement="left">
      <!-- 文本内容 -->
      <n-form-item label="文本内容">
        <n-input
          v-model:value="ctx.config.content"
          type="textarea"
          placeholder="请输入文本内容..."
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
      </n-form-item>

      <!-- 字体大小 -->
      <n-form-item label="字体大小">
        <n-input-number
          v-model:value="ctx.config.fontSize"
          :min="12"
          :max="48"
          placeholder="16"
        />
      </n-form-item>

      <!-- 文本颜色 -->
      <n-form-item label="文本颜色">
        <n-color-picker v-model:value="ctx.config.color" :show-alpha="false" />
      </n-form-item>

      <!-- 文本对齐 -->
      <n-form-item label="文本对齐">
        <n-select
          v-model:value="ctx.config.textAlign"
          :options="alignOptions"
          placeholder="选择对齐方式"
        />
      </n-form-item>

      <!-- 字体粗细 -->
      <n-form-item label="字体粗细">
        <n-select
          v-model:value="ctx.config.fontWeight"
          :options="weightOptions"
          placeholder="选择字体粗细"
        />
      </n-form-item>

      <!-- 行高 -->
      <n-form-item label="行高">
        <n-input-number
          v-model:value="ctx.config.lineHeight"
          :min="1"
          :max="3"
          :step="0.1"
          placeholder="1.5"
        />
      </n-form-item>
    </n-form>

    <!-- 实时预览 -->
    <div class="preview-section">
      <n-divider>实时预览</n-divider>
      <div 
        class="preview-text" 
        :style="{
          fontSize: ctx.config.fontSize ? `${ctx.config.fontSize}px` : '16px',
          color: ctx.config.color || '#333',
          textAlign: ctx.config.textAlign || 'left',
          fontWeight: ctx.config.fontWeight || 'normal',
          lineHeight: ctx.config.lineHeight || '1.5'
        }"
      >
        {{ ctx.config.content || '请输入文本内容...' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-config {
  width: 100%;
}

.text-config :deep(.n-form-item) {
  margin-bottom: 16px;
}

.preview-section {
  margin-top: 24px;
}

.preview-text {
  padding: 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  background-color: var(--n-color-body);
  min-height: 80px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>