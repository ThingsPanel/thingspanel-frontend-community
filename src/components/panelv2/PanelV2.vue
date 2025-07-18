<template>
  <div class="panel-v2-root">
    <!-- 顶部工具栏 -->
    <Toolbar :actions="toolbarActions" @execute="executeAction" />
    
    <!-- 主要内容区域 -->
    <div class="main-container">
      <!-- 左侧边栏区域 -->
      <div class="sidebar-container" :class="{ 'collapsed': !isSidebarOpen }">
        <Sidebar v-show="isSidebarOpen" :items="draggableItems" />
        <button class="toggle-btn left-toggle" @click="toggleSidebar">
          <i :class="isSidebarOpen ? 'fa fa-chevron-left' : 'fa fa-chevron-right'"></i>
        </button>
      </div>
      
      <!-- 中间画布区域 -->
      <div class="canvas-container">
        <Canvas>
          <template #card="{ cardData }">
            <slot name="card" :cardData="cardData"></slot>
          </template>
        </Canvas>
      </div>
      
      <!-- 右侧检查器区域 -->
      <div class="inspector-container" :class="{ 'collapsed': !isInspectorOpen }">
        <Inspector v-show="isInspectorOpen" :registry="inspectorRegistry" />
        <button class="toggle-btn right-toggle" @click="toggleInspector">
          <i :class="isInspectorOpen ? 'fa fa-chevron-right' : 'fa fa-chevron-left'"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, provide, ref } from 'vue';
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

// --- 侧边栏和检查器可见性控制 ---
const isSidebarOpen = ref(true);
const isInspectorOpen = ref(true);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const toggleInspector = () => {
  isInspectorOpen.value = !isInspectorOpen.value;
};

</script>

<style scoped>
/* 根容器 - 使用flex布局避免滚动条 */
.panel-v2-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #f0f2f5;
}

/* 主容器 - 水平flex布局 */
.main-container {
  display: flex;
  flex: 1;
  min-height: 0; /* 关键：允许flex子项收缩 */
}

/* 侧边栏容器 */
.sidebar-container {
  display: flex;
  position: relative;
  width: 200px;
  transition: width 0.3s ease;
  background-color: #fff;
  border-right: 1px solid #e8e8e8;
}

.sidebar-container.collapsed {
  width: 0;
  border-right: none;
}

/* 画布容器 - 占据剩余空间 */
.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* 防止flex子项溢出 */
  overflow: hidden;
}

/* 检查器容器 */
.inspector-container {
  display: flex;
  position: relative;
  width: 300px;
  transition: width 0.3s ease;
  background-color: #fff;
  border-left: 1px solid #e8e8e8;
}

.inspector-container.collapsed {
  width: 0;
  border-left: none;
}

/* 切换按钮样式 */
.toggle-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  width: 28px;
  height: 40px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background-color: #f5f5f5;
  border-color: #40a9ff;
  color: #40a9ff;
}

/* 左侧切换按钮 */
.left-toggle {
  right: -14px;
  border-radius: 0 6px 6px 0;
  border-left: none;
}

/* 右侧切换按钮 */
.right-toggle {
  left: -14px;
  border-radius: 6px 0 0 6px;
  border-right: none;
}


</style>