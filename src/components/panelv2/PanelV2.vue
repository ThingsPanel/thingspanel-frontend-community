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
import { onMounted, ref, computed } from 'vue';
import Toolbar from './toolbar/Toolbar.vue';
import Sidebar from './sidebar/Sidebar.vue';
import Canvas from './canvas/Canvas.vue';
import Inspector from './inspector/Inspector.vue';
import { usePanelStore } from './state/panelStore';
import type { PanelState, ToolbarAction, DraggableItem, ComponentRegistry } from './types';
import { PluginManager, providePluginManager, ModuleLoader, JsonLoader } from './plugins';
import type { Plugin } from './plugins';
import { useKeyboard } from './composables/useKeyboard';
import { useHistory } from './composables/useHistory';

// --- 组件 Props ---
const props = defineProps<{ 
  initialState?: Partial<PanelState>;
  toolbarActions?: ToolbarAction[];
  draggableItems?: DraggableItem[];
  inspectorRegistry?: ComponentRegistry<any>;
  plugins?: Plugin[]; // 预装插件
  enablePluginSystem?: boolean; // 是否启用插件系统
}>();

// --- 状态管理 ---
const panelStore = usePanelStore();

// --- 历史记录管理 ---
const { recordHistory, undo, redo } = useHistory();

// --- 快捷键管理 ---
const { registerShortcuts } = useKeyboard();

// --- 插件管理器 ---
const pluginManager = new PluginManager({
  autoActivate: true,
  allowDuplicates: false,
  logLevel: 'info'
});

// 添加加载器
pluginManager.addLoader(new ModuleLoader());
pluginManager.addLoader(new JsonLoader());

// 提供插件管理器给子组件
if (props.enablePluginSystem !== false) {
  providePluginManager(pluginManager);
}

// --- 计算属性 - 合并插件提供的数据 ---
const toolbarActions = computed(() => {
  const baseActions = props.toolbarActions || [];
  
  // 添加内置的历史记录操作
  const historyActions: ToolbarAction[] = [
    {
      id: 'undo',
      icon: 'fa fa-undo',
      tooltip: '撤销 (Ctrl+Z)',
      action: () => handleUndo()
    },
    {
      id: 'redo',
      icon: 'fa fa-redo',
      tooltip: '重做 (Ctrl+Y)',
      action: () => handleRedo()
    }
  ];
  
  if (props.enablePluginSystem === false) {
    return [...historyActions, ...baseActions];
  }
  
  const pluginActions = pluginManager.getToolbarActions();
  return [...historyActions, ...baseActions, ...pluginActions];
});

const draggableItems = computed(() => {
  const baseItems = props.draggableItems || [];
  if (props.enablePluginSystem === false) return baseItems;
  
  const pluginItems = pluginManager.getDraggableItems();
  return [...baseItems, ...pluginItems];
});

const inspectorRegistry = computed(() => {
  const baseRegistry = props.inspectorRegistry || {};
  if (props.enablePluginSystem === false) return baseRegistry;
  
  const pluginRegistry = pluginManager.getInspectorRegistry();
  return { ...baseRegistry, ...pluginRegistry };
});

// --- 历史记录和快捷键处理 ---
const handleUndo = () => {
  const action = undo();
  if (action) {
    panelStore.setPanelState(action.beforeState);
    console.log('撤销操作:', action.description || action.type);
  }
};

const handleRedo = () => {
  const action = redo();
  if (action && action.afterState) {
    panelStore.setPanelState(action.afterState);
    console.log('重做操作:', action.description || action.type);
  }
};

// 记录状态变化
const recordStateChange = (type: string, beforeState: PanelState, afterState?: PanelState, description?: string) => {
  recordHistory(type, beforeState, afterState || panelStore.$state, description);
};

// --- 生命周期 ---
onMounted(async () => {
  if (props.initialState) {
    panelStore.setPanelState(props.initialState as PanelState);
  }

  // 注册快捷键
  registerShortcuts([
    {
      key: 'z',
      ctrl: true,
      action: handleUndo,
      description: '撤销'
    },
    {
      key: 'y',
      ctrl: true,
      action: handleRedo,
      description: '重做'
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      action: handleRedo,
      description: '重做'
    },
    {
      key: 's',
      ctrl: true,
      action: () => {
        console.log('保存面板配置');
        panelStore.saveToStorage();
      },
      description: '保存'
    },
    {
      key: 'a',
      ctrl: true,
      action: () => {
        console.log('全选');
        // 实现全选逻辑
      },
      description: '全选'
    },
    {
      key: 'c',
      ctrl: true,
      action: () => {
        if (panelStore.selectedItemId) {
          console.log('复制选中项');
          // 复制逻辑
        }
      },
      description: '复制'
    },
    {
      key: 'v',
      ctrl: true,
      action: () => {
        console.log('粘贴');
        // 粘贴逻辑
      },
      description: '粘贴'
    },
    {
      key: 'Delete',
      action: () => {
        if (panelStore.selectedItemId) {
          const beforeState = JSON.parse(JSON.stringify(panelStore.$state));
          panelStore.deleteCard(panelStore.selectedItemId);
          recordStateChange('delete_card', beforeState, undefined, '删除卡片');
        }
      },
      description: '删除选中项'
    }
  ]);

  // 安装预装插件
  if (props.plugins && props.enablePluginSystem !== false) {
    for (const plugin of props.plugins) {
      try {
        await pluginManager.install(plugin);
      } catch (error) {
        console.error(`Failed to install plugin ${plugin.meta.name}:`, error);
      }
    }
  }
});

// --- 事件处理 ---
const executeAction = (action: (panelStore: any) => void) => {
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

// 暴露插件管理器和状态存储给父组件
defineExpose({
  pluginManager,
  panelStore
});

</script>

<style scoped>
/* 根容器 - 可嵌入的组件设计 */
.panel-v2-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f0f2f5;
  position: relative;
  min-height: 0;
}

/* 主容器 - 水平flex布局 */
.main-container {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
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