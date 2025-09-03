<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'

const route = useRoute()

const panel_id = (route.query.id as string) || '72da0887-52f9-b546-27ce-e4c06ea07ca7'

const panelEditor = ref<InstanceType<typeof PanelEditor> | null>(null)

// 接收 PanelEditor 引用
const handleStateManagerReady = (sm: any) => {
  console.log('📋 [VisualEditorDetails] StateManager 已就绪:', sm)
}
</script>

<template>
  <div class="visual-editor-container">
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
}
</style>
