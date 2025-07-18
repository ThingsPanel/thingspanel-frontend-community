<template>
  <div class="panel-v2-demo">
    <!-- PanelV2 组件 -->
    <div class="panel-container">
      <PanelV2 
        :toolbar-actions="toolbarActions"
        :draggable-items="draggableItems"
        :inspector-registry="inspectorRegistry"
        @card-selected="onCardSelected"
      >
        <template #card="{ cardData }">
          <div 
            class="demo-card" 
            :class="{ 'selected': cardData.id === panelStore.selectedItemId }"
            @click="selectCard(cardData.id)"
          >
            <div class="card-header">
              <h4>{{ cardData.type }}</h4>
              <button class="delete-btn" @click.stop="deleteCard(cardData.id)">×</button>
            </div>
            <div class="card-body">
              <p>ID: {{ cardData.id }}</p>
              <p>配置项: {{ Object.keys(cardData.config).length }}</p>
              <!-- 显示配置数据 -->
              <div v-for="(configItem, key) in cardData.config" :key="key" class="config-item">
                <span class="config-key">{{ key }}:</span>
                <span class="config-value">{{ configItem.value }}</span>
              </div>
            </div>
          </div>
        </template>
      </PanelV2>
    </div>
    
    <!-- 调试面板 -->
    <div class="debug-panel">
      <div class="debug-toggle" @click="isDebugVisible = !isDebugVisible">
        <span>{{ isDebugVisible ? '🔽' : '🔼' }} 调试信息 ({{ panelStore.cards.length }} 卡片)</span>
      </div>
      <div v-show="isDebugVisible" class="status-display">
        <div class="status-card">
          <h3>当前选中项</h3>
          <div class="status-content">
            <p><strong>ID:</strong> {{ selectedItemDisplay.id || '无选中' }}</p>
            <p><strong>类型:</strong> {{ selectedItemDisplay.type || '看板' }}</p>
            <p><strong>配置数据:</strong></p>
            <pre>{{ JSON.stringify(selectedItemDisplay.config, null, 2) }}</pre>
          </div>
        </div>

        <!-- 本地存储状态 -->
        <div class="status-card">
          <h3>本地存储状态</h3>
          <div class="status-content">
            <p><strong>存储键:</strong> panelv2_state</p>
            <p><strong>已保存卡片:</strong> {{ localStorageInfo.cardCount }} 个</p>
            <p><strong>已保存配置:</strong> {{ localStorageInfo.configCount }} 项</p>
            <p><strong>存储大小:</strong> {{ localStorageInfo.storageSize }} 字符</p>
            <p><strong>最后更新:</strong> {{ localStorageInfo.lastUpdate || '未知' }}</p>
            <div style="margin-top: 8px;">
              <button style="padding: 4px 8px; margin-right: 8px; font-size: 12px;" @click="checkLocalStorage">🔍 检查存储</button>
              <button style="padding: 4px 8px; font-size: 12px;" @click="exportLocalStorage">📤 导出数据</button>
            </div>
          </div>
        </div>
        
        <div class="status-card">
          <h3>看板全局配置</h3>
          <div class="status-content">
            <pre>{{ JSON.stringify(panelStore.config, null, 2) }}</pre>
          </div>
        </div>
        
        <div class="status-card">
          <h3>所有卡片数据</h3>
          <div class="status-content">
            <div v-for="card in panelStore.cards" :key="card.id" class="card-info">
              <p><strong>{{ card.id }}</strong> ({{ card.type }})</p>
              <p>布局: x={{ card.layout.x }}, y={{ card.layout.y }}, w={{ card.layout.w }}, h={{ card.layout.h }}</p>
              <p>配置: {{ Object.keys(card.config).length }} 项</p>
            </div>
            <p v-if="panelStore.cards.length === 0">暂无卡片</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import PanelV2 from '../PanelV2.vue';
import { usePanelStore } from '../state/panelStore';
import type { ToolbarAction, DraggableItem, ComponentRegistry } from '../types';
import TextInput from '../inspector/components/TextInput.vue';
import NumberInput from '../inspector/components/NumberInput.vue';
import TextArea from '../inspector/components/TextArea.vue';
import ColorPicker from '../inspector/components/ColorPicker.vue';

// --- 状态管理 ---
const panelStore = usePanelStore();

// --- 调试面板可见性 ---
const isDebugVisible = ref(false);

