<template>
  <div class="final-processing-preview">
    <n-space align="center" justify="space-between" style="margin-bottom: 4px">
      <n-text depth="2" style="font-size: 12px">最终数据预览:</n-text>
      <!-- 状态指示 -->
      <n-space :size="4" align="center">
        <!-- 加载状态 -->
        <n-spin v-if="finalProcessingStatus?.loading" size="small" show style="width: 14px; height: 14px" />
        <!-- 成功状态 -->
        <n-text
          v-else-if="!finalProcessingStatus?.error && finalProcessingStatus?.lastUpdateTime"
          depth="3"
          style="font-size: 10px; color: var(--success-color)"
        >
          ✅ {{ new Date(finalProcessingStatus.lastUpdateTime).toLocaleTimeString() }}
        </n-text>
        <!-- 错误状态 -->
        <n-text v-else-if="finalProcessingStatus?.error" depth="3" style="font-size: 10px; color: var(--error-color)">
          ❌ 处理失败
        </n-text>
        <!-- 数据项计数 -->
        <n-text depth="3" style="font-size: 10px">
          ({{ processingPreviewStatus?.dataCount || dataValue?.rawDataList?.length || 0 }} 项)
        </n-text>
      </n-space>
    </n-space>

    <!-- 预览内容 -->
    <n-card
      size="small"
      :bordered="false"
      style="max-height: 120px; overflow: auto"
      :style="{
        background: finalProcessingStatus?.error ? 'var(--error-color-pressed)' : 'var(--code-color)'
      }"
    >
      <!-- 错误信息 -->
      <div v-if="finalProcessingStatus?.error" style="color: var(--error-color); font-size: 11px; line-height: 1.3">
        <strong>处理错误:</strong>
        <br />
        {{ finalProcessingStatus.error }}
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { NSpace, NText, NSpin, NCard } from 'naive-ui'

defineProps({
  finalProcessingStatus: {
    type: Object,
    default: () => ({})
  },
  processingPreviewStatus: {
    type: Object,
    default: () => ({})
  },
  dataValue: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.final-processing-preview {
  /* 样式可以根据需要添加 */
}
</style>
