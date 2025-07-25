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
        <RedesignedInspector v-show="isInspectorOpen" />
        <button class="toggle-btn right-toggle" @click="toggleInspector">
          <i :class="isInspectorOpen ? 'fa fa-chevron-right' : 'fa fa-chevron-left'"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, provide } from 'vue';
import Toolbar from './toolbar/Toolbar.vue';
import Sidebar from './sidebar/Sidebar.vue';
import Canvas from './canvas/Canvas.vue';
import RedesignedInspector from './inspector/RedesignedInspector.vue';
import { usePanelStore, setGlobalEventBus } from './state/panelStore';
import type { PanelState, ToolbarAction, DraggableItem, ComponentRegistry } from './types';
import { PluginManager, providePluginManager, ModuleLoader, JsonLoader } from './plugins';
import type { Plugin } from './plugins';
import { useKeyboard } from './composables/useKeyboard';
import { useHistory } from './composables/useHistory';

// 引入核心架构层
import { createLayoutManager } from './core/PureLayoutManager';
import { createLifecycleManager, LIFECYCLE_PHASES } from './core/LifecycleManager';
import { createThemeEngine } from './engines/ThemeEngine';
import { createToolEngine } from './engines/ToolEngine';
import { createNodeRegistryEngine } from './engines/NodeRegistryEngine';

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

// --- 核心架构层管理器 ---
const layoutManager = createLayoutManager();
const lifecycleManager = createLifecycleManager();
const themeEngine = createThemeEngine();
const toolEngine = createToolEngine();
const nodeRegistryEngine = createNodeRegistryEngine();

// 创建一个简单的事件总线来连接panelStore和架构层
const eventBus = {
  listeners: new Map<string, Set<Function>>(),
  emit(event: string, payload: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  },
  on(event: string, handler: (payload: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  },
  off(event: string, handler: Function) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }
};

// 设置全局事件总线，让panelStore可以发射事件
setGlobalEventBus(eventBus);

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

// 提供核心管理器给子组件
provide('layoutManager', layoutManager);
provide('lifecycleManager', lifecycleManager);
provide('themeEngine', themeEngine);
provide('toolEngine', toolEngine);
provide('nodeRegistryEngine', nodeRegistryEngine);

// 提供插件管理器给子组件
if (props.enablePluginSystem !== false) {
  providePluginManager(pluginManager);
}

// --- 计算属性 - 合并插件提供的数据 ---
const toolbarActions = computed(() => {
  const baseActions = props.toolbarActions || [];
  
  // 从工具引擎获取工具栏工具
  const engineActions = toolEngine.getToolbarTools().map(tool => ({
    id: tool.id,
    icon: tool.icon,
    tooltip: tool.shortcut ? `${tool.name} (${formatShortcut(tool.shortcut)})` : tool.name,
    action: () => toolEngine.executor.execute(tool.id, getCurrentEditorContext())
  }));
  
  if (props.enablePluginSystem === false) {
    return [...engineActions, ...baseActions];
  }
  
  const pluginActions = pluginManager.getToolbarActions();
  return [...engineActions, ...baseActions, ...pluginActions];
});

const draggableItems = computed(() => {
  const baseItems = props.draggableItems || [];
  
  // 从节点注册引擎获取组件
  const engineItems = nodeRegistryEngine.manager.getAllComponents().map(component => ({
    type: component.type,
    label: component.name,
    icon: component.meta.icon || 'fas fa-cube',
    category: component.category,
    defaultData: {
      type: component.type,
      config: {
        base: component.defaults.config.base,
        interaction: component.defaults.config.interaction,
        content: component.defaults.config.content
      },
      layout: component.defaults.layout
    }
  }));
  
  if (props.enablePluginSystem === false) {
    return [...baseItems, ...engineItems];
  }
  
  const pluginItems = pluginManager.getDraggableItems();
  return [...baseItems, ...engineItems, ...pluginItems];
});

const inspectorRegistry = computed(() => {
  const baseRegistry = props.inspectorRegistry || {};
  if (props.enablePluginSystem === false) return baseRegistry;
  
  const pluginRegistry = pluginManager.getInspectorRegistry();
  return { ...baseRegistry, ...pluginRegistry };
});

// --- 辅助函数 ---
const formatShortcut = (shortcut: any) => {
  if (!shortcut) return ''
  const parts = []
  if (shortcut.modifiers?.includes('ctrl')) parts.push('Ctrl')
  if (shortcut.modifiers?.includes('alt')) parts.push('Alt')
  if (shortcut.modifiers?.includes('shift')) parts.push('Shift')
  if (shortcut.modifiers?.includes('meta')) parts.push('Cmd')
  parts.push(shortcut.key.toUpperCase())
  return parts.join(' + ')
}

