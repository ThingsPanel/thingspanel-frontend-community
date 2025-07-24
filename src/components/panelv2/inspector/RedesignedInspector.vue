<template>
  <div class="redesigned-inspector">
    <!-- 看板配置（无选择时显示） -->
    <div v-if="!hasSelection" class="panel-config">
      <div class="config-header">
        <h3>
          <i class="fa fa-dashboard"></i>
          看板配置
        </h3>
      </div>
      
      <!-- 布局配置 -->
      <div class="config-section">
        <h4>布局设置</h4>
        <div class="config-items">
          <div class="config-item">
            <label>网格列数</label>
            <input 
              :value="panelConfig.layout?.gridColumns || 12"
              type="number"
              min="6" 
              max="24" 
              class="number-input"
              @input="updatePanelConfig('layout.gridColumns', Number($event.target.value))"
            />
            <span class="current-value">当前值: {{ panelConfig.layout?.gridColumns || 12 }}</span>
          </div>
          
          <div class="config-item">
            <label>单元格高度</label>
            <input 
              :value="panelConfig.layout?.cellHeight || 70"
              type="number"
              min="40" 
              max="120" 
              class="number-input"
              @input="updatePanelConfig('layout.cellHeight', Number($event.target.value))"
            />
            <span class="current-value">当前值: {{ panelConfig.layout?.cellHeight || 70 }}px</span>
          </div>
          
          <div class="config-item">
            <label>卡片间距</label>
            <input 
              :value="panelConfig.layout?.margin || 5"
              type="number"
              min="0" 
              max="20" 
              class="number-input"
              @input="updatePanelConfig('layout.margin', Number($event.target.value))"
            />
            <span class="current-value">当前值: {{ panelConfig.layout?.margin || 5 }}px</span>
          </div>
        </div>
      </div>

      <!-- 外观配置 -->
      <div class="config-section">
        <h4>外观设置</h4>
        <div class="config-items">
          <div class="config-item">
            <label>背景色</label>
            <div class="color-input-group">
              <input 
                :value="panelConfig.appearance?.backgroundColor || '#f5f5f5'"
                type="color"
                class="color-input"
                @input="updatePanelConfig('appearance.backgroundColor', $event.target.value)"
              />
              <input 
                :value="panelConfig.appearance?.backgroundColor || '#f5f5f5'"
                type="text"
                class="text-input"
                @input="updatePanelConfig('appearance.backgroundColor', $event.target.value)"
              />
            </div>
            <span class="current-value">当前值: {{ panelConfig.appearance?.backgroundColor || '#f5f5f5' }}</span>
          </div>
        </div>
      </div>

      <!-- 数据配置 -->
      <div class="config-section">
        <h4>数据设置</h4>
        <div class="config-items">
          <div class="config-item">
            <label>全局数据源</label>
            <textarea 
              :value="panelConfig.data?.globalDataSource || '{}'"
              rows="4"
              placeholder='{"apiUrl": "https://api.example.com", "refreshInterval": 5000}'
              class="textarea-input"
              @input="updatePanelConfig('data.globalDataSource', $event.target.value)"
            ></textarea>
            <span class="current-value">全局数据将传递给所有卡片</span>
          </div>
          
          <div class="config-item">
            <label>共享变量</label>
            <textarea 
              :value="panelConfig.data?.sharedVariables || '{}'"
              rows="3"
              placeholder='{"theme": "dark", "language": "zh-CN"}'
              class="textarea-input"
              @input="updatePanelConfig('data.sharedVariables', $event.target.value)"
            ></textarea>
            <span class="current-value">可在所有卡片中引用的变量</span>
          </div>
        </div>
      </div>

      <!-- 交互配置 -->
      <div class="config-section">
        <h4>交互设置</h4>
        <div class="config-items">
          <div class="config-item">
            <label>
              <input 
                :checked="panelConfig.interaction?.allowDrag !== false"
                type="checkbox"
                @change="updatePanelConfig('interaction.allowDrag', $event.target.checked)"
              />
              允许拖拽
            </label>
            <span class="current-value">状态: {{ panelConfig.interaction?.allowDrag !== false ? '启用' : '禁用' }}</span>
          </div>
          
          <div class="config-item">
            <label>
              <input 
                :checked="panelConfig.interaction?.allowResize !== false"
                type="checkbox"
                @change="updatePanelConfig('interaction.allowResize', $event.target.checked)"
              />
              允许调整大小
            </label>
            <span class="current-value">状态: {{ panelConfig.interaction?.allowResize !== false ? '启用' : '禁用' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点配置（选择节点时显示） -->
    <div v-else class="node-config">
      <div class="config-header">
        <h3>
          <i class="fa fa-cube"></i>
          节点配置 
          <small>({{ selectedNode?.type || 'unknown' }})</small>
        </h3>
      </div>

      <!-- 节点配置标签 -->
      <div class="node-tabs">
        <button 
          v-for="tab in nodeTabs" 
          :key="tab.key"
          :class="['tab-btn', { active: activeNodeTab === tab.key }]"
          @click="activeNodeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- 基础配置 -->
      <div v-if="activeNodeTab === 'basic'" class="config-section">
        <h4>基础配置</h4>
        <div class="config-items">
          <div class="config-grid">
            <div class="config-item">
              <label>X位置</label>
              <input 
                :value="selectedNode?.layout?.x || 0"
                type="number" 
                readonly
                class="number-input readonly"
              />
              <span class="current-value">网格位置: {{ selectedNode?.layout?.x || 0 }}</span>
            </div>
            
            <div class="config-item">
              <label>Y位置</label>
              <input 
                :value="selectedNode?.layout?.y || 0"
                type="number" 
                readonly
                class="number-input readonly"
              />
              <span class="current-value">网格位置: {{ selectedNode?.layout?.y || 0 }}</span>
            </div>
            
            <div class="config-item">
              <label>宽度</label>
              <input 
                :value="selectedNode?.layout?.w || 4"
                type="number"
                min="1" 
                :max="panelConfig.layout?.gridColumns || 12" 
                class="number-input"
                @input="updateNodeConfig('layout.w', Number($event.target.value))"
              />
              <span class="current-value">占用列数: {{ selectedNode?.layout?.w || 4 }}</span>
            </div>
            
            <div class="config-item">
              <label>高度</label>
              <input 
                :value="selectedNode?.layout?.h || 2"
                type="number"
                min="1" 
                max="20" 
                class="number-input"
                @input="updateNodeConfig('layout.h', Number($event.target.value))"
              />
              <span class="current-value">占用行数: {{ selectedNode?.layout?.h || 2 }}</span>
            </div>
          </div>
          
          <div class="config-item">
            <label>
              <input 
                :checked="selectedNode?.config?.base?.state?.locked || false"
                type="checkbox"
                @change="updateNodeConfig('base.state.locked', $event.target.checked)"
              />
              锁定位置
            </label>
            <span class="current-value">状态: {{ selectedNode?.config?.base?.state?.locked ? '锁定' : '可移动' }}</span>
          </div>
          
          <div class="config-item">
            <label>
              <input 
                :checked="selectedNode?.config?.base?.state?.hidden || false"
                type="checkbox"
                @change="updateNodeConfig('base.state.hidden', $event.target.checked)"
              />
              隐藏节点
            </label>
            <span class="current-value">状态: {{ selectedNode?.config?.base?.state?.hidden ? '隐藏' : '显示' }}</span>
          </div>
        </div>
      </div>

      <!-- UI配置 -->
      <div v-if="activeNodeTab === 'ui'" class="config-section">
        <h4>UI外观</h4>
        <div class="config-items">
          <div class="config-item">
            <label>边框颜色</label>
            <div class="color-input-group">
              <input 
                :value="selectedNode?.config?.base?.appearance?.border?.color || '#e8e8e8'"
                type="color"
                class="color-input"
                @input="updateNodeConfig('base.appearance.border.color', $event.target.value)"
              />
              <input 
                :value="selectedNode?.config?.base?.appearance?.border?.color || '#e8e8e8'"
                type="text"
                class="text-input"
                @input="updateNodeConfig('base.appearance.border.color', $event.target.value)"
              />
            </div>
            <span class="current-value">当前值: {{ selectedNode?.config?.base?.appearance?.border?.color || '#e8e8e8' }}</span>
          </div>
          
          <div class="config-item">
            <label>边框宽度</label>
            <input 
              :value="selectedNode?.config?.base?.appearance?.border?.width || 1"
              type="number"
              min="0" 
              max="10" 
              class="number-input"
              @input="updateNodeConfig('base.appearance.border.width', Number($event.target.value))"
            />
            <span class="current-value">当前值: {{ selectedNode?.config?.base?.appearance?.border?.width || 1 }}px</span>
          </div>
        </div>
      </div>

      <!-- 交互配置 -->
      <div v-if="activeNodeTab === 'interaction'" class="config-section">
        <h4>交互行为</h4>
        <div class="config-items">
          <div class="config-item">
            <label>点击行为</label>
            <select 
              :value="selectedNode?.config?.interaction?.onClick?.type || 'none'"
              class="select-input"
              @change="updateNodeConfig('interaction.onClick.type', $event.target.value)"
            >
              <option value="none">无动作</option>
              <option value="navigate">页面跳转</option>
              <option value="popup">弹窗</option>
              <option value="action">自定义动作</option>
            </select>
            <span class="current-value">当前值: {{ selectedNode?.config?.interaction?.onClick?.type || 'none' }}</span>
          </div>
          
          <div v-if="selectedNode?.config?.interaction?.onClick?.type === 'navigate'" class="config-item">
            <label>跳转地址</label>
            <input 
              :value="selectedNode?.config?.interaction?.onClick?.target || ''"
              type="text"
              placeholder="https://example.com"
              class="text-input"
              @input="updateNodeConfig('interaction.onClick.target', $event.target.value)"
            />
            <span class="current-value">目标: {{ selectedNode?.config?.interaction?.onClick?.target || '未设置' }}</span>
          </div>
        </div>
      </div>

      <!-- 内容配置 -->
      <div v-if="activeNodeTab === 'content'" class="config-section">
        <h4>内容配置</h4>
        <div class="config-items">
          <div v-for="(configItem, key) in selectedNode?.config?.content" :key="key" class="config-item">
            <label>{{ configItem.label || key }}</label>
            
            <!-- 文本输入 -->
            <input 
              v-if="configItem.type === 'text'"
              :value="configItem.value"
              type="text"
              class="text-input"
              @input="updateNodeContent(key, $event.target.value)"
            />
            
            <!-- 颜色选择 -->
            <div v-else-if="configItem.type === 'color'" class="color-input-group">
              <input 
                :value="configItem.value"
                type="color"
                class="color-input"
                @input="updateNodeContent(key, $event.target.value)"
              />
              <input 
                :value="configItem.value"
                type="text"
                class="text-input"
                @input="updateNodeContent(key, $event.target.value)"
              />
            </div>
            
            <!-- 数字输入 -->
            <input 
              v-else-if="configItem.type === 'number'"
              :value="configItem.value"
              type="number"
              :min="configItem.min"
              :max="configItem.max"
              class="number-input"
              @input="updateNodeContent(key, Number($event.target.value))"
            />
            
            <!-- 多行文本 -->
            <textarea 
              v-else-if="configItem.type === 'textarea'"
              :value="configItem.value"
              :rows="configItem.rows || 3"
              class="textarea-input"
              @input="updateNodeContent(key, $event.target.value)"
            ></textarea>
            
            <!-- 默认文本 -->
            <input 
              v-else
              :value="configItem.value"
              type="text"
              class="text-input"
              @input="updateNodeContent(key, $event.target.value)"
            />
            
            <span class="current-value">当前值: {{ configItem.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { usePanelStore } from '../state/panelStore';
import type { PanelConfig } from '../types';

const panelStore = usePanelStore();

// 当前选择的节点配置标签
const activeNodeTab = ref('basic');

// 节点配置标签定义
const nodeTabs = [
  { key: 'basic', label: '基础', icon: 'fa fa-cog' },
  { key: 'ui', label: 'UI', icon: 'fa fa-paint-brush' },
  { key: 'interaction', label: '交互', icon: 'fa fa-mouse-pointer' },
  { key: 'content', label: '内容', icon: 'fa fa-edit' }
];

// 计算属性
const hasSelection = computed(() => !!panelStore.selectedItemId);
const selectedNode = computed(() => 
  panelStore.selectedItemId ? 
  panelStore.cards.find(card => card.id === panelStore.selectedItemId) : 
  null
);
const panelConfig = computed(() => panelStore.config as PanelConfig);

// 监听选择变化，自动切换到基础标签
watch(hasSelection, (newVal) => {
  if (newVal) {
    activeNodeTab.value = 'basic';
  }
});

// 更新看板配置
const updatePanelConfig = (path: string, value: any) => {
  console.log('更新看板配置:', path, '=', value);
  panelStore.updatePanelConfig(path, value);
};

// 更新节点配置
const updateNodeConfig = (path: string, value: any) => {
  if (!selectedNode.value) return;
  
  console.log('更新节点配置:', selectedNode.value.id, path, '=', value);
  
  // 处理布局配置的特殊情况
  if (path.startsWith('layout.')) {
    const layoutKey = path.replace('layout.', '');
    const newLayout = { ...selectedNode.value.layout, [layoutKey]: value };
    panelStore.updateCardLayout(selectedNode.value.id, newLayout);
    return;
  }
  
  // 其他配置
  let configType: 'base' | 'interaction' | 'content';
  if (path.startsWith('base.')) {
    configType = 'base';
    path = path.substring(5);
  } else if (path.startsWith('interaction.')) {
    configType = 'interaction';
    path = path.substring(12);
  } else {
    configType = 'content';
  }
  
  panelStore.updateNodeConfig(selectedNode.value.id, configType, path, value);
};

// 更新节点内容
const updateNodeContent = (key: string, value: any) => {
  if (!selectedNode.value) return;
  
  console.log('更新节点内容:', selectedNode.value.id, key, '=', value);
  
  if (selectedNode.value.config.content && selectedNode.value.config.content[key]) {
    selectedNode.value.config.content[key].value = value;
    panelStore.saveToStorage();
  }
};
</script>

<style scoped>
.redesigned-inspector {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  overflow-y: auto;
}

.config-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background-color: #fafafa;
}

.config-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-header small {
  color: #666;
  font-weight: normal;
}

.node-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  background-color: #f9f9f9;
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  font-size: 12px;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tab-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.tab-btn.active {
  background-color: #1890ff;
  color: white;
}

.config-section {
  padding: 20px;
}

.config-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.config-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-item label {
  font-size: 12px;
  font-weight: 500;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-item input[type="checkbox"] {
  margin: 0;
}

.current-value {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

.number-input, .text-input, .select-input, .textarea-input {
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  transition: border-color 0.3s;
}

.number-input:focus, .text-input:focus, .select-input:focus, .textarea-input:focus {
  border-color: #40a9ff;
  outline: none;
}

.readonly {
  background-color: #f5f5f5;
  color: #999;
}

.color-input-group {
  display: flex;
  gap: 6px;
  align-items: center;
}

.color-input {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.color-input-group .text-input {
  flex: 1;
}
</style>