<template>
  <n-card title="文本属性" size="small" :bordered="false">
    <n-form size="small" label-placement="left" label-width="60">
      <!-- 文本内容 -->
      <n-form-item label="内容">
        <n-input
          :value="config.content"
          type="textarea"
          :rows="3"
          placeholder="请输入文本内容"
          @update:value="updateConfig('content', $event)"
        />
      </n-form-item>

      <!-- 字体大小 -->
      <n-form-item label="字号">
        <n-input-number
          :value="config.fontSize"
          :min="8"
          :max="72"
          :step="1"
          @update:value="updateConfig('fontSize', $event)"
        />
      </n-form-item>

      <!-- 文本颜色 -->
      <n-form-item label="颜色">
        <div class="color-input-group">
          <n-color-picker
            :value="normalizeColor(config.color)"
            :show-alpha="false"
            size="small"
            @update:value="updateConfig('color', $event)"
          />
          <n-input
            :value="config.color"
            size="small"
            placeholder="CSS颜色值"
            @update:value="updateConfig('color', $event)"
          />
        </div>
      </n-form-item>

      <!-- 对齐方式 -->
      <n-form-item label="对齐">
        <n-select
          :value="config.textAlign"
          size="small"
          :options="alignOptions"
          @update:value="updateConfig('textAlign', $event)"
        />
      </n-form-item>

      <!-- 字体粗细 -->
      <n-form-item label="粗细">
        <n-select
          :value="config.fontWeight"
          size="small"
          :options="weightOptions"
          @update:value="updateConfig('fontWeight', $event)"
        />
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import type { TextWidgetConfig } from '../../types'

interface Props {
  config: TextWidgetConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [config: Partial<TextWidgetConfig>]
}>()

// 对齐选项
const alignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' }
]

// 字体粗细选项
const weightOptions = [
  { label: '正常', value: 'normal' },
  { label: '粗体', value: 'bold' }
]

// 更新配置
const updateConfig = (key: keyof TextWidgetConfig, value: any) => {
  if (value === null || value === undefined) return
  emit('update', { [key]: value })
}

// 标准化颜色值，处理CSS变量
const normalizeColor = (color: string): string => {
  // 如果是CSS变量，返回默认颜色
  if (color.startsWith('var(')) {
    return '#333333'
  }
  return color
}
</script>

<style scoped>
.color-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input-group .n-color-picker {
  flex-shrink: 0;
}

.color-input-group .n-input {
  flex: 1;
}
</style>
