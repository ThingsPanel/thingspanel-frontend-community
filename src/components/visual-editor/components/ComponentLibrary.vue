<template>
  <div class="component-library">
    <n-card title="组件库" size="small" :bordered="false">
      <n-space vertical size="small">
        <div 
          v-for="widget in availableWidgets" 
          :key="widget.type"
          class="widget-item"
          @click="handleAddWidget(widget.type)"
        >
          <n-button 
            block 
            size="small"
            type="tertiary"
            :focusable="false"
          >
            <template #icon>
              <n-icon>
                <div :class="widget.icon || 'i-mdi-widgets'" />
              </n-icon>
            </template>
            {{ widget.name }}
          </n-button>
        </div>
      </n-space>
    </n-card>
    
    <!-- 使用提示 -->
    <n-card title="使用说明" size="small" :bordered="false" class="mt-4">
      <n-text depth="3" :style="{ fontSize: '12px' }">
        点击组件添加到画布
      </n-text>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { getAvailableWidgets } from '../widgets'
import type { WidgetType } from '../types'

// 获取所有可用组件
const availableWidgets = getAvailableWidgets()

// 定义事件
const emit = defineEmits<{
  'add-widget': [type: WidgetType]
}>()

// 处理添加组件
const handleAddWidget = (type: WidgetType) => {
  emit('add-widget', type)
}
</script>

<style scoped>
.component-library {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.widget-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.widget-item:hover {
  transform: translateY(-1px);
}

/* 确保按钮样式一致 */
:deep(.n-button) {
  justify-content: flex-start;
  padding: 8px 12px;
}

:deep(.n-button__icon) {
  margin-right: 6px;
}

/* 自定义滚动条 */
.component-library::-webkit-scrollbar {
  width: 4px;
}

.component-library::-webkit-scrollbar-track {
  background: transparent;
}

.component-library::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.component-library::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>