// --- 计算属性：当前选中项的显示信息 ---
const selectedItemDisplay = computed(() => {
  const selected = panelStore.selectedItem;
  if (!selected) {
    return { id: null, type: null, config: {} };
  }
  
  if (selected.id === null) {
    // 选中的是看板本身
    return {
      id: '看板',
      type: '看板配置',
      config: selected.config
    };
  }
  
  // 选中的是卡片
  return {
    id: selected.id,
    type: (selected as any).type || '未知类型',
    config: selected.config
  };
});

// --- 本地存储信息 ---
const localStorageInfo = ref({
  cardCount: 0,
  configCount: 0,
  storageSize: 0,
  lastUpdate: null as string | null
});

// 检查本地存储状态
const checkLocalStorage = () => {
  try {
    const stored = localStorage.getItem('panelv2_state');
    if (stored) {
      const data = JSON.parse(stored);
      localStorageInfo.value = {
        cardCount: data.cards?.length || 0,
        configCount: Object.keys(data.config || {}).length,
        storageSize: stored.length,
        lastUpdate: data.lastUpdate || new Date().toLocaleString()
      };
    } else {
      localStorageInfo.value = {
        cardCount: 0,
        configCount: 0,
        storageSize: 0,
        lastUpdate: null
      };
    }
  } catch (error) {
    console.error('检查本地存储失败:', error);
  }
};

