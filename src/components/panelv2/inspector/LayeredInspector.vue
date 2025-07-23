<template>
  <div class="layered-inspector">
    <div v-if="selectedItem" class="inspector-content">
      <!-- 配置标签切换 -->
      <div class="config-tabs">
        <button 
          v-for="tab in configTabs" 
          :key="tab.key"
          :class="['tab-button', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- 看板配置 -->
      <div v-if="activeTab === 'panel' && isPanelSelected" class="config-section">
        <h4>看板配置</h4>
        
        <!-- 布局配置 -->
        <div class="config-group">
          <h5>布局设置</h5>
          <ConfigControl
            v-model="panelConfig.layout.gridColumns"
            type="number-input"
            label="网格列数"
            :min="6"
            :max="24"
            @update:modelValue="updatePanelConfig('layout.gridColumns', $event)"
          />
          <ConfigControl
            v-model="panelConfig.layout.cellHeight"
            type="number-input"
            label="单元格高度"
            :min="40"
            :max="120"
            @update:modelValue="updatePanelConfig('layout.cellHeight', $event)"
          />
          <ConfigControl
            v-model="panelConfig.layout.margin"
            type="number-input"
            label="卡片间距"
            :min="0"
            :max="20"
            @update:modelValue="updatePanelConfig('layout.margin', $event)"
          />
        </div>

        <!-- 外观配置 -->
        <div class="config-group">
          <h5>外观设置</h5>
          <ConfigControl
            v-model="panelConfig.appearance.backgroundColor"
            type="color-picker"
            label="背景色"
            @update:modelValue="updatePanelConfig('appearance.backgroundColor', $event)"
          />
        </div>

        <!-- 交互配置 -->
        <div class="config-group">
          <h5>交互设置</h5>
          <ConfigControl
            v-model="panelConfig.interaction.allowDrag"
            type="switch"
            label="允许拖拽"
            @update:modelValue="updatePanelConfig('interaction.allowDrag', $event)"
          />
          <ConfigControl
            v-model="panelConfig.interaction.allowResize"
            type="switch"
            label="允许调整大小"
            @update:modelValue="updatePanelConfig('interaction.allowResize', $event)"
          />
        </div>
      </div>

      <!-- 节点基础配置 -->
      <div v-if="activeTab === 'base' && selectedNode" class="config-section">
        <h4>节点基础配置</h4>
        
        <!-- 布局配置 -->
        <div class="config-group">
          <h5>布局设置</h5>
          <div class="layout-grid">
            <ConfigControl
              v-model="selectedNode.config.base.layout.x"
              type="number-input"
              label="X位置"
              :min="0"
              readonly
            />
            <ConfigControl
              v-model="selectedNode.config.base.layout.y"
              type="number-input"
              label="Y位置"
              :min="0"
              readonly
            />
            <ConfigControl
              v-model="selectedNode.config.base.layout.w"
              type="number-input"
              label="宽度"
              :min="1"
              :max="panelConfig.layout.gridColumns"
              @update:modelValue="updateNodeConfig('base.layout.w', $event)"
            />
            <ConfigControl
              v-model="selectedNode.config.base.layout.h"
              type="number-input"
              label="高度"
              :min="1"
              :max="20"
              @update:modelValue="updateNodeConfig('base.layout.h', $event)"
            />
          </div>
        </div>

        <!-- 状态配置 -->
        <div class="config-group">
          <h5>状态设置</h5>
          <ConfigControl
            v-model="selectedNode.config.base.state.locked"
            type="switch"
            label="锁定位置"
            @update:modelValue="updateNodeConfig('base.state.locked', $event)"
          />
          <ConfigControl
            v-model="selectedNode.config.base.state.hidden"
            type="switch"
            label="隐藏节点"
            @update:modelValue="updateNodeConfig('base.state.hidden', $event)"
          />
        </div>

        <!-- 外观配置 -->
        <div class="config-group">
          <h5>外观设置</h5>
          <ConfigControl
            v-model="selectedNode.config.base.appearance.border?.color"
            type="color-picker"
            label="边框颜色"
            @update:modelValue="updateNodeAppearance('border.color', $event)"
          />
          <ConfigControl
            v-model="selectedNode.config.base.appearance.border?.width"
            type="number-input"
            label="边框宽度"
            :min="0"
            :max="10"
            @update:modelValue="updateNodeAppearance('border.width', $event)"
          />
        </div>
      </div>

      <!-- 节点交互配置 -->
      <div v-if="activeTab === 'interaction' && selectedNode" class="config-section">
        <h4>节点交互配置</h4>
        
        <!-- 点击行为 -->
        <div class="config-group">
          <h5>点击行为</h5>
          <ConfigControl
            v-model="selectedNode.config.interaction.onClick?.type"
            type="select"
            label="点击类型"
            :options="[
              { value: 'none', label: '无动作' },
              { value: 'navigate', label: '页面跳转' },
              { value: 'popup', label: '弹窗' },
              { value: 'action', label: '自定义动作' }
            ]"
            @update:modelValue="updateNodeInteraction('onClick.type', $event)"
          />
          <ConfigControl
            v-if="selectedNode.config.interaction.onClick?.type === 'navigate'"
            v-model="selectedNode.config.interaction.onClick.target"
            type="text-input"
            label="跳转地址"
            @update:modelValue="updateNodeInteraction('onClick.target', $event)"
          />
        </div>

        <!-- 悬停行为 -->
        <div class="config-group">
          <h5>悬停行为</h5>
          <ConfigControl
            v-model="selectedNode.config.interaction.onHover?.tooltip"
            type="text-input"
            label="提示内容"
            @update:modelValue="updateNodeInteraction('onHover.tooltip', $event)"
          />
          <ConfigControl
            v-model="selectedNode.config.interaction.onHover?.highlight"
            type="switch"
            label="悬停高亮"
            @update:modelValue="updateNodeInteraction('onHover.highlight', $event)"
          />
        </div>
      </div>

      <!-- 节点内容配置 -->
      <div v-if="activeTab === 'content' && selectedNode" class="config-section">
        <h4>节点内容配置</h4>
        
        <div class="config-group">
          <div v-for="(configItem, key) in selectedNode.config.content" :key="key">
            <ConfigControl
              :modelValue="configItem.value"
              :type="getControlType(configItem)"
              :label="configItem.label || key"
              :description="configItem.description"
              :options="configItem.options"
              :min="configItem.min"
              :max="configItem.max"
              @update:modelValue="updateNodeContent(key, $event)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="placeholder">
      <p>请选择一个节点或看板进行配置</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { usePanelStore } from '../state/panelStore';
