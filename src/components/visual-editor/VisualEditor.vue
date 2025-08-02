<template>
  <div class="visual-editor">
    <PanelLayout 
      mode="edit" 
      :left-width="280" 
      :right-width="320"
      :left-collapsed="false"
      :right-collapsed="false"
    >
      <template #left>
        <ComponentLibrary @add-widget="handleAddWidget" />
      </template>
      <template #main>
        <EditorCanvas />
      </template>
      <template #right>
        <PropertyPanel />
      </template>
    </PanelLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import PanelLayout from './components/PanelLayout.vue'
import { useCanvasStore } from '@/components/panelv2/store/canvasStore'
import ComponentLibrary from './components/ComponentLibrary.vue'
import EditorCanvas from './components/EditorCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import { createCanvasItemFromWidget } from './utils/adapter'
import type { WidgetType } from './types'

// 使用PanelV2的canvas store
const canvasStore = useCanvasStore()

// 处理添加组件
const handleAddWidget = (type: WidgetType) => {
  // 在画布中心添加组件
  const centerX = (canvasStore.config.width || 1200) / 2 - 100
  const centerY = (canvasStore.config.height || 800) / 2 - 50
  
  const item = createCanvasItemFromWidget(type, { 
    x: centerX, 
    y: centerY 
  })
  
  canvasStore.addItem(item)
}

// 组件挂载时初始化
onMounted(() => {
  // 确保编辑模式
  canvasStore.setMode('edit')
  
  // 设置合适的画布配置
  canvasStore.updateConfig({
    showGrid: true,
    snapToGrid: false,
    backgroundColor: 'var(--n-body-color)'
  })
})
</script>

<style scoped>
.visual-editor {
  width: 100%;
  height: 100%;
  min-height: 600px;
  background-color: var(--n-body-color);
}
</style>