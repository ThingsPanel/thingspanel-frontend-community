<template>
  <div class="visual-editor-demo">
    <!-- 页面头部 -->
    <div class="demo-header">
      <n-page-header title="可视化编辑器演示" subtitle="架构对齐版MVP测试">
        <template #extra>
          <n-space>
            <n-button 
              type="primary" 
              @click="saveConfig"
            >
              <template #icon>
                <n-icon><div class="i-mdi-content-save" /></n-icon>
              </template>
              保存配置
            </n-button>
            <n-button 
              @click="loadConfig"
            >
              <template #icon>
                <n-icon><div class="i-mdi-folder-open" /></n-icon>
              </template>
              加载配置
            </n-button>
            <n-button 
              @click="clearCanvas"
            >
              <template #icon>
                <n-icon><div class="i-mdi-delete-sweep" /></n-icon>
              </template>
              清空画布
            </n-button>
          </n-space>
        </template>
      </n-page-header>
    </div>
    
    <!-- 编辑器容器 -->
    <div class="editor-container">
      <PanelEditor 
        renderer-type="kanban"
        @save="handleSave"
        @preview="handlePreview"
      />
    </div>
    
    <!-- 状态调试面板 -->
    <n-drawer
      v-model:show="showDebugPanel"
      :width="400"
      placement="right"
      title="调试信息"
    >
      <n-tabs type="line">
        <n-tab-pane name="state" tab="状态">
          <n-code 
            language="json" 
            :code="debugInfo.state"
            word-wrap
          />
        </n-tab-pane>
        <n-tab-pane name="items" tab="项目">
          <n-code 
            language="json" 
            :code="debugInfo.items"
            word-wrap
          />
        </n-tab-pane>
        <n-tab-pane name="selected" tab="选中">
          <n-code 
            language="json" 
            :code="debugInfo.selected"
            word-wrap
          />
        </n-tab-pane>
      </n-tabs>
    </n-drawer>
    
    <!-- 悬浮调试按钮 -->
    <n-button
      class="debug-toggle"
      circle
      type="primary"
      @click="showDebugPanel = !showDebugPanel"
    >
      <template #icon>
        <n-icon><div class="i-mdi-bug" /></n-icon>
      </template>
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { PanelEditor, createEditor } from '@/components/visual-editor'
import { useCanvasStore } from '@/components/panelv2/store/canvasStore'

const message = useMessage()
const canvasStore = useCanvasStore()
const { items, selectedItems, canvasState } = storeToRefs(canvasStore)

const showDebugPanel = ref(false)

// 调试信息
const debugInfo = computed(() => ({
  state: JSON.stringify({
    itemCount: items.value.length,
    selectedCount: selectedItems.value.length,
    mode: canvasState.value.mode,
    viewport: canvasState.value.viewport,
    config: canvasState.value.config
  }, null, 2),
  items: JSON.stringify(items.value.map(item => ({
    id: item.id,
    type: item.type,
    cardId: item.cardData.cardId,
    position: item.position,
    size: item.size,
    visible: item.visible,
    locked: item.locked
  })), null, 2),
  selected: JSON.stringify(selectedItems.value.map(item => ({
    id: item.id,
    cardId: item.cardData.cardId,
    config: item.cardData.config
  })), null, 2)
}))

// 保存配置
const saveConfig = () => {
  try {
    const config = {
      version: '1.0.0',
      timestamp: Date.now(),
      canvasState: canvasState.value
    }
    
    localStorage.setItem('visual-editor-config', JSON.stringify(config))
    message.success('配置已保存到本地存储')
  } catch (error) {
    message.error('保存配置失败: ' + (error as Error).message)
  }
}

// 加载配置
const loadConfig = () => {
  try {
    const saved = localStorage.getItem('visual-editor-config')
    if (!saved) {
      message.warning('未找到保存的配置')
      return
    }
    
    const config = JSON.parse(saved)
    if (config.canvasState) {
      canvasStore.setState(config.canvasState)
      message.success('配置加载成功')
    } else {
      message.error('配置格式无效')
    }
  } catch (error) {
    message.error('加载配置失败: ' + (error as Error).message)
  }
}

// 清空画布
const clearCanvas = () => {
  canvasStore.reset()
  canvasStore.setMode('edit')
  message.success('画布已清空')
}

// 处理编辑器事件
const handleSave = (config: any) => {
  saveConfig()
}

const handlePreview = (config: any) => {
  message.info('预览功能开发中...')
}

// 监听状态变化进行实时调试
watch(items, (newItems) => {
  console.log('📊 Canvas Items Updated:', newItems.length, 'items')
}, { deep: true })

watch(selectedItems, (newSelected) => {
  console.log('🎯 Selection Changed:', newSelected.length, 'selected')
})
</script>

<style scoped>
.visual-editor-demo {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--n-body-color);
}

.demo-header {
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid var(--n-border-color);
  background-color: var(--n-card-color);
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.debug-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

/* 确保页面头部样式正确 */
:deep(.n-page-header) {
  padding: 0;
}

:deep(.n-page-header-title) {
  font-size: 18px;
  font-weight: 600;
}

:deep(.n-page-header-subtitle) {
  font-size: 14px;
  opacity: 0.7;
}
</style>