import ConfigControl from './components/ConfigControl.vue';
import type { PanelConfig, ConfigItem } from '../types';

const panelStore = usePanelStore();

// 当前激活的配置标签
const activeTab = ref('content');

// 配置标签定义
const configTabs = [
  { key: 'panel', label: '看板', icon: 'fa fa-dashboard' },
  { key: 'base', label: '基础', icon: 'fa fa-cog' },
  { key: 'interaction', label: '交互', icon: 'fa fa-mouse-pointer' },
  { key: 'content', label: '内容', icon: 'fa fa-edit' }
];

// 计算属性
const selectedItem = computed(() => panelStore.selectedItem);
const isPanelSelected = computed(() => !panelStore.selectedItemId);
const selectedNode = computed(() => 
  panelStore.selectedItemId ? 
  panelStore.cards.find(card => card.id === panelStore.selectedItemId) : 
  null
);

const panelConfig = computed(() => panelStore.config as PanelConfig);

// 根据配置项获取控件类型
const getControlType = (configItem: ConfigItem) => {
  const typeMapping = {
    'text': 'text-input',
    'textarea': 'textarea',
    'number': 'number-input',
    'color': 'color-picker',
    'select': 'select',
    'switch': 'switch',
    'checkbox': 'checkbox'
  };
  return typeMapping[configItem.type] || 'text-input';
};

// 更新看板配置
const updatePanelConfig = (path: string, value: any) => {
  const keys = path.split('.');
  let target = panelConfig.value as any;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  
  target[keys[keys.length - 1]] = value;
  panelStore.saveToStorage();
};

// 更新节点配置
const updateNodeConfig = (path: string, value: any) => {
  if (!selectedNode.value) return;
  
  const keys = path.split('.');
  let target = selectedNode.value.config as any;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  
  target[keys[keys.length - 1]] = value;
  
  // 同步布局信息
  if (path.startsWith('base.layout')) {
    const layoutKey = keys[keys.length - 1];
    selectedNode.value.layout[layoutKey] = value;
  }
  
  panelStore.saveToStorage();
};

// 更新节点外观
const updateNodeAppearance = (path: string, value: any) => {
  if (!selectedNode.value) return;
  
  const keys = path.split('.');
  let target = selectedNode.value.config.base.appearance as any;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  
  target[keys[keys.length - 1]] = value;
  panelStore.saveToStorage();
};

// 更新节点交互
const updateNodeInteraction = (path: string, value: any) => {
  if (!selectedNode.value) return;
  
  const keys = path.split('.');
  let target = selectedNode.value.config.interaction as any;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  
  target[keys[keys.length - 1]] = value;
  panelStore.saveToStorage();
};

// 更新节点内容
const updateNodeContent = (key: string, value: any) => {
  if (!selectedNode.value) return;
  
  if (selectedNode.value.config.content[key]) {
    selectedNode.value.config.content[key].value = value;
    panelStore.saveToStorage();
  }
};
</script>

<style scoped>
.layered-inspector {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.config-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.tab-button {
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

.tab-button:hover {
  background-color: #f5f5f5;
  color: #333;
}

.tab-button.active {
  background-color: #1890ff;
  color: white;
}

.inspector-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.config-group {
  margin-bottom: 24px;
}

.config-group h5 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  text-transform: uppercase;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>