const getCurrentEditorContext = () => ({
  dataEngine: {
    save: () => panelStore.saveToStorage(),
    reload: () => panelStore.loadFromStorage(),
    undo: () => handleUndo(),
    redo: () => handleRedo(),
    canUndo: () => !!undo(),
    canRedo: () => !!redo(),
    isDirty: () => true // 简化实现
  },
  renderEngine: {
    removeNodes: (nodeIds: string[]) => {
      nodeIds.forEach(id => panelStore.deleteCard(id));
    },
    zoomIn: () => console.log('放大视图'),
    zoomOut: () => console.log('缩小视图'),
    zoomToFit: () => console.log('适应画布')
  },
  selectedNodes: panelStore.selectedItemId ? [panelStore.selectedItem].filter(Boolean) : [],
  clipboard: {
    copy: (nodes: any[]) => console.log('复制节点', nodes),
    paste: () => console.log('粘贴节点'),
    hasContent: () => false
  }
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
  // 触发架构层生命周期
  await lifecycleManager.trigger(LIFECYCLE_PHASES.EDITOR.BEFORE_MOUNT, {
    panel: panelStore.$state
  });

  if (props.initialState) {
    panelStore.setPanelState(props.initialState as PanelState);
  }

  // 初始化工具引擎
  toolEngine.setContextProvider(getCurrentEditorContext);
  toolEngine.shortcuts.startListening();

  // 初始化主题引擎
  themeEngine.adapter.listenToExternalTheme((theme) => {
    console.log('主题已更新:', theme.name, theme.type);
    // 可以在这里更新面板的主题相关配置
  });

  // 注册一些示例组件到节点注册引擎
  await initializeBuiltInComponents();

  // 设置事件监听，连接panelStore事件与生命周期管理器
  eventBus.on('node-added', (payload) => {
    lifecycleManager.trigger(LIFECYCLE_PHASES.NODE.ADDED, {
      node: payload.node,
      panel: panelStore.$state
    });
  });

  eventBus.on('node-updated', (payload) => {
    lifecycleManager.trigger(LIFECYCLE_PHASES.NODE.UPDATED, {
      nodeId: payload.id,
      node: payload.node,
      panel: panelStore.$state
    });
  });

  eventBus.on('node-removed', (payload) => {
    lifecycleManager.trigger(LIFECYCLE_PHASES.NODE.REMOVED, {
      nodeId: payload.id,
      node: payload.node,
      panel: panelStore.$state
    });
  });

  eventBus.on('selection-changed', (payload) => {
    lifecycleManager.trigger(LIFECYCLE_PHASES.NODE.SELECTED, {
      previousId: payload.previousId,
      currentId: payload.currentId,
      selectedNodes: payload.selectedNodes,
      panel: panelStore.$state
    });
  });

  // 注册快捷键（保留原有逻辑，但可能会被工具引擎的快捷键覆盖）
  registerShortcuts([
    {
      key: 'a',
      ctrl: true,
      action: () => {
        console.log('全选');
        // 实现全选逻辑
      },
      description: '全选'
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

  // 触发挂载完成生命周期
  await lifecycleManager.trigger(LIFECYCLE_PHASES.EDITOR.MOUNTED, {
    panel: panelStore.$state
  });
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

// --- 初始化内置组件 ---
const initializeBuiltInComponents = async () => {
  const builtInComponents = [
    {
      type: 'text-card',
      name: '文本卡片',
      category: 'basic',
      component: () => import('./cards/TextCard.vue'),
      configSchema: {
        base: { type: 'object', properties: {} },
        interaction: { type: 'object', properties: {} },
        content: { 
          type: 'object', 
          properties: {
            title: { type: 'string', title: '标题' },
            content: { type: 'string', title: '内容' }
          }
        }
      },
      defaults: {
        layout: { w: 4, h: 3 },
        config: { base: {}, interaction: {}, content: { title: '文本标题', content: '文本内容' } },
        style: {}
      },
      meta: {
        title: '文本卡片',
        description: '显示文本内容的基础卡片',
        icon: 'fas fa-font',
        version: '1.0.0',
        keywords: ['文本', '基础']
      },
      responsive: { autoResize: true }
    },
    {
      type: 'image-card',
      name: '图片卡片',
      category: 'media',
      component: () => import('./cards/ImageCard.vue'),
      configSchema: {
        base: { type: 'object', properties: {} },
        interaction: { type: 'object', properties: {} },
        content: { 
          type: 'object', 
          properties: {
            src: { type: 'string', title: '图片地址' },
            alt: { type: 'string', title: '替代文本' }
          }
        }
      },
      defaults: {
        layout: { w: 4, h: 4 },
        config: { base: {}, interaction: {}, content: { src: '', alt: '图片' } },
        style: {}
      },
      meta: {
        title: '图片卡片',
        description: '显示图片的卡片组件',
        icon: 'fas fa-image',
        version: '1.0.0',
        keywords: ['图片', '媒体']
      },
      responsive: { autoResize: true }
    }
  ];

  for (const component of builtInComponents) {
    try {
      await nodeRegistryEngine.manager.register(component as any);
    } catch (error) {
      console.warn(`Failed to register built-in component ${component.type}:`, error);
    }
  }
};

// 暴露所有管理器给父组件
defineExpose({
  // 原有管理器
  pluginManager,
  panelStore,
  // 新的架构层管理器
  layoutManager,
  lifecycleManager,
  themeEngine,
  toolEngine,
  nodeRegistryEngine,
  // 调试方法
  getDebugInfo: () => ({
    layout: layoutManager.getLayoutState(),
    lifecycle: lifecycleManager.getDebugInfo(),
    tools: toolEngine.getAllTools().length,
    components: nodeRegistryEngine.manager.getAllComponents().length,
    plugins: pluginManager ? Array.from((pluginManager as any).plugins.keys()) : []
  })
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