// 导出本地存储数据
const exportLocalStorage = () => {
  try {
    const stored = localStorage.getItem('panelv2_state');
    if (stored) {
      const blob = new Blob([stored], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `panelv2_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('✅ 数据导出成功');
    } else {
      alert('没有可导出的数据');
    }
  } catch (error) {
    console.error('导出数据失败:', error);
    alert('导出失败，请查看控制台');
  }
};

// 初始化时检查本地存储
checkLocalStorage();

// 监听 store 状态变化，自动更新本地存储信息
watch(
  () => [panelStore.cards, panelStore.config],
  () => {
    // 延迟一点时间确保本地存储已更新
    setTimeout(checkLocalStorage, 100);
  },
  { deep: true }
);

// --- 工具栏配置 ---
const toolbarActions: ToolbarAction[] = [
  {
    id: 'refresh',
    icon: '🔄',
    tooltip: '从本地存储刷新回显数据',
    action: (store) => {
      // 从本地存储加载数据
      const loaded = store.loadFromStorage();
      if (loaded) {
        console.log('✅ 已从本地存储恢复数据');
      } else {
        console.log('⚠️ 本地存储中没有保存的数据');
      }
    }
  },
  {
    id: 'save',
    icon: '💾',
    tooltip: '手动保存到本地存储',
    action: (store) => {
      store.saveToStorage();
      console.log('✅ 数据已手动保存到本地存储');
    }
  },
  {
    id: 'clear-storage',
    icon: '🗑️',
    tooltip: '清除本地存储数据',
    action: (store) => {
      if (confirm('确定要清除本地存储的数据吗？这将删除所有保存的卡片和配置。')) {
        store.clearStorage();
        // 重置为初始状态
        store.$reset();
        // 重新设置初始配置
        store.config = {
          backgroundColor: {
            value: '#f0f2f5',
            inspector: 'color-picker',
            label: '背景颜色',
            description: '设置看板的背景颜色'
          },
          title: {
            value: '我的看板',
            inspector: 'text-input',
            label: '看板标题',
            description: '设置看板的显示标题'
          },
          gridSize: {
            value: 12,
            inspector: 'number-input',
            label: '网格列数',
            description: '设置看板网格的列数（1-24）'
          }
        };
        console.log('✅ 已清除本地存储并重置为初始状态');
      }
    }
  },
  {
    id: 'preview',
    icon: '👁️',
    tooltip: '预览模式',
    action: (store) => {
      // 导出当前状态用于预览
      const stateJson = JSON.stringify(store.$state, null, 2);
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head>
              <title>PanelV2 预览</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; }
                .preview-info { background: #e6f7ff; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="preview-info">
                <h2>PanelV2 看板预览</h2>
                <p>当前时间: ${new Date().toLocaleString()}</p>
                <p>卡片数量: ${store.cards.length}</p>
                <p>配置项数量: ${Object.keys(store.config).length}</p>
              </div>
              <h3>完整状态数据:</h3>
              <pre>${stateJson}</pre>
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
    }
  },
  {
    id: 'select-panel',
    icon: '🎯',
    tooltip: '选择看板配置',
    action: (store) => {
      store.selectItem(null);
    }
  },
  {
    id: 'clear-selection',
    icon: '❌',
    tooltip: '取消选择',
    action: (store) => {
      store.selectItem(undefined);
    }
  },
  {
    id: 'add-panel-config',
    icon: '⚙️',
    tooltip: '添加看板配置项',
    action: (store) => {
      const key = `config_${Date.now()}`;
      store.config[key] = {
        value: `看板配置值_${Date.now()}`,
        inspector: 'text-input',
        label: '新配置项',
        description: '动态添加的配置项'
      };
    }
  }
];

// --- 可拖拽项配置 ---
const draggableItems: DraggableItem[] = [
  {
    type: 'text-card',
    label: '文本卡片',
    icon: '📝',
    defaultData: {
      type: 'text-card',
      config: {
        title: {
          value: '新建文本卡片',
          inspector: 'text-input',
          label: '卡片标题',
          description: '设置卡片显示的标题文字'
        },
        content: {
          value: '这是卡片内容',
          inspector: 'textarea',
          label: '卡片内容',
          description: '设置卡片显示的主要内容'
        },
        color: {
          value: '#1890ff',
          inspector: 'color-picker',
          label: '主题颜色',
          description: '设置卡片的主题色彩'
        }
      }
    }
  },
  {
    type: 'data-card',
    label: '数据卡片',
    icon: '📊',
    defaultData: {
      type: 'data-card',
      config: {
        title: {
          value: '数据展示',
          inspector: 'text-input',
          label: '数据标题',
          description: '设置数据展示的标题'
        },
        value: {
          value: 100,
          inspector: 'number-input',
          label: '数据值',
          description: '设置要显示的数值'
        },
        unit: {
          value: '个',
          inspector: 'text-input',
          label: '数据单位',
          description: '设置数值的单位'
        }
      }
    }
  }
];

// --- 配置器注册表 ---
const inspectorRegistry: ComponentRegistry<any> = {
  'text-input': TextInput,
  'textarea': TextArea,
  'number-input': NumberInput,
  'color-picker': ColorPicker
};

// --- 事件处理 ---
const selectCard = (cardId: string) => {
  panelStore.selectItem(cardId);
};

const deleteCard = (cardId: string) => {
  panelStore.deleteCard(cardId);
};

const onCardSelected = (cardId: string) => {
  console.log('卡片被选中:', cardId);
};

// --- 初始化看板配置 ---
panelStore.config = {
  backgroundColor: {
    value: '#f0f2f5',
    inspector: 'color-picker',
    label: '背景颜色',
    description: '设置看板的背景颜色'
  },
  title: {
    value: '我的看板',
    inspector: 'text-input',
    label: '看板标题',
    description: '设置看板的显示标题'
  },
  gridSize: {
    value: 12,
    inspector: 'number-input',
    label: '网格列数',
    description: '设置看板网格的列数（1-24）'
  }
};
</script>

<style scoped>
.panel-v2-demo {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

/* 调试面板 */
.debug-panel {
  background-color: #fff;
  border-top: 1px solid #e8e8e8;
}

.debug-toggle {
  padding: 8px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
  transition: background-color 0.2s;
}

.debug-toggle:hover {
  background-color: #f0f0f0;
}

/* 状态显示区域 */
.status-display {
  display: flex;
  gap: 16px;
  padding: 16px;
  background-color: #fff;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.status-card {
  min-width: 300px;
  margin-bottom: 0;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.status-card h3 {
  margin: 0;
  padding: 12px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #d9d9d9;
  font-size: 14px;
  font-weight: 600;
}

.status-content {
  padding: 16px;
  font-size: 12px;
}

.status-content p {
  margin: 8px 0;
  line-height: 1.4;
}

.status-content pre {
  background-color: #f6f8fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.3;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.card-info {
  padding: 8px;
  margin: 8px 0;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
}

.card-info p {
  margin: 4px 0;
}

/* 面板容器 */
.panel-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 演示卡片样式 */
.demo-card {
  width: 100%;
  height: 100%;
  background-color: #fff;
  border: 2px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.demo-card:hover {
  border-color: #40a9ff;
  box-shadow: 0 2px 8px rgba(64, 169, 255, 0.2);
}

.demo-card.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  background-color: #f6ffed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.delete-btn {
  background: none;
  border: none;
  color: #ff4d4f;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.delete-btn:hover {
  background-color: #fff2f0;
}

.card-body {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-body p {
  margin: 6px 0;
  font-size: 12px;
  color: #595959;
}

.config-item {
  display: flex;
  margin: 4px 0;
  font-size: 11px;
}

.config-key {
  font-weight: 600;
  color: #1890ff;
  margin-right: 8px;
  min-width: 60px;
}

.config-value {
  color: #262626;
  word-break: break-all;
}
</style>