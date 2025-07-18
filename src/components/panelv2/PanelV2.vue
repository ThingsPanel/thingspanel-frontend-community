<template>
  <div class="panel-v2-root">
    <Toolbar :actions="toolbarActions" @execute="executeAction" />

    <div class="main-container">
      <Sidebar :items="draggableItems" />

      <!-- 
        Canvas 现在通过插槽将渲染责任完全下放。
        使用者需要监听这个插槽来决定如何渲染卡片。
      -->
      <Canvas>
        <template #card="{ cardData }">
          <!-- 
            将卡片数据和默认插槽内容向上传递。
            这样，PanelV2 的使用者就可以完全控制渲染。
            例如: <PanelV2><template #card="{ cardData }">...</template></PanelV2>
          -->
          <slot name="card" :cardData="cardData"></slot>
        </template>
      </Canvas>

      <!-- Inspector 现在需要一个注册表来动态加载配置器 -->
      <Inspector :registry="inspectorRegistry" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, provide } from 'vue';
import Toolbar from './toolbar/Toolbar.vue';
import Sidebar from './sidebar/Sidebar.vue';
import Canvas from './canvas/Canvas.vue';
import Inspector from './inspector/Inspector.vue';
import { usePanelStore } from './state/panelStore';
import type { PanelState, ToolbarAction, DraggableItem, ComponentRegistry } from './types';

// --- 组件 Props ---
const props = defineProps<{ 
  initialState?: Partial<PanelState>;
  toolbarActions?: ToolbarAction[];
  draggableItems?: DraggableItem[];
  inspectorRegistry?: ComponentRegistry<any>; // 从外部接收配置器注册表
}>();

// --- 状态管理 ---
const panelStore = usePanelStore();

// --- 生命周期 ---
onMounted(() => {
  if (props.initialState) {
    panelStore.setPanelState(props.initialState as PanelState);
  }
});

// --- 事件处理 ---
const executeAction = (action: (state: any) => void) => {
  action(panelStore);
};

</script>

<style scoped>
.panel-v2-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #f0f2f5;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>