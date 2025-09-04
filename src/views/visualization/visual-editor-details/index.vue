<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'

const route = useRoute()

const panel_id = (route.query.id as string) || '72da0887-52f9-b546-27ce-e4c06ea07ca7'

const panelEditor = ref<InstanceType<typeof PanelEditor> | null>(null)

// 接收 PanelEditor 引用
const handleStateManagerReady = (sm: any) => {}
</script>

<template>
  <div class="visual-editor-container visual-editor-page">
    <!-- 主编辑器 -->
    <PanelEditor
      ref="panelEditor"
      :panel-id="panel_id"
      :show-toolbar="true"
      :show-page-header="true"
      @state-manager-ready="handleStateManagerReady"
    />
  </div>
</template>

<style scoped>
.visual-editor-container {
  position: relative;
  width: 100%;
  height: 100%;
  /* 🔥 修复：为编辑器提供明确的最小高度基准 */
  min-height: 100vh; /* 确保至少占满视口高度 */
}

/* 🔥 针对当前页面：移除 AdminLayout 主内容区域的滚动条 */
.visual-editor-container {
  /* 使用固定高度，避免内容溢出 */
  height: calc(100vh - 100px); /* 减去头部和导航高度 */
  overflow: hidden;
}
</style>

<style>
/* 🔥 全局样式：只针对视觉编辑器页面移除滚动条 */
body:has(.visual-editor-page) main.flex-grow {
  overflow: hidden !important;
}

/* 如果浏览器不支持 :has，用更通用的方法 */
.visual-editor-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
