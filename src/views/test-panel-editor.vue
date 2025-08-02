<!--
  测试可视化编辑器页面
  用于验证 PanelEditor 组件的功能
-->
<template>
  <div class="test-panel-editor">
    <PanelEditor
      :config="editorConfig"
      :initial-mode="'edit'"
      @save="handleSave"
      @change="handleChange"
      @mode-change="handleModeChange"
      @export="handleExport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PanelEditor } from '@/components/visual-editor'
import type { EditorMode } from '@/components/visual-editor/components/Layout'

/**
 * 测试可视化编辑器页面
 */

// 编辑器配置
const editorConfig = ref({
  width: 1200,
  height: 800,
  backgroundColor: '#f5f5f5',
  gridEnabled: true,
  snapToGrid: true
})

/**
 * 处理保存事件
 */
const handleSave = (data: any) => {
  console.log('保存数据:', data)
  window.$message?.success('保存成功')
}

/**
 * 处理数据变化事件
 */
const handleChange = (data: any) => {
  console.log('数据变化:', data)
}

/**
 * 处理模式变化事件
 */
const handleModeChange = (mode: EditorMode) => {
  console.log('模式变化:', mode)
}

/**
 * 处理导出事件
 */
const handleExport = (data: any) => {
  console.log('导出数据:', data)
  window.$message?.success('导出成功')
}
</script>

<style scoped>
.test-panel-editor {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>