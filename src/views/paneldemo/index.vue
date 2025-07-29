<script setup lang="ts">
import { ref } from 'vue'
import PanelV2 from '@/components/panelv2/PanelV2.vue'
import { useMessage } from 'naive-ui'
import type { CanvasState } from '@/components/panelv2/types'

// Panel references
const panelRef = ref()

// 初始化消息组件
const message = useMessage()

// Event handlers
const handleModeChange = (mode: 'edit' | 'preview') => {
  console.log('Mode changed to:', mode)
}

const handleSave = (data: CanvasState) => {
  console.log('Panel saved:', data)
  message.success('面板保存成功！')
}

const handleLoaded = (data: CanvasState) => {
  console.log('Panel loaded:', data)
  message.info('面板加载完成')
}

const handleError = (error: Error) => {
  console.error('Panel error:', error)
  message.error(`面板操作失败: ${error.message}`)
}</script>

<template>
  <div class="h-full w-full">
    <PanelV2
      ref="panelRef"
      panel-id="demo-panel"
      mode="edit"
      @mode-change="handleModeChange"
      @save="handleSave"
      @loaded="handleLoaded"
      @error="handleError"
    />
  </div>
